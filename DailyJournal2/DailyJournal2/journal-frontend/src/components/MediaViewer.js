import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogActions, Button, IconButton, Box, Typography } from '@mui/material';
import { Close, NavigateBefore, NavigateNext } from '@mui/icons-material';

const MediaViewer = ({ open, onClose, mediaUrl, mediaUrls = [], onNext, onPrev }) => {
  const [blobSrc, setBlobSrc] = useState('');
  // Check if the current file is a PDF
  const isPdf = mediaUrl?.toLowerCase().endsWith('.pdf');
  
  // Check if the current file is an image
  const isImage = mediaUrl?.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) !== null;
  
  // Function to get the full media URL
  const getFullMediaUrl = (url) => {
    // If the URL already starts with http, return as is
    if (url.startsWith('http')) {
      return url;
    }
    // If it starts with /api/journals/media/, add the backend base URL
    if (url.startsWith('/api/journals/media/')) {
      return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}`;
    }
    // If it's just a filename, construct the full URL
    if (!url.startsWith('/')) {
      return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journals/media/${url}`;
    }
    // For other cases, add the backend base URL
    return `${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}${url}`;
  };
  
  // Helper function to download files as blobs
  const downloadFile = (url) => {
    const fullUrl = getFullMediaUrl(url);
    const filename = url.split('/').pop().split('?')[0]; // strip query params
    const isCloudinaryUrl = fullUrl.startsWith('https://res.cloudinary.com');
    
    fetch(fullUrl, {
      method: 'GET',
      // Only send cookies for backend media endpoint, not for Cloudinary
      credentials: isCloudinaryUrl ? 'omit' : 'include',
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to download file');
      return response.blob();
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    })
    .catch(error => {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(fullUrl, '_blank');
    });
  };
  
  const fullMediaUrl = getFullMediaUrl(mediaUrl);
  const isCloudinaryUrl = fullMediaUrl.startsWith('https://res.cloudinary.com');

  // If image previews require auth, load as blob with Authorization
  useEffect(() => {
    let revoked = false;
    let objectUrl = '';
    setBlobSrc('');
    if (!open || !mediaUrl) return;
    const lower = mediaUrl.toLowerCase();
    const isImg = lower.match(/\.(jpeg|jpg|gif|png|webp)$/) !== null;
    if (!isImg) return; // only blob-load images

    const fullUrl = getFullMediaUrl(mediaUrl);
    const isCloudinary = fullUrl.startsWith('https://res.cloudinary.com');

    const controller = new AbortController();
    fetch(fullUrl, {
      method: 'GET',
      // Cloudinary URLs are public — no credentials needed
      credentials: isCloudinary ? 'omit' : 'include',
      signal: controller.signal,
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then(b => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(b);
        setBlobSrc(objectUrl);
      })
      .catch(() => {
        // Fallback: let <img> try direct URL (may work if public)
        setBlobSrc('');
      });

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      controller.abort();
    };
  }, [open, mediaUrl, fullMediaUrl]);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogContent sx={{ position: 'relative', p: 0, height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.3)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' } }}
        >
          <Close />
        </IconButton>
        
        {mediaUrls.length > 1 && (
          <>
            <IconButton
              onClick={onPrev}
              sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.3)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' } }}
            >
              <NavigateBefore />
            </IconButton>
            <IconButton
              onClick={onNext}
              sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.3)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' } }}
            >
              <NavigateNext />
            </IconButton>
          </>
        )}
        
        {isPdf ? (
          <Box sx={{ height: '100%', overflow: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Typography variant="h6">PDF Preview</Typography>
              <Typography variant="body2" color="text.secondary">
                PDF preview is not available directly. Please use one of the options below:
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary"
                href={fullMediaUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Open PDF in New Tab
              </Button>
              <Button 
                variant="outlined"
                onClick={() => downloadFile(mediaUrl)}
              >
                Download PDF
              </Button>
            </Box>
          </Box>
        ) : isImage ? (
          <img 
            src={blobSrc || fullMediaUrl} 
            alt="Media preview" 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
          />
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            This file type cannot be previewed. Please download the file to view it.
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained"
                onClick={() => downloadFile(mediaUrl)}
              >
                Download File
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewer;