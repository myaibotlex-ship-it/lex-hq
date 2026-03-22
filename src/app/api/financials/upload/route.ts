import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const company = formData.get("company") as string;
    const reportType = formData.get("reportType") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique filename
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${company.toLowerCase().replace(/\s+/g, "-")}_${reportType}_${timestamp}_${file.name}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("financial-reports")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      // If bucket doesn't exist, create it
      if (uploadError.message.includes("not found")) {
        await supabase.storage.createBucket("financial-reports", { public: false });
        // Retry upload
        const { error: retryError } = await supabase.storage
          .from("financial-reports")
          .upload(filename, buffer, { contentType: file.type, upsert: true });
        if (retryError) throw retryError;
      } else {
        throw uploadError;
      }
    }

    // Log the upload to database
    const { error: dbError } = await supabase.from("financial_uploads").insert({
      company,
      report_type: reportType,
      filename,
      original_filename: file.name,
      file_size: buffer.length,
      mime_type: file.type,
      status: "pending_review",
    });

    // If table doesn't exist, that's okay - we'll create it
    if (dbError && !dbError.message.includes("does not exist")) {
      console.error("DB log error:", dbError);
    }

    return NextResponse.json({
      success: true,
      filename,
      message: `${file.name} uploaded successfully for ${company}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
