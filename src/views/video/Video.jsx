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
  const [error, setError] = useState(null)

  const handleFileInputChange = event => {
    const file = event.target.files[0]

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
  }

  const handleTranscribeClick = async () => {
    try {
      const formData = new FormData()
      formData.append('audio', fileInput)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setTranscriptionData(data)
      } else {
        setError('Failed to start transcription')
      }
    } catch (error) {
      console.error('Error starting transcription:', error)
      setError('Error starting transcription')
    }
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
              Start Transcribe
            </Button>
          </>
        )}
        {transcriptionData && (
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
        {error && (
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        )}
      </div>

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
        .transcription-word {
          color: #000000;
          display: inline-block;
          margin-right: 0.5rem;
          font-size: 1rem;
        }
      `}</style>
    </div>
  )
}

export default VideoUploadButton
