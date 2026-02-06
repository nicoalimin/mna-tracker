/**
 * API Route for getting a signed download URL for a meeting note
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSignedUrl } from "@/lib/s3";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get a signed URL for downloading/previewing a meeting note
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Meeting note ID is required" },
        { status: 400 }
      );
    }

    // Get the record to find the S3 key
    const result = await db.query(
      `SELECT file_link, file_name FROM minutes_of_meeting WHERE id = $1`,
      [id]
    );

    const record = result.rows[0];

    if (!record) {
      return NextResponse.json(
        { error: "Meeting note not found" },
        { status: 404 }
      );
    }

    // Generate signed URL
    const url = await getSignedUrl(record.file_link);

    return NextResponse.json({
      success: true,
      url,
      fileName: record.file_name,
    });
  } catch (error) {
    console.error("Get download URL error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to get download URL" },
      { status: 500 }
    );
  }
}
