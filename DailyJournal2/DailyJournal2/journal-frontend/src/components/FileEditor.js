import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Toolbar,
  AppBar,
  Grid,
  Chip,
  FormControlLabel,
  Switch,
  Alert,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Share as ShareIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { updateWorkshopFile, getWorkshopFile } from '../services/api';
import TextEditor from './editors/TextEditor';
import DocumentEditor from './editors/DocumentEditor';
import SpreadsheetEditor from './editors/SpreadsheetEditor';
import CodeEditor from './editors/CodeEditor';
import JsonEditor from './editors/JsonEditor';
import CsvEditor from './editors/CsvEditor';
import MarkdownEditor from './editors/MarkdownEditor';

const FileEditor = ({ open, onClose, file }) => {
  const [fileData, setFileData] = useState(null);
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (open && file) {
      loadFileData();
    }
  }, [open, file]);

  useEffect(() => {
    // Track unsaved changes
    if (fileData) {
      const hasChanges = 
        content !== fileData.content ||
        fileName !== fileData.fileName ||
        description !== (fileData.description || '') ||
        category !== (fileData.category || '') ||
        tags !== (fileData.tags || '') ||
        isShared !== fileData.isShared;
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [content, fileName, description, category, tags, isShared, fileData]);

  const loadFileData = async () => {
    try {
      setLoading(true);
      const response = await getWorkshopFile(file.id);
      const data = response.data;
      
      setFileData(data);
      setContent(data.content || '');
      setFileName(data.fileName);
      setDescription(data.description || '');
      setCategory(data.category || '');
      setTags(data.tags || '');
      setIsShared(data.isShared || false);
    } catch (error) {
      setError('Failed to load file data');
      console.error('Error loading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const updateData = {
        fileName: fileName.trim(),
        fileType: fileData.fileType,
        content,
        description: description.trim() || null,
        category: category.trim() || null,
        tags: tags.trim() || null,
        isShared
      };

      await updateWorkshopFile(file.id, updateData);
      setSuccess('File saved successfully!');
      setHasUnsavedChanges(false);
      
      // Update the file data to reflect saved changes
      setFileData(prev => ({ ...prev, ...updateData }));
      
    } catch (error) {
      setError('Failed to save file');
      console.error('Error saving file:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const renderEditor = () => {
    if (!fileData) return null;

    const editorProps = {
      content,
      onChange: setContent,
      readOnly: false
    };

    switch (fileData.fileType) {
      case 'TEXT':
        return <TextEditor {...editorProps} />;
      case 'DOCUMENT':
        return <DocumentEditor {...editorProps} />;
      case 'SPREADSHEET':
        return <SpreadsheetEditor {...editorProps} />;
      case 'CODE':
        return <CodeEditor {...editorProps} language="javascript" />;
      case 'JSON':
        return <JsonEditor {...editorProps} />;
      case 'CSV':
        return <CsvEditor {...editorProps} />;
      case 'MARKDOWN':
        return <MarkdownEditor {...editorProps} />;
      default:
        return <TextEditor {...editorProps} />;
    }
  };

  const getShareUrl = () => {
    if (fileData?.shareToken) {
      return `${window.location.origin}/workshop/shared/${fileData.shareToken}`;
    }
    return null;
  };

  if (!fileData) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Loading...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      fullScreen
      PaperProps={{
        sx: { height: '100vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
      }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {fileName}
            {hasUnsavedChanges && <span style={{ color: '#ffeb3b' }}> *</span>}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
            
            {isShared && fileData.shareToken && (
              <Button
                color="inherit"
                startIcon={<ShareIcon />}
                onClick={() => {
                  navigator.clipboard.writeText(getShareUrl());
                  setSuccess('Share URL copied to clipboard!');
                }}
              >
                Share
              </Button>
            )}
            
            <Button
              color="inherit"
              startIcon={<DownloadIcon />}
              onClick={() => {
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export
            </Button>
            
            <IconButton color="inherit" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ m: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* File Properties Panel */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="File Name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                size="small"
                placeholder="e.g., Projects, Notes"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                size="small"
                placeholder="comma, separated, tags"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isShared}
                    onChange={(e) => setIsShared(e.target.checked)}
                  />
                }
                label="Share publicly"
              />
            </Grid>
          </Grid>
          
          {description !== undefined && (
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              size="small"
              multiline
              rows={2}
              sx={{ mt: 2 }}
              placeholder="Optional description of this file"
            />
          )}
          
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={fileData.fileTypeDisplayName} 
              color="primary" 
              size="small" 
            />
            <Typography variant="caption" color="text.secondary">
              Size: {Math.round((content.length || 0) / 1024 * 100) / 100} KB
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Last modified: {new Date(fileData.updatedAt).toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Editor */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {renderEditor()}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FileEditor;
