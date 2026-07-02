import React, { useState } from 'react';
import { Button, Box } from '@mui/material';
import FolderCreateDialog from './FolderCreateDialog';

// Test component to verify folder edit functionality
const FolderEditTest = () => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Sample folder data for testing
  const sampleFolder = {
    id: 1,
    name: 'Work Projects',
    description: 'All my work-related documents and projects',
    color: '#4CAF50',
    icon: 'work'
  };

  const handleEditSubmit = () => {
    console.log('Edit submitted successfully');
    setEditDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button 
        variant="contained" 
        onClick={() => setEditDialogOpen(true)}
        sx={{ mb: 2 }}
      >
        Test Edit Folder Dialog
      </Button>
      
      <FolderCreateDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleEditSubmit}
        editMode={true}
        initialData={sampleFolder}
      />
    </Box>
  );
};

export default FolderEditTest;
