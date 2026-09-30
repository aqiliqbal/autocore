import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing."
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing."
  );
}

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "No image file was provided.",
        },
        {
          status: 400,
        }
      );
    }

    /* ----------------------------------------
       FILE TYPE VALIDATION
    ---------------------------------------- */

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Only JPG, PNG, WEBP and GIF images are allowed.",
        },
        {
          status: 400,
        }
      );
    }

    /* ----------------------------------------
       FILE SIZE VALIDATION
       Maximum: 5 MB
    ---------------------------------------- */

    const maxFileSize =
      5 * 1024 * 1024;

    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          error:
            "Image size must be less than 5 MB.",
        },
        {
          status: 400,
        }
      );
    }

    /* ----------------------------------------
       CREATE UNIQUE FILE NAME
    ---------------------------------------- */

    const extension =
      file.name.split(".").pop()?.toLowerCase() ||
      "jpg";

    const fileName =
      `${crypto.randomUUID()}.${extension}`;

    const filePath =
      `parts/${fileName}`;

    /* ----------------------------------------
       CONVERT FILE
    ---------------------------------------- */

    const arrayBuffer =
      await file.arrayBuffer();

    const fileBuffer =
      Buffer.from(arrayBuffer);

    /* ----------------------------------------
       UPLOAD TO SUPABASE STORAGE
    ---------------------------------------- */

    const { error: uploadError } =
      await supabaseAdmin.storage
        .from("part-images")
        .upload(
          filePath,
          fileBuffer,
          {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
          }
        );

    if (uploadError) {
      console.error(
        "Supabase image upload error:",
        uploadError
      );

      return NextResponse.json(
        {
          error:
            uploadError.message ||
            "Failed to upload image.",
        },
        {
          status: 500,
        }
      );
    }

    /* ----------------------------------------
       GET PUBLIC URL
    ---------------------------------------- */

    const {
      data: publicUrlData,
    } =
      supabaseAdmin.storage
        .from("part-images")
        .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return NextResponse.json(
        {
          error:
            "Image uploaded but public URL could not be generated.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        imageUrl:
          publicUrlData.publicUrl,
        path: filePath,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Part image upload failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload part image.",
      },
      {
        status: 500,
      }
    );
  }
}