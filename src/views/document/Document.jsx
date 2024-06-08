'use client'

// React Imports
import { useState } from 'react'

import Button from '@mui/material/Button'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { List, ListItem, ListItemText, Divider } from '@mui/material'

const DocumentUploadButton = ({ mode }) => {
  const [fileInput, setFileInput] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [transcriptionText, setTranscriptionText] = useState(null) // State to store transcription text

  const handleFileInputChange = event => {
    const file = event.target.files[0]

    setFileInput(file)

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

  const handleFileInputReset = () => {
    setFileInput(null)
    setUploadProgress(0)
    setUploadComplete(false)
  }

  const handleTranscribeClick = async () => {
    try {
      const formData = new FormData()

      formData.append('document', fileInput)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        console.log('Transcription started successfully')
        const data = await response.json() // Parse JSON response

        setTranscriptionText(data.text) // Update transcription text state
      } else {
        console.error('Failed to start transcription')

        // Handle error
      }
    } catch (error) {
      console.error('Error starting transcription:', error)
    }
  }

  return (
    <div className='container bs-full justify-center items-center min-h-screen'>
      {/* Text above the buttons */}

      <div className='text-above'>
        <p>Upload a Document (PDF) to extract text</p>
      </div>
      {/* Buttons row */}
      <div className='button-row'>
        {!uploadComplete ? (
          <Button
            component='label'
            variant='contained'
            htmlFor='account-settings-upload-document'
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {uploadProgress < 100 ? 'Upload Document' : 'Uploading...'}
            <input
              hidden
              type='file'
              accept='application/pdf'
              onChange={handleFileInputChange}
              id='account-settings-upload-document'
            />
          </Button>
        ) : (
          <>
            <CheckCircleOutlineIcon sx={{ color: 'green', fontSize: 50 }}>
              <div className='center-number'>{uploadProgress}%</div>
            </CheckCircleOutlineIcon>
            <Button
              variant='contained'
              color='primary'
              onClick={handleTranscribeClick}
              style={{
                backgroundColor: '#4caf50',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Extract Text
            </Button>
          </>
        )}
        {uploadProgress > 0 && !uploadComplete && (
          <div className='loader-container'>
            <div className='loader'></div>
          </div>
        )}
      </div>
      {/* Transcription text row */}
      <div className='transcription-row'>
        {transcriptionText && ( // Display transcription text if available
          <div className='transcription-container'>
            <ListItem>
              <ListItemText primary='Extracted Text:' secondary={transcriptionText} />
            </ListItem>
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          display: grid;
          grid-template-rows: auto auto; /* Define rows */
          row-gap: 20px; /* Add gap between rows */
        }

        .text-above {
          text-align: center;
          font-size: 20px;
          margin-bottom: 10px;
        }

        .button-row {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .transcription-row {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .transcription-container {
          padding: 20px; /* Add padding */
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .loader-container {
          position: relative;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 2px solid #007bff; /* Set the border color */
          border-top-color: transparent;
          animation: spin 1s linear infinite;
          overflow: hidden; /* Hide overflow to make the circle full */
        }

        .loader {
          width: calc(100% - 4px); /* Adjust the thickness of the loader */
          height: calc(100% - 4px); /* Adjust the thickness of the loader */
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #007bff; /* Set the border color */
          animation: spin 1s linear infinite;
        }

        .center-number {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 12px;
          color: white;
        }
      `}</style>
    </div>
  )
}

export default DocumentUploadButton
