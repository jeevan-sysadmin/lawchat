import React, { useState, useEffect } from 'react';
import { Card, CardContent, Grid, Box } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import { users } from '../../../app/api/login/users';

const userId = users[0].id;

function FolderContents() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [currentDirectory, setCurrentDirectory] = useState([]);

  useEffect(() => {
    // Update the URL when the current directory changes
    const path = currentDirectory.map(folder => folder.name).join('/');
    window.history.replaceState(null, '', `?path=${path}`);

    async function fetchFolderContents() {
      try {
        const response = await fetch(`/api/s3-list?userId=${userId}`);
        const data = await response.json();

        if (response.ok) {
          setContents(data.contents);
          setError(null); // Reset error if successful
        } else {
          setError(data.error);
        }
      } catch (error) {
        setError('An error occurred while fetching the folder contents.');
      } finally {
        setLoading(false);
      }
    }

    fetchFolderContents();
  }, [currentDirectory]); // Include currentDirectory in the dependency array

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder);
    setCurrentDirectory(prev => [...prev, folder]);
    const now = new Date().getTime();
    setLastClickTime(now);
    console.log(folder);
  };

  const handleFolderDoubleClick = async (folder) => {
    try {
      const response = await fetch(`/api/s3-list?userId=${userId}&folder=${folder}`);

      const data = await response.json();

      if (response.ok) {
        setContents(data.contents);
        setError(null); // Reset error if successful
        setSelectedFolder(folder); // Set selected folder on double click
        setCurrentDirectory(prev => [...prev, folder]);

        // Append folder name to the URL
        const path = currentDirectory.map(f => f.name).join('/') + folder;
        window.history.replaceState(null, '', `?path=${path}`);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('An error occurred while fetching the folder contents.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <h4>Folder Contents for User {userId}</h4>
      {contents.length > 0 ? (
        <Grid container spacing={3}>
          {contents.map((item, index) => (
            <Grid item xs={12} sm={6} md={2} key={index}>
              <Card
                onClick={() => handleFolderClick(item)}
                onDoubleClick={() => handleFolderDoubleClick(item)}
                style={{ borderColor: selectedFolder === item ? '#8F00FF' : 'transparent', borderWidth: 2, borderStyle: 'solid' }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <FolderIcon style={{ marginRight: 8, fontSize: 50 }} />
                    <div>{item}</div>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <div>No contents available</div>
      )}
    </>
  );
}

export default FolderContents;
