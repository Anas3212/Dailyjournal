import React from 'react';
import { TextField, Box } from '@mui/material';

const TextEditor = ({ content, onChange, readOnly = false }) => {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TextField
        fullWidth
        multiline
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing your text content here..."
        variant="outlined"
        InputProps={{
          readOnly,
          sx: {
            height: '100%',
            alignItems: 'flex-start',
            '& .MuiInputBase-input': {
              height: '100% !important',
              overflow: 'auto !important',
              resize: 'none',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: 1.5
            }
          }
        }}
        sx={{
          flex: 1,
          '& .MuiOutlinedInput-root': {
            height: '100%'
          }
        }}
      />
    </Box>
  );
};

export default TextEditor;
