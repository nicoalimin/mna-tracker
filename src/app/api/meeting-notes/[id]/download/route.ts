import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSignedUrl } from "@/lib/s3";

/**
 * GET - Generate a pre-signed download URL for a specific meeting note
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Meeting note ID is required" },
        { status: 400 }
      );
    }

    // Fetch the meeting note to get the S3 key and original filename
    const { rows } = await db.query(
      `SELECT file_link, file_name FROM minutes_of_meeting WHERE id = $1`,
      [id]
    );

    const data = rows[0];

    if (!data) {
      return NextResponse.json(
        { error: "Meeting note not found" },
        { status: 404 }
      );
    }

    // Generate a pre-signed URL that forces a browser download with the original filename
    const downloadUrl = await getSignedUrl(data.file_link, 3600, data.file_name);

    return NextResponse.json({
      success: true,
      download_url: downloadUrl,
    });
  } catch (error) {
    console.error("Generate download URL error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
