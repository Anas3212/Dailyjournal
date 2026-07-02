import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Toolbar,
  Button,
  Typography,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  FormatAlignLeft as FormatIcon,
  ContentCopy as CopyIcon,
  CheckCircle as ValidIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const JsonEditor = ({ content, onChange, readOnly = false }) => {
  const [jsonError, setJsonError] = useState('');
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    validateJson(content);
  }, [content]);

  const validateJson = (jsonString) => {
    if (!jsonString.trim()) {
      setJsonError('');
      setIsValid(true);
      return;
    }

    try {
      JSON.parse(jsonString);
      setJsonError('');
      setIsValid(true);
    } catch (error) {
      setJsonError(error.message);
      setIsValid(false);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
    } catch (error) {
      // If parsing fails, don't format
      console.error('Cannot format invalid JSON:', error);
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(content);
      const minified = JSON.stringify(parsed);
      onChange(minified);
    } catch (error) {
      console.error('Cannot minify invalid JSON:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
  };

  const insertTemplate = (template) => {
    const templates = {
      object: '{\n  "key": "value",\n  "number": 123,\n  "boolean": true,\n  "array": [1, 2, 3],\n  "nested": {\n    "property": "value"\n  }\n}',
      array: '[\n  {\n    "id": 1,\n    "name": "Item 1"\n  },\n  {\n    "id": 2,\n    "name": "Item 2"\n  }\n]',
      config: '{\n  "name": "My Application",\n  "version": "1.0.0",\n  "settings": {\n    "debug": false,\n    "theme": "dark",\n    "features": {\n      "notifications": true,\n      "analytics": false\n    }\n  },\n  "database": {\n    "host": "localhost",\n    "port": 5432,\n    "name": "myapp"\n  }\n}'
    };
    
    onChange(templates[template] || '{}');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      {!readOnly && (
        <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              JSON
              {isValid ? (
                <ValidIcon sx={{ color: 'success.main', fontSize: 16 }} />
              ) : (
                <ErrorIcon sx={{ color: 'error.main', fontSize: 16 }} />
              )}
            </Typography>
          </Box>

          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button size="small" onClick={formatJson} disabled={!isValid}>
              <FormatIcon sx={{ mr: 0.5 }} />
              Format
            </Button>
            
            <Button size="small" onClick={minifyJson} disabled={!isValid}>
              Minify
            </Button>
            
            <Tooltip title="Copy to Clipboard">
              <IconButton size="small" onClick={copyToClipboard}>
                <CopyIcon />
              </IconButton>
            </Tooltip>

            <Button size="small" onClick={() => insertTemplate('object')}>
              Object
            </Button>
            
            <Button size="small" onClick={() => insertTemplate('array')}>
              Array
            </Button>
            
            <Button size="small" onClick={() => insertTemplate('config')}>
              Config
            </Button>
          </Box>
        </Toolbar>
      )}

      {/* Error Alert */}
      {jsonError && (
        <Alert severity="error" sx={{ m: 1 }}>
          <Typography variant="body2">
            <strong>JSON Error:</strong> {jsonError}
          </Typography>
        </Alert>
      )}

      {/* Editor */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TextField
          fullWidth
          multiline
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter valid JSON here..."
          variant="outlined"
          InputProps={{
            readOnly,
            sx: {
              height: '100%',
              alignItems: 'flex-start',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '14px',
              lineHeight: 1.5,
              '& .MuiInputBase-input': {
                height: '100% !important',
                overflow: 'auto !important',
                resize: 'none',
                whiteSpace: 'pre',
                tabSize: 2
              }
            }
          }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              height: '100%',
              backgroundColor: isValid ? '#f8f9fa' : '#fff5f5',
              '& fieldset': {
                borderColor: isValid ? 'divider' : 'error.main'
              },
              '&:hover fieldset': {
                borderColor: isValid ? 'primary.main' : 'error.main'
              },
              '&.Mui-focused fieldset': {
                borderColor: isValid ? 'primary.main' : 'error.main'
              }
            }
          }}
        />
      </Box>

      {/* JSON Info Panel */}
      {isValid && content.trim() && (
        <Box sx={{ 
          borderTop: 1, 
          borderColor: 'divider',
          backgroundColor: '#f5f5f5',
          p: 1
        }}>
          <Typography variant="caption" color="text.secondary">
            Valid JSON • {content.split('\n').length} lines • {content.length} characters
            {(() => {
              try {
                const parsed = JSON.parse(content);
                const keys = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0;
                return keys > 0 ? ` • ${keys} properties` : '';
              } catch {
                return '';
              }
            })()}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default JsonEditor;
