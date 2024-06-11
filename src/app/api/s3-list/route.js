// pages/api/getUserFolderContents.js
import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { users } from "../../../app/api/login/users";
const userId = users[0].id;

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY,
  },
});

async function getUserFolderContents(userId) {
  try {
    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
      Prefix: `users/${userId}/`,
    };

    console.log(userId);

    const command = new ListObjectsV2Command(params);
    const data = await s3Client.send(command);

    if (!data.Contents) {
      return [];
    }

    const fourthLevelFolders = data.Contents.filter((item) => {
      const parts = item.Key.split("/");

      return parts.length === 4 && item.Key.endsWith("/");
    }).map((item) => item.Key.split("/")[2] );

    return fourthLevelFolders;
  } catch (error) {
    console.error("Error fetching user folder contents:", error);
    throw new Error("Could not fetch user folder contents");
  }
}
async function getFolderContents(userId, folderName) {
  try {
    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
      Prefix: `users/${userId}/${folderName}/`, // Include folder name in Prefix
    };



    const command = new ListObjectsV2Command(params);
    const data = await s3Client.send(command);

    if (!data.Contents) {
      return [];
    }

    // Extract file names from folder contents without directory path
    const fileNames = data.Contents.map((item) => {
      const fileNameWithDirectory = item.Key;
      const fileName = fileNameWithDirectory.substring(fileNameWithDirectory.lastIndexOf('/') + 1);

      return fileName;
    });

    return fileNames;
  } catch (error) {
    console.error("Error fetching folder contents:", error);
    throw new Error("Could not fetch folder contents");
  }
}



export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const folderName = searchParams.get("folder");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    let contents;
    if (folderName) {
      contents = await getFolderContents(userId, folderName);
    } else {
      contents = await getUserFolderContents(userId);
    }

    return NextResponse.json({ success: true, contents });
  } catch (error) {
    console.error("Error handling GET request:", error);

    return NextResponse.json({ error: "Error fetching contents" }, { status: 500 });
  }
}
