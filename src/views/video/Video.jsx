'use client'

import { useState } from 'react'
import Button from '@mui/material/Button'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { CircularProgress, Typography } from '@mui/material'

const VideoUploadButton = ({ mode }) => {
  const [fileInput, setFileInput] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [transcriptionData, setTranscriptionData] = useState(null)
  const [webhookResponseBody, setWebhookResponseBody] = useState(null)
  const [error, setError] = useState(null)
  const [transcribing, setTranscribing] = useState(false)

  const handleFileInputChange = event => {
    const file = event.target.files[0]

    if (file) {
      setFileInput(file)
      setUploadProgress(0)
      setUploadComplete(false)
      setError(null)

      let progress = 0
      const interval = setInterval(() => {
        progress += 20
        setUploadProgress(progress)
        if (progress >= 100) {
          clearInterval(interval)
          setUploadComplete(true)
        }
      }, 1000)
    } else {
      setError('No file selected')
    }
  }

  const handleTranscribeClick = async () => {
    if (!fileInput) {
      setError('No file selected for transcription')
      return
    }

    setTranscribing(true)

    try {
      const formData = new FormData()
      formData.append('audio', fileInput)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setTranscriptionData(data.transcription)
        setWebhookResponseBody(data.webhookResponseBody)
        setError(null)
      } else {
        setError('Failed to start transcription')
      }
    } catch (error) {
      console.error('Error starting transcription:', error)
      setError('Error starting transcription')
    } finally {
      setTranscribing(false)
    }
  }

  const handleReset = () => {
    setFileInput(null)
    setUploadProgress(0)
    setUploadComplete(false)
    setTranscriptionData(null)
    setWebhookResponseBody(null)
    setError(null)
  }

  return (
    <div className="flex flex-col items-center min-h-screen justify-center p-4">
      <div className="flex flex-col items-center gap-6 w-full max-w-lg">
        {!uploadComplete ? (
          <>
            <Button component="label" variant="contained">
              {uploadProgress < 100 ? 'Upload Video' : 'Uploading...'}
              <input
                hidden
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/mkv,audio/mp3,video/m4a,video/wav"
                onChange={handleFileInputChange}
              />
            </Button>
            {uploadProgress > 0 && (
              <CircularProgress variant="determinate" value={uploadProgress} />
            )}
          </>
        ) : (
          <>
            <CheckCircleOutlineIcon sx={{ color: 'green', fontSize: 50 }} />
            <Typography variant="h6">Upload Complete</Typography>
            <Button variant="contained" color="primary" onClick={handleTranscribeClick}>
              {transcribing ? <CircularProgress size={24} style={{ color: 'white' }} /> : 'Start Transcribe'}
            </Button>
          </>
        )}
        {transcriptionData && transcriptionData.words && (
          <div className="w-full max-w-3xl mt-6">
            <Typography variant="h6">Transcription:</Typography>
            <div className="transcription-container">
              {transcriptionData.words.map((wordObj, index) => (
                <span key={index} className="transcription-word">
                  {wordObj.word} ({wordObj.start.toFixed(2)}s - {wordObj.end.toFixed(2)}s) <br />
                </span>
              ))}
            </div>
          </div>
        )}
        {webhookResponseBody && (
          <div className="w-full max-w-3xl mt-6">
            <Typography variant="h6">summary:</Typography>
            <div className="response-container">
              {Object.entries(webhookResponseBody).map(([key, value], index) => (
                <div key={index} className="response-item">
                  <Typography variant="body1">
                    <span className="transcription-word">
                      <strong>{key}:</strong> {JSON.stringify(value)}
                    </span>
                  </Typography>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && (
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        )}
      </div>
      <br/>
      {webhookResponseBody && (
        <Button variant="contained" onClick={handleReset}>
          Reset
        </Button>
      )}

      <style jsx>{`
        .transcription-container {
          max-height: 60vh;
          overflow-y: auto;
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-top: 1rem;
        }
        .response-container {
          max-height: 60vh;
          overflow-y: auto;
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-top: 1rem;
        }
        .transcription-word {
          color: #000000;
          display: inline-block;
          margin-right: 0.5rem;
          font-size: 1rem;
        }
        .response-item {
          margin-bottom: 1rem;
        }
        .button {
          background-color: primary;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        }

        .button:hover {
          opacity: 0.8;
        }

        .circular-progress {
          color: white;
          margin-right: 10px;
        }
      `}</style>
    </div>
  )
}

export default VideoUploadButton
