// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button';

// Component Imports - Assuming you have a document upload component
import DocumentUploadButton from '@/views/document/Document';

// Styled Component Imports - Assuming you have styles for the document upload
// import DocumentUploadStyles from '@/libs/styles/DocumentUploadStyles';

async function fetchEvents() {
  // Vars
  const res = await fetch(`${process.env.API_URL}/apps/calendar-events`);

  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }

  return res.json();
}

const DocumentUploadPage = async () => {
  // Vars
  const events = await fetchEvents() || [];

  return (
    <Card>
      <DocumentUploadButton />
    </Card>
  );
};

export default DocumentUploadPage;
