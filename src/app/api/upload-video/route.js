import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import fetch from 'node-fetch'

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY
  }
})

async function createFolderIfNotExists(folderPath) {
  try {
    console.log(`Creating folder: ${folderPath}`)
    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
      Key: folderPath,
      Body: '' // Empty body because we are creating a folder
    }

    const command = new PutObjectCommand(params)
    await s3Client.send(command)
    console.log(`Folder created: ${folderPath}`)
  } catch (error) {
    console.error('Error creating folder:', error)
    throw error
  }
}

async function downloadAudioFile(s3Path) {
  try {
    console.log(`Downloading audio file from S3 path: ${s3Path}`)
    const { Bucket, Key } = parseS3Path(s3Path)

    const params = {
      Bucket,
      Key
    }

    const command = new GetObjectCommand(params)
    const { Body } = await s3Client.send(command)

    const fileStream = fs.createWriteStream(path.join(process.cwd(), 'storage', 'audio', 'audio.mp3'))

    // Pipe the stream to the file stream
    Body.pipe(fileStream)
    console.log(`Audio file downloaded: audio.mp3`)

    return 'audio.mp3'
  } catch (error) {
    console.error('Error downloading audio file:', error)
    throw error
  }
}

function parseS3Path(s3Path) {
  const regex = /^s3:\/\/([^/]+)\/(.+)$/ // Regex to parse S3 path
  const matches = s3Path.match(regex)

  if (!matches || matches.length !== 3) {
    throw new Error('Invalid S3 path format')
  }

  return {
    Bucket: matches[1],
    Key: matches[2]
  }
}

export async function POST(request) {
  try {
    console.log('POST request received')

    if (!request) {
      console.error('Request is required.')
      return NextResponse.json({ error: 'Request is required.' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      console.error('File is required.')
      return NextResponse.json({ error: 'File is required.' }, { status: 400 })
    }

    console.log('File received:', file.name)

    // Create folder 'video_to_tran' if not exists
    const folderPath = 'video_to_tran/'
    await createFolderIfNotExists(folderPath)

    // Check if the file is a video file
    if (!file.type.startsWith('video')) {
      console.error('Only video files are allowed.')
      return NextResponse.json({ error: 'Only video files are allowed.' }, { status: 400 })
    }

    console.log('File is a valid video type:', file.type)

    // Upload the video file
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name
    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
      Key: `${folderPath}${fileName}`,
      Body: buffer,
      ContentType: file.type // Use the correct content type
    }

    const uploadCommand = new PutObjectCommand(params)
    await s3Client.send(uploadCommand)
    console.log('Video file uploaded to S3:', `${folderPath}${fileName}`)

    // Construct the file path
    const s3Path = `s3://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}/${folderPath}${fileName}`
    console.log('S3 Path constructed:', s3Path)

    // Construct the object with the desired structure
    const requestData = {
      s3_path: s3Path
    }

    return NextResponse.json({ success: true, s3Path })
  } catch (error) {
    console.error('Error handling POST request:', error)

    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}
