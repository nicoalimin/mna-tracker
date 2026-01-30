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

/**
 * GET - Generate a pre-signed download URL for a specific meeting note
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Meeting note ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch the meeting note to get the S3 key and original filename
    const { data, error } = await supabase
      .from("minutes_of_meeting")
      .select("file_link, file_name")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Database query error:", error);
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
