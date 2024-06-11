import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { Readable } from 'stream';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function uploadToS3(fileBuffer: Buffer, fileName: string, fileType: string) {
  console.log('Uploading to S3...');
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: fileName,
    Body: fileBuffer,
    ContentType: fileType,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  console.log('Uploaded to S3:', s3Url);
  return s3Url;
}

async function downloadFromS3(fileKey: string) {
  console.log('Downloading from S3 with key:', fileKey);
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: fileKey,
  };

  const command = new GetObjectCommand(params);
  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error('No data found in S3 object');
  }

  // Ensure the storage directory exists
  const storageDir = path.join(process.cwd(), 'storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const filePath = path.join(storageDir, path.basename(fileKey));
  const fileStream = fs.createWriteStream(filePath);

  return new Promise<string>((resolve, reject) => {
    const readableStream = response.Body as Readable;
    readableStream.pipe(fileStream);
    readableStream.on('end', () => resolve(filePath));
    readableStream.on('error', reject);
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log('Receiving request...');
    const formData = await req.formData();

    console.log('Received FormData:', formData);

    const audioFile = formData.get('audio') as File;

    if (!(audioFile instanceof File)) {
      console.error('No audio file provided or invalid file type.');
      return NextResponse.error();
    }

    console.log('Audio file name:', audioFile.name);
    console.log('Audio file size:', audioFile.size);
    console.log('Audio file type:', audioFile.type);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const storageDir = path.join(process.cwd(), 'storage');

    if (!fs.existsSync(storageDir)) {
      console.log('Creating storage directory...');
      fs.mkdirSync(storageDir, { recursive: true });
    }

    console.log('Storing audio file locally...');
    const audioBuffer = await audioFile.arrayBuffer();
    const inputFilePath = path.join(storageDir, audioFile.name);
    await fs.promises.writeFile(inputFilePath, Buffer.from(audioBuffer));
    console.log('Stored audio file at:', inputFilePath);

    console.log('Reading audio file...');
    const audioBlob = await fs.promises.readFile(inputFilePath);

    const s3Url = await uploadToS3(audioBlob, path.basename(inputFilePath), audioFile.type);

    console.log('Uploaded S3 URL:', s3Url);

    console.log('Cleaning up temporary files...');
    await fs.promises.unlink(inputFilePath);

    const s3Path = `s3://${process.env.AWS_S3_BUCKET_NAME}/${path.basename(inputFilePath)}`;
    console.log('Requesting conversion to MP3 with s3_path:', s3Path);
    const conversionResponse = await fetch('https://processor.digivox.ai/videoprocess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        s3_path: s3Path,
      }),
    });

    console.log('Conversion API Response status:', conversionResponse.status);
    const conversionResult = await conversionResponse.json();
    console.log('Conversion API Response body:', conversionResult);

    if (!conversionResponse.ok) {
      console.error('Error converting video to MP3:', conversionResult.error);
      return NextResponse.json({ error: 'Error converting video to MP3' }, { status: 500 });
    }

    const mp3S3Path = conversionResult.mp3_s3_path;
    console.log('Converted MP3 S3 URL:', mp3S3Path);

    const mp3FileKey = mp3S3Path.split('/').slice(3).join('/');
    console.log('MP3 file key:', mp3FileKey);

    console.log('Downloading converted MP3 from S3...');
    const mp3FilePath = await downloadFromS3(mp3FileKey);

    console.log('Transcribing MP3...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(mp3FilePath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    console.log('Transcription complete:', transcription);

    // Sending transcription to webhook


    console.log('Sending transcription to webhook...');
    const webhookResponse = await fetch('https://flowai.digivox.ai/webhook-test/e5f5df0d-c55e-42e2-a9a6-8b006ade9759', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcription: transcription,
      }),
    });

    console.log('Webhook response status:', webhookResponse.status);
    const webhookResponseBody = await webhookResponse.json();
    console.log('Webhook response body:', webhookResponseBody);

    return NextResponse.json(transcription);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.error();
  }
}
