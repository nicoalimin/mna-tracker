import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/s3";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE - Remove a meeting note
 * Deletes both the S3 file and the database record
 */
export async function DELETE(
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

    // First, get the record to find the S3 key
    const { rows } = await db.query(
      `SELECT file_link FROM minutes_of_meeting WHERE id = $1`,
      [id]
    );

    const record = rows[0];

    if (!record) {
      return NextResponse.json(
        { error: "Meeting note not found" },
        { status: 404 }
      );
    }

    // Delete from S3
    try {
      await deleteFile(record.file_link);
    } catch (s3Error) {
      console.error("S3 delete error:", s3Error);
      // Continue with database deletion even if S3 fails
    }

    // Delete from database
    await db.query(`DELETE FROM minutes_of_meeting WHERE id = $1`, [id]);

    return NextResponse.json({
      success: true,
      message: "Meeting note deleted successfully",
    });
  } catch (error) {
    console.error("Delete meeting note error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete meeting note" },
      { status: 500 }
    );
  }
}
