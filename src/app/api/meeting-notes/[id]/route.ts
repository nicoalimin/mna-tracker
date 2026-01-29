/**
 * API Route for individual Meeting Note operations
 * Handles DELETE requests for specific meeting notes
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deleteFile } from "@/lib/s3";

// Create a server-side Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, key);
}

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

    const supabase = getSupabaseClient();

    // First, get the record to find the S3 key
    const { data: record, error: fetchError } = await supabase
      .from("minutes_of_meeting")
      .select("file_link")
      .eq("id", id)
      .single();

    if (fetchError || !record) {
      console.error("Record not found:", fetchError);
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
    const { error: deleteError } = await supabase
      .from("minutes_of_meeting")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Database delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete meeting note record" },
        { status: 500 }
      );
    }

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
