import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  FormControlLabel,
  Switch,
  Alert
} from '@mui/material';
import {
  Description as DocumentIcon,
  TableChart as SpreadsheetIcon,
  Code as CodeIcon,
  TextFields as TextIcon,
  Slideshow as PresentationIcon,
  DataObject as JsonIcon,
  GridOn as CsvIcon,
  Article as MarkdownIcon
} from '@mui/icons-material';

const CreateFileDialog = ({ open, onClose, onSubmit, fileTypes = [] }) => {
  const [step, setStep] = useState(1);
  const [selectedFileType, setSelectedFileType] = useState('');
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    // Reset form
    setStep(1);
    setSelectedFileType('');
    setFileName('');
    setDescription('');
    setCategory('');
    setTags('');
    setIsShared(false);
    setError('');
    onClose();
  };

  const handleNext = () => {
    if (step === 1 && !selectedFileType) {
      setError('Please select a file type');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleBack = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = () => {
    if (!fileName.trim()) {
      setError('File name is required');
      return;
    }

    const fileTypeData = fileTypes.find(type => type.name === selectedFileType);
    const defaultContent = getDefaultContent(selectedFileType);

    const fileData = {
      fileName: fileName.trim(),
      fileType: selectedFileType,
      content: defaultContent,
      description: description.trim() || null,
      category: category.trim() || null,
      tags: tags.trim() || null,
      isShared
    };

    onSubmit(fileData);
    handleClose();
  };

  const getDefaultContent = (fileType) => {
    switch (fileType) {
      case 'TEXT':
        return 'Welcome to your new text file!\n\nStart typing your content here...';
      case 'DOCUMENT':
        return '# New Document\n\nThis is your new document. You can format text with **bold**, *italic*, and other formatting options.\n\n## Getting Started\n\n1. Edit this content\n2. Add your own sections\n3. Save your work\n\nEnjoy writing!';
      case 'SPREADSHEET':
        return JSON.stringify({
          sheets: [{
            name: 'Sheet1',
            data: [
              ['Column A', 'Column B', 'Column C'],
              ['Row 1', 'Data 1', 'Value 1'],
              ['Row 2', 'Data 2', 'Value 2'],
              ['Row 3', 'Data 3', 'Value 3']
            ]
          }]
        }, null, 2);
      case 'PRESENTATION':
        return JSON.stringify({
          slides: [
            {
              title: 'Welcome Slide',
              content: 'This is your first slide. Add your presentation content here.'
            },
            {
              title: 'Second Slide',
              content: 'Add more slides as needed for your presentation.'
            }
          ]
        }, null, 2);
      case 'CODE':
        return '// Welcome to your new code file\n\nfunction hello() {\n    console.log("Hello, World!");\n}\n\n// Start coding here...\nhello();';
      case 'JSON':
        return JSON.stringify({
          name: 'New JSON File',
          version: '1.0.0',
          description: 'This is a sample JSON structure',
          data: {
            items: [],
            settings: {
              enabled: true,
              theme: 'default'
            }
          }
        }, null, 2);
      case 'CSV':
        return 'Name,Age,City,Occupation\nJohn Doe,30,New York,Developer\nJane Smith,25,Los Angeles,Designer\nBob Johnson,35,Chicago,Manager';
      case 'MARKDOWN':
        return '# New Markdown Document\n\nWelcome to your new markdown file!\n\n## Features\n\n- **Bold text**\n- *Italic text*\n- `Code snippets`\n- [Links](https://example.com)\n\n### Code Block\n\n```javascript\nfunction example() {\n    return "Hello, Markdown!";\n}\n```\n\n### List\n\n1. First item\n2. Second item\n3. Third item\n\n---\n\nStart editing your markdown content here!';
      default:
        return '';
    }
  };

  const getFileIcon = (fileType) => {
    const iconProps = { sx: { fontSize: 48, color: 'primary.main' } };
    
    switch (fileType) {
      case 'DOCUMENT':
        return <DocumentIcon {...iconProps} />;
      case 'SPREADSHEET':
        return <SpreadsheetIcon {...iconProps} />;
      case 'PRESENTATION':
        return <PresentationIcon {...iconProps} />;
      case 'CODE':
        return <CodeIcon {...iconProps} />;
      case 'JSON':
        return <JsonIcon {...iconProps} />;
      case 'CSV':
        return <CsvIcon {...iconProps} />;
      case 'MARKDOWN':
        return <MarkdownIcon {...iconProps} />;
      default:
        return <TextIcon {...iconProps} />;
    }
  };

  const getFileDescription = (fileType) => {
    switch (fileType) {
      case 'TEXT':
        return 'Simple plain text file for notes and basic content';
      case 'DOCUMENT':
        return 'Rich text document with formatting support';
      case 'SPREADSHEET':
        return 'Tabular data with rows, columns, and calculations';
      case 'PRESENTATION':
        return 'Slide-based presentation with multiple slides';
      case 'CODE':
        return 'Source code file with syntax highlighting';
      case 'JSON':
        return 'Structured data in JSON format';
      case 'CSV':
        return 'Comma-separated values for data exchange';
      case 'MARKDOWN':
        return 'Markdown formatted text with rich formatting';
      default:
        return 'Generic file type';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Create New File - Step {step} of 2
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {step === 1 && (
          <Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Choose the type of file you want to create:
            </Typography>
            
            <Grid container spacing={2}>
              {fileTypes.map((fileType) => (
                <Grid item xs={12} sm={6} md={4} key={fileType.name}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      border: selectedFileType === fileType.name ? 2 : 1,
                      borderColor: selectedFileType === fileType.name ? 'primary.main' : 'divider',
                      '&:hover': {
                        boxShadow: 3
                      }
                    }}
                  >
                    <CardActionArea 
                      onClick={() => setSelectedFileType(fileType.name)}
                      sx={{ height: '100%', p: 2 }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 0 }}>
                        {getFileIcon(fileType.name)}
                        <Typography variant="h6" component="div" sx={{ mt: 1 }}>
                          {fileType.displayName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {getFileDescription(fileType.name)}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {step === 2 && (
          <Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Configure your new {fileTypes.find(t => t.name === selectedFileType)?.displayName.toLowerCase()}:
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="File Name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  required
                  placeholder="Enter file name"
                  helperText="Choose a descriptive name for your file"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Projects, Notes, Work"
                  helperText="Optional category for organization"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="comma, separated, tags"
                  helperText="Optional tags for easier searching"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={3}
                  placeholder="Optional description of this file"
                  helperText="Brief description of the file's purpose"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isShared}
                      onChange={(e) => setIsShared(e.target.checked)}
                    />
                  }
                  label="Make this file publicly shareable"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  Shared files can be accessed by anyone with the share link
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        {step === 2 && (
          <Button onClick={handleBack}>
            Back
          </Button>
        )}
        {step === 1 ? (
          <Button 
            onClick={handleNext} 
            variant="contained"
            disabled={!selectedFileType}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!fileName.trim()}
          >
            Create File
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateFileDialog;
