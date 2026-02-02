/**
 * API Route for getting a signed download URL for a meeting note
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSignedUrl } from "@/lib/s3";

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

    const supabase = getSupabaseClient();

    // Get the record to find the S3 key
    const { data: record, error: fetchError } = await supabase
      .from("minutes_of_meeting")
      .select("file_link, file_name")
      .eq("id", id)
      .single();

    if (fetchError || !record) {
      console.error("Record not found:", fetchError);
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
