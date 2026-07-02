import React, { useState } from 'react';
import {
  Box,
  TextField,
  Toolbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  ContentCopy as CopyIcon,
  FormatIndentIncrease as IndentIcon,
  FormatIndentDecrease as OutdentIcon
} from '@mui/icons-material';

const CodeEditor = ({ content, onChange, readOnly = false, language = 'javascript' }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [output, setOutput] = useState('');

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'sql', label: 'SQL' },
    { value: 'json', label: 'JSON' },
    { value: 'xml', label: 'XML' },
    { value: 'bash', label: 'Bash' }
  ];

  const handleContentChange = (newContent) => {
    onChange(newContent);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
  };

  const formatCode = () => {
    // Simple indentation formatting
    const lines = content.split('\n');
    let indentLevel = 0;
    const formatted = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.includes('}') || trimmed.includes(']') || trimmed.includes(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      const indentedLine = '  '.repeat(indentLevel) + trimmed;
      if (trimmed.includes('{') || trimmed.includes('[') || trimmed.includes('(')) {
        indentLevel++;
      }
      return indentedLine;
    }).join('\n');
    
    handleContentChange(formatted);
  };

  const runCode = () => {
    if (selectedLanguage === 'javascript') {
      try {
        // Create a safe execution context
        const result = eval(content);
        setOutput(result !== undefined ? String(result) : 'Code executed successfully');
      } catch (error) {
        setOutput(`Error: ${error.message}`);
      }
    } else {
      setOutput(`Code execution not supported for ${selectedLanguage}`);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      {!readOnly && (
        <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={selectedLanguage}
              label="Language"
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.value} value={lang.value}>
                  {lang.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Tooltip title="Format Code">
              <IconButton size="small" onClick={formatCode}>
                <IndentIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Copy to Clipboard">
              <IconButton size="small" onClick={copyToClipboard}>
                <CopyIcon />
              </IconButton>
            </Tooltip>
            
            {selectedLanguage === 'javascript' && (
              <Tooltip title="Run JavaScript">
                <IconButton size="small" onClick={runCode}>
                  <RunIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      )}

      {/* Editor */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TextField
          fullWidth
          multiline
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={`Start coding in ${languages.find(l => l.value === selectedLanguage)?.label || 'your language'}...`}
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
            flex: output ? 0.7 : 1,
            '& .MuiOutlinedInput-root': {
              height: '100%',
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              '& fieldset': {
                borderColor: '#3e3e3e'
              },
              '&:hover fieldset': {
                borderColor: '#007acc'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#007acc'
              }
            }
          }}
        />

        {/* Output Panel */}
        {output && (
          <Box sx={{ 
            flex: 0.3, 
            borderTop: 1, 
            borderColor: 'divider',
            backgroundColor: '#f5f5f5',
            p: 1
          }}>
            <Typography variant="subtitle2" gutterBottom>
              Output:
            </Typography>
            <Box sx={{ 
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              p: 1,
              borderRadius: 1,
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
              maxHeight: 200
            }}>
              {output}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CodeEditor;
