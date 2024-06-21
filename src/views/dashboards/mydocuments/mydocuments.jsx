'use client'
import React, { useState, useEffect } from 'react';
import { Button, IconButton, MenuItem, Select, ListItemIcon, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Menu, CircularProgress } from '@mui/material';
import { CloudUpload, CreateNewFolder, Delete, GridOnOutlined, ViewListOutlined, CloudDownload, SortByAlpha, Event, Folder, Edit,TrendingUp ,HourglassFull } from '@mui/icons-material';
import { users } from '../../../app/api/login/users';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FolderContents from '/src/views/dashboards/mydocuments/folderContents.js';



const MyFilesPage = () => {
  const [displayGrid, setDisplayGrid] = useState(true);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [open, setOpen] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [isUploadClicked, setIsUploadClicked] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [renameFolderIndex, setRenameFolderIndex] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [folders, setFolders] = useState([]);
  const userId = users[0].id;

  useEffect(() => {
    // Update the URL when the current directory changes
    const path = currentDirectory.map(folder => folder.name).join('/');
    window.history.replaceState(null, '', `?path=${path}`);
  }, [currentDirectory]);

  const handleDeleteFile = (file) => {
    const updatedFiles = files.filter(f => {
      if (f.type === 'folder') {
        f.contents = f.contents.filter(subFile => subFile !== file);
      }

      return f !== file;
    });
    setFiles(updatedFiles);
    setSelectedFile(null);
  };

  const handleCreateFolder = () => {
    setOpen(true);
  };

  const handleCreateFolderConfirm = () => {
    if (folderNameInput.trim() !== '') {
      const newFolder = { type: 'folder', name: folderNameInput.trim(), contents: [] };
      setFiles([newFolder, ...files]);
      setOpen(false);
      setFolderNameInput('');
    }
  };

  const handleCreateFolderCancel = () => {
    setOpen(false);
    setFolderNameInput('');
  };

  const toggleView = () => {
    setDisplayGrid(!displayGrid);
  };

  const handleSortChange = (event) => {
    const selectedSortBy = event.target.value;
    setSortBy(selectedSortBy);
    let sortedFiles = [...files];
    if (selectedSortBy === 'nameAsc') {
      sortedFiles.sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedSortBy === 'nameDesc') {
      sortedFiles.sort((a, b) => b.name.localeCompare(a.name));
    } else if (selectedSortBy === 'dateAsc') {
      sortedFiles.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (selectedSortBy === 'dateDesc') {
      sortedFiles.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (selectedSortBy === 'statusAsc') {
      sortedFiles.sort((a, b) => a.progress - b.progress);
    } else if (selectedSortBy === 'statusDesc') {
      sortedFiles.sort((a, b) => b.progress - a.progress);
    } else if (selectedSortBy === 'durationAsc') {
      sortedFiles.sort((a, b) => a.duration - b.duration);
    } else if (selectedSortBy === 'durationDesc') {
      sortedFiles.sort((a, b) => b.duration - a.duration);
    }
    setFiles(sortedFiles);
  };

  const handleSelectFile = (file) => {
    setSelectedFile(file);
  };

  const handleDoubleClickFolder = (folder) => {
    setCurrentDirectory([...currentDirectory, folder]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const newFiles = Array.from(event.dataTransfer.files);
    const updatedFiles = [...files];
    let currentFolder = updatedFiles;
    currentDirectory.forEach(folder => {
      currentFolder = currentFolder.find(file => file.name === folder.name).contents;
    });
    currentFolder.push(...newFiles);
    setFiles(updatedFiles);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleFileInputChange = (event) => {
    const newFiles = Array.from(event.target.files);
    const updatedFiles = [...files];
    let currentFolder = updatedFiles;
    currentDirectory.forEach(folder => {
      currentFolder = currentFolder.find(file => file.name === folder.name).contents;
    });
    currentFolder.push(...newFiles);
    setFiles(updatedFiles);

    // Upload files immediately after selection
    newFiles.forEach(file => {
      handleFileUpload(file);
    });
  };

  const renderFile = (file, index) => {
    const defaultSize = { width: '100%', height: 'auto' }; // Responsive size for all files
    if (file.type === 'folder') {
      return (
        <div key={index} className="file-item" onClick={() => handleSelectFile(file)} onDoubleClick={() => handleDoubleClickFolder(file)}>
          <Folder style={defaultSize} />
          <p>{file.name}</p>
        </div>
      );
    } else if (file.type.startsWith('image/')) {
      return <img key={index} src={URL.createObjectURL(file)} alt={file.name} className="file-item img" style={defaultSize} />;
    } else if (file.type.startsWith('video/')) {
      return (
        <video key={index} controls style={defaultSize} className="file-item">
          <source src={URL.createObjectURL(file)} type={file.type} />
          Your browser does not support the video tag.
        </video>
      );
    } else if (file.type.startsWith('audio/')) {
      return (
        <audio key={index} controls style={defaultSize} className="file-item">
          <source src={URL.createObjectURL(file)} type={file.type} />
          Your browser does not support the audio tag.
        </audio>
      );
    } else if (file.type === 'application/pdf') {
      return (
        <object key={index} data={URL.createObjectURL(file)} type="application/pdf" width={defaultSize.width} height={defaultSize.height} className="file-item">
          <p>This browser does not support PDFs. Please download the PDF to view it.</p>
        </object>
      );
    } else {
      return <p key={index} style={{ ...defaultSize }} className="file-item">{file.name}</p>;
    }
  };

  const handleMicrosoftOneDriveUpload = () => {
    // Handle upload to Microsoft OneDrive
    console.log("Uploading to Microsoft OneDrive...");
  };

  const handleDropboxUpload = () => {
    // Handle upload to Dropbox
    console.log("Uploading to Dropbox...");
  };

  const handleGoogleDriveUpload = () => {
    // Handle upload to Google Drive
    console.log("Uploading to Google Drive...");
  };

  const handleAV3FolderUpload = () => {
    // Handle upload to AV3 Folder
    console.log("Uploading to AV3 Folder...");
  };

  const handleFTRFolderUpload = () => {
    // Handle upload to FTR Folder
    console.log("Uploading to FTR Folder...");
  };

  const handleRenameFolder = (index) => {
    setRenameFolderIndex(index); // Set the index of the folder being renamed
    setRenameDialogOpen(true);
    setAnchorEl(null); // Close the menu after action
  };

  const handleRenameConfirm = () => {
    // Update folder name in files state
    const updatedFiles = files.map((file, index) => {
      if (index === renameFolderIndex) {
        return { ...file, name: renameInput };
      }

      return file;
    });
    setFiles(updatedFiles);
    setRenameDialogOpen(false);
    setRenameInput('');
    setRenameFolderIndex(null); // Reset the folder index after renaming
  };

  const handleRenameCancel = () => {
    setRenameDialogOpen(false);
    setRenameInput('');
    setRenameFolderIndex(null); // Reset the folder index if renaming is canceled
  };

  const handleContextMenu = (event, index) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
    setRenameFolderIndex(index); // Set the index of the folder for renaming
  };

  const handleGoBack = () => {
    setCurrentDirectory(currentDirectory.slice(0, -1));
  };

  const getCurrentFiles = () => {
    let currentFiles = [...files]; // Make a copy of the files array to avoid mutating the original state
    currentDirectory.forEach(folder => {
      const folderFile = currentFiles.find(file => file.name === folder.name);
      if (folderFile && folderFile.type === 'folder') {
        currentFiles = folderFile.contents;
      }
    });

    return currentFiles;
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    console.log(file);
    setUploading(true);
    setUploadDialogOpen(true);

    try {
      const response = await axios.post('/api/s3-upload', formData, {
        // You don't need to specify headers here, axios will handle it for you
        // headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadPercentage(percentCompleted);
        }
      });

      // Axios automatically throws an error for non-successful responses (status codes other than 2xx)
      // So, we don't need to manually check for response.ok
      const data = response.data;
      console.log("User ID:", userId); // Log the user ID
      console.log(data);

      // Handle success
      toast.success('Files uploaded successfully!');
      // Assuming response.data.file is an array of files
      // setFiles([...files, ...response.data.file]);
      setUploadDialogOpen(false); // Close upload dialog
      setCaseDialogOpen(true); // Open case dialog

    } catch (error) {
      console.error('Error occurred during file upload:', error);
      toast.error('File upload failed!');
    } finally {
      setUploading(false);
      setUploadPercentage(0);
    }
  };

  const handleFileUploadAndChange = (event) => {
    const newFiles = Array.from(event.target.files);
    newFiles.forEach(file => {
      handleFileUpload(file);
    });
    handleFileChange(event);
  };

  const handleCaseDialogClose = () => {
    setCaseDialogOpen(false);
  };

  useEffect(() => {
    handleExistingCase();
  }, []);

  const [objects, setObjects] = useState([]);
  const handleExistingCase = async (userId) => {
    setCaseDialogOpen(false);

    try {
      const response = await fetch('/api/s3-list?userId=${userId}', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (data.success) {
        setFolderContents(data.folderContents);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Error fetching folder contents:", error);
    }
  };



  const handleNewCase = () => {
    setCaseDialogOpen(false);
    handleCreateFolder();
  };

  return (
    <div className={`container ${isUploadClicked ? 'upload-clicked' : ''}`}>
      {isUploadClicked && (
        <div className="upload-area" onDrop={handleDrop} onDragOver={handleDragOver}>
          <p>Drag & drop your files here</p>
          <input type="file" multiple onChange={handleFileInputChange} style={{ display: 'none' }} />
          <Button variant="contained" component="label" style={{ marginTop: '10px' }}>
            Local File System
            <input type="file" multiple onChange={handleFileUploadAndChange} style={{ display: 'none' }} />
          </Button>

          <Button startIcon={<CloudDownload />} onClick={handleMicrosoftOneDriveUpload}>Microsoft OneDrive</Button>
          <Button startIcon={<CloudDownload />} onClick={handleDropboxUpload}>Dropbox</Button>
          <Button startIcon={<CloudDownload />} onClick={handleGoogleDriveUpload}>Google Drive</Button>
          <Button startIcon={<CloudDownload />} onClick={handleAV3FolderUpload}>Upload AV3 Folder</Button>
          <Button startIcon={<CloudDownload />} onClick={handleFTRFolderUpload}>Upload FTR Folder</Button>
        </div>
      )}
      <h2 style={{ marginBottom: '0.5rem' }}>My Files</h2>
      <div></div>
      <div className="right">

      <Select
      value={sortBy}
      onChange={handleSortChange}



    >
      <MenuItem value="name-asc">
        <ListItemIcon style={{ minWidth: '32px' }}><SortByAlpha /></ListItemIcon>
        Name (A-Z)
      </MenuItem>
      <MenuItem value="name-desc">
        <ListItemIcon style={{ minWidth: '32px' }}><SortByAlpha /></ListItemIcon>
        Name (Z-A)
      </MenuItem>
      <MenuItem value="date-recent">
        <ListItemIcon style={{ minWidth: '32px' }}><Event /></ListItemIcon>
        Date uploaded (most recent)
      </MenuItem>
      <MenuItem value="date-oldest">
        <ListItemIcon style={{ minWidth: '32px' }}><Event /></ListItemIcon>
        Date uploaded (least recent)
      </MenuItem>
      <MenuItem value="status-asc">
        <ListItemIcon style={{ minWidth: '32px' }}><TrendingUp /></ListItemIcon>
        Status (least to most Progress)
      </MenuItem>
      <MenuItem value="status-desc">
        <ListItemIcon style={{ minWidth: '32px' }}><TrendingUp /></ListItemIcon>
        Status (most to least Progress)
      </MenuItem>
      <MenuItem value="duration-desc">
        <ListItemIcon style={{ minWidth: '32px' }}><HourglassFull /></ListItemIcon>
        Duration (longest to shortest)
      </MenuItem>
      <MenuItem value="duration-asc">
        <ListItemIcon style={{ minWidth: '32px' }}><HourglassFull /></ListItemIcon>
        Duration (shortest to longest)
      </MenuItem>
    </Select>
        <IconButton onClick={handleCreateFolder} size="small"><CreateNewFolder /></IconButton>
        <IconButton onClick={() => selectedFile && handleDeleteFile(selectedFile)} size="small"><Delete /></IconButton>
        <IconButton onClick={toggleView} size="small">{displayGrid ? <GridOnOutlined /> : <ViewListOutlined />}</IconButton>
        <div style={{ display: 'flex', justifyContent: 'right', alignItems: 'center', }}>
        <div className="upload-options">
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUpload />}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
            onClick={() => setIsUploadClicked(!isUploadClicked)}
          >
            Upload File
          </Button>
        </div>
      </div>
      </div>
      <div className={displayGrid ? 'files-grid' : 'files-list'}>
        {getCurrentFiles().map((file, index) => (
          <div key={index} className={`file-item ${selectedFile === file ? 'selected' : ''}`} onClick={() => file.type === 'folder' ? handleSelectFile(file) : handleSelectFile(file)} onDoubleClick={() => file.type === 'folder' ? handleDoubleClickFolder(file) : null} onContextMenu={(event) => handleContextMenu(event, index)}>
            {renderFile(file, index)}
          </div>
        ))}
      </div>
      <Menu
        id="folder-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleRenameFolder(renameFolderIndex)}>
          <ListItemIcon><Edit /></ListItemIcon>
          Rename
        </MenuItem>
      </Menu>
      <Dialog open={open} onClose={handleCreateFolderCancel}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            type="text"
            fullWidth
            value={folderNameInput}
            onChange={(e) => setFolderNameInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateFolderCancel}>Cancel</Button>
          <Button onClick={handleCreateFolderConfirm}>Create</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={renameDialogOpen} onClose={handleRenameCancel}>
        <DialogTitle>Rename Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Folder Name"
            type="text"
            fullWidth
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRenameCancel}>Cancel</Button>
          <Button onClick={handleRenameConfirm}>Rename</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>File Upload</DialogTitle>
        <DialogContent>
          {uploading ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress variant="determinate" value={uploadPercentage} />
              <span style={{ marginLeft: '10px' }}>{uploadPercentage}%</span>
            </div>
          ) : (
            <p>Upload completed successfully!</p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={caseDialogOpen} onClose={handleCaseDialogClose}>
        <DialogTitle>Select Case Type</DialogTitle>
        <DialogContent>
          <p>Is this file for an existing case or a new case?</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleExistingCase}>Existing Case</Button>
          <Button onClick={handleNewCase}>New Case</Button>
        </DialogActions>
      </Dialog>
      <h2>My Folders</h2>
      <FolderContents userId={userId} />



      <ToastContainer />
      <style jsx>{`
        .right {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #ccc;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        .container {
          padding: 20px;
          transition: margin-top 0.5s ease-out;
        }

        .container.upload-clicked {
          margin-top: 100px;
        }

        .upload-options {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }

        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          grid-gap: 10px;
        }

        .files-list {
          margin-top: 10px;
        }

        .file-item {
          display: flex;
          align-items: center;
          padding: 2px;
          border: 1px solid #ccc;
          border-radius: 5px;
          cursor: pointer;
        }

        .file-item img {
          max-width: 50px;
          max-height: 50px;
          margin-right: 10px;
        }

        .file-item.selected {
          border-color: #8F00FF;
        }

        .upload-area {
          border: 2px dashed #ccc;
          padding: 80px;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
};

export default MyFilesPage;
