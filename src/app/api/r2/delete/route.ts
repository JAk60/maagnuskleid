import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "No image URL provided" },
        { status: 400 }
      );
    }

    // Extract key from URL
    // Expected format: https://cdn.magnuskleid.com/products/xyz.jpg
    let key: string;
    
    if (imageUrl.startsWith(R2_PUBLIC_URL)) {
      // R2 image
      key = imageUrl.replace(`${R2_PUBLIC_URL}/`, "");
    } else {
      // Not an R2 image, skip deletion
      return NextResponse.json({
        success: true,
        message: "Non-R2 image, skipped deletion",
      });
    }

    // Delete from R2
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
      key,
    });

  } catch (error) {
    console.error("R2 delete error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Delete failed" 
      },
      { status: 500 }
    );
  }
}