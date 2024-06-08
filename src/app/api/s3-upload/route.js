import { NextResponse } from "next/server";
import { S3Client, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { users } from "../login/users"; // Import the users array

const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_S3_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY,
    }
});

async function createFolderIfNotExists(folderPath) {
    try {
        const params = {
            Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
            Key: folderPath,
            Body: "" // Empty body because we are creating a folder
        };

        const command = new PutObjectCommand(params);
        await s3Client.send(command);
    } catch (error) {
        console.error("Error creating folder:", error);
        throw error;
    }
}

async function uploadFileToS3(file, fileName, userId) {
  try {
      const fileBuffer = file;

      // Create user's folder if not exists
      const userFolderPath = `users/${userId}/`;
      await createFolderIfNotExists(userFolderPath);

      let fileCategory;
      // Determine file category based on file extension
      if (fileName.endsWith(".pdf")) {
          fileCategory = "pdfs";
      } else if (fileName.endsWith(".mp4") || fileName.endsWith(".avi") || fileName.endsWith(".mov")) {
          fileCategory = "videos";
      } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png") || fileName.endsWith(".gif")) {
          fileCategory = "images";
      } else if (fileName.endsWith(".mp3") || fileName.endsWith(".WAV") || fileName.endsWith(".ogg")) {
          fileCategory = "audio";
      } else {
          fileCategory = "other-files";
      }

      // Create category folder if not exists
      const categoryFolderPath = `${userFolderPath}${fileCategory}/`;
      await createFolderIfNotExists(categoryFolderPath);

      // Check if the file with the same name already exists
      const headParams = {
          Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
          Key: `${categoryFolderPath}${fileName}`
      };

      try {
          await s3Client.send(new HeadObjectCommand(headParams));
          console.log("File already exists. Skipping upload.");

          return fileName;
      } catch (err) {
          // File doesn't exist, proceed with upload
          console.log("File doesn't exist. Uploading...");
      }

      const params = {
          Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
          Key: `${categoryFolderPath}${fileName}`,
          Body: fileBuffer,
          ContentType: "application/octet-stream" // Change content type according to your file type
      };

      const command = new PutObjectCommand(params);

      await s3Client.send(command);

      return fileName;
  } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw error;
  }
}


export async function POST(request) {
    try {
        if (!request) {
            return NextResponse.json({ error: "Request is required." }, { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "File is required." }, { status: 400 });
        }

        // Assuming you want to upload the file for the first user in the users array
        const userId = users[0].id;

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = await uploadFileToS3(buffer, file.name, userId);

        return NextResponse.json({ success: true, fileName });
    } catch (error) {
        console.error("Error handling POST request:", error);

        return NextResponse.json({ error: "Error uploading file" });
    }
}
