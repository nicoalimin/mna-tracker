/**
 * API Route for Meeting Notes
 * Handles POST (upload) and GET (list) requests for meeting notes
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadFile, getSignedUrl, generateMeetingNoteKey } from "@/lib/s3";
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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Read file content and upload to S3
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const s3Key = generateMeetingNoteKey(file.name);
    await uploadFile(buffer, s3Key, file.type || "application/octet-stream");

    const supabase = getSupabaseClient();

    // Initial insert with 'processing' status
    const { data: initialData, error: insertError } = await supabase
      .from("minutes_of_meeting")
      .insert({
        file_name: file.name,
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
      rawText = await extractTextFromFile(buffer, file.type || "application/octet-stream", file.name);

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

    return NextResponse.json({
      success: true,
      data: {
        ...updatedData,
        signed_url: signedUrl,
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
          return {
            ...note,
            signed_url: signedUrl,
          };
        } catch (urlError) {
          console.error(`Error generating signed URL for ${note.file_link}:`, urlError);
          return {
            ...note,
            signed_url: null,
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
