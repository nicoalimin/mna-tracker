/**
 * API Route for Meeting Notes
 * Handles POST (upload) and GET (list) requests for meeting notes
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadFile, getSignedUrl, generateMeetingNoteKey, downloadFile } from "@/lib/s3";
import { extractTextFromFile } from "@/lib/fileExtractor";
import { processFileContent } from "@/lib/file_processing_agent";

// Create a server-side Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, key);
}

/**
 * POST - Upload a new meeting note file
 */
export async function POST(request: NextRequest) {
  try {
    const { key, fileName, contentType } = await request.json();

    if (!key || !fileName) {
      return NextResponse.json(
        { error: "key and fileName are required" },
        { status: 400 }
      );
    }

    // Download file content from S3
    const buffer = await downloadFile(key);
    const s3Key = key;
    const fileType = contentType || "application/octet-stream";

    const supabase = getSupabaseClient();

    // Initial insert with 'processing' status
    const { data: initialData, error: insertError } = await supabase
      .from("minutes_of_meeting")
      .insert({
        file_name: fileName,
        file_link: s3Key,
        processing_status: 'processing'
      })
      .select()
      .single();

    if (insertError || !initialData) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create meeting note record" },
        { status: 500 }
      );
    }

    // Process file in the background (or continue in-thread for now)
    // In a production app, this would be a background job
    let rawText = "";
    let structuredResult = null;
    let tags: string[] = [];
    let matched_companies: any[] = [];

    try {
      // 1. Extract raw text from supported formats
      rawText = await extractTextFromFile(buffer, fileType, fileName);

      // 2. Invoke the agent to structure the text
      structuredResult = await processFileContent(rawText);

      if (structuredResult) {
        tags = structuredResult.tags || [];
        matched_companies = structuredResult.matched_companies || [];
      }

      // 3. Update the record with full technical results
      await supabase
        .from("minutes_of_meeting")
        .update({
          raw_notes: rawText,
          structured_notes: structuredResult ? JSON.stringify(structuredResult, null, 2) : null,
          tags: tags,
          matched_companies: matched_companies,
          file_date: structuredResult?.file_date || null,
          processing_status: 'completed'
        })
        .eq('id', initialData.id);

    } catch (processError) {
      console.error("Error during file processing:", processError);
      await supabase
        .from("minutes_of_meeting")
        .update({
          processing_status: 'failed',
          raw_notes: rawText || "Extraction failed"
        })
        .eq('id', initialData.id);
    }

    // Fetch the updated record
    const { data: updatedData } = await supabase
      .from("minutes_of_meeting")
      .select("*")
      .eq('id', initialData.id)
      .single();

    const signedUrl = await getSignedUrl(s3Key);
    const downloadUrl = await getSignedUrl(s3Key, 3600, fileName);

    return NextResponse.json({
      success: true,
      data: {
        ...updatedData,
        signed_url: signedUrl,
        download_url: downloadUrl,
      },
    });
  } catch (error) {
    console.error("Upload meeting note error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to upload meeting note" },
      { status: 500 }
    );
  }
}

/**
 * GET - List all meeting notes with signed URLs
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("minutes_of_meeting")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch meeting notes" },
        { status: 500 }
      );
    }

    // Generate signed URLs for all files
    const notesWithUrls = await Promise.all(
      (data || []).map(async (note) => {
        try {
          const signedUrl = await getSignedUrl(note.file_link);
          const downloadUrl = await getSignedUrl(note.file_link, 3600, note.file_name);
          return {
            ...note,
            signed_url: signedUrl,
            download_url: downloadUrl,
          };
        } catch (urlError) {
          console.error(`Error generating signed URL for ${note.file_link}:`, urlError);
          return {
            ...note,
            signed_url: null,
            download_url: null,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: notesWithUrls,
    });
  } catch (error) {
    console.error("Fetch meeting notes error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch meeting notes" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a meeting note
 */
export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Meeting note ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("minutes_of_meeting")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database update error:", error);
      return NextResponse.json(
        { error: "Failed to update meeting note" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Update meeting note error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update meeting note" },
      { status: 500 }
    );
  }
}
