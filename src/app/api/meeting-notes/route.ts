/**
 * API Route for Meeting Notes
 * Handles POST (upload) and GET (list) requests for meeting notes
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadFile, getSignedUrl, generateMeetingNoteKey, downloadFile } from "@/lib/s3";
import { extractTextFromFile } from "@/lib/fileExtractor";
import { processFileContent } from "@/lib/file_processing_agent";

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

    // Initial insert with 'processing' status
    const insertResult = await db.query(
      `INSERT INTO minutes_of_meeting (file_name, file_link, processing_status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [fileName, s3Key, 'processing']
    );

    const initialData = insertResult.rows[0];

    if (!initialData) {
      console.error("Database insert error");
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
      await db.query(
        `UPDATE minutes_of_meeting
         SET raw_notes = $1,
             structured_notes = $2,
             tags = $3,
             matched_companies = $4,
             file_date = $5,
             processing_status = $6
         WHERE id = $7`,
        [
          rawText,
          structuredResult ? JSON.stringify(structuredResult, null, 2) : null,
          tags,
          JSON.stringify(matched_companies),
          structuredResult?.file_date || null,
          'completed',
          initialData.id
        ]
      );

    } catch (processError) {
      console.error("Error during file processing:", processError);
      await db.query(
        `UPDATE minutes_of_meeting
         SET processing_status = $1,
             raw_notes = $2
         WHERE id = $3`,
        ['failed', rawText || "Extraction failed", initialData.id]
      );
    }

    // Fetch the updated record
    const updatedResult = await db.query(
      `SELECT * FROM minutes_of_meeting WHERE id = $1`,
      [initialData.id]
    );
    const updatedData = updatedResult.rows[0];

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
    const result = await db.query(
      `SELECT * FROM minutes_of_meeting ORDER BY created_at DESC`
    );
    const data = result.rows;

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

    // Construct dynamic update query
    const keys = Object.keys(updates);
    if (keys.length === 0) {
      return NextResponse.json({ success: true, data: null }); // Nothing to update
    }

    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(", ");
    const values = keys.map(key => updates[key]);

    // Add ID as the first parameter
    const query = `UPDATE minutes_of_meeting SET ${setClause} WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [id, ...values]);

    const data = result.rows[0];

    if (!data) {
      return NextResponse.json(
        { error: "Failed to update meeting note or note not found" },
        { status: 404 }
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
