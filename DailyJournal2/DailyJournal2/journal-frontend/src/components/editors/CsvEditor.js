import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Button,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ViewModule as TableViewIcon,
  Code as RawViewIcon,
  Download as ExportIcon,
  Upload as ImportIcon
} from '@mui/icons-material';

const CsvEditor = ({ content, onChange, readOnly = false }) => {
  const [data, setData] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [delimiter, setDelimiter] = useState(',');

  useEffect(() => {
    parseContent(content);
  }, [content, delimiter]);

  const parseContent = (csvContent) => {
    if (!csvContent.trim()) {
      setData([['']]);
      return;
    }

    try {
      const lines = csvContent.split('\n');
      const parsed = lines.map(line => {
        // Simple CSV parsing - handles basic cases
        const cells = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            cells.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        cells.push(current.trim());
        
        return cells;
      });
      
      setData(parsed.length > 0 ? parsed : [['']]);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setData([['']]);
    }
  };

  const updateContent = (newData) => {
    setData(newData);
    const csvContent = newData.map(row => 
      row.map(cell => {
        // Escape cells containing delimiter, quotes, or newlines
        if (cell.includes(delimiter) || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(delimiter)
    ).join('\n');
    onChange(csvContent);
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const newData = [...data];
    if (!newData[rowIndex]) newData[rowIndex] = [];
    newData[rowIndex][colIndex] = value;
    updateContent(newData);
  };

  const addRow = () => {
    const colCount = Math.max(...data.map(row => row.length));
    const newRow = new Array(colCount).fill('');
    updateContent([...data, newRow]);
  };

  const removeRow = () => {
    if (data.length > 1) {
      updateContent(data.slice(0, -1));
    }
  };

  const addColumn = () => {
    const newData = data.map(row => [...row, '']);
    updateContent(newData);
  };

  const removeColumn = () => {
    const maxCols = Math.max(...data.map(row => row.length));
    if (maxCols > 1) {
      const newData = data.map(row => row.slice(0, -1));
      updateContent(newData);
    }
  };

  const exportCsv = () => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          onChange(e.target.result);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const insertTemplate = (template) => {
    const templates = {
      contacts: 'Name,Email,Phone,Company\nJohn Doe,john@example.com,555-1234,Acme Corp\nJane Smith,jane@example.com,555-5678,Tech Inc',
      sales: 'Date,Product,Quantity,Price,Total\n2024-01-01,Widget A,10,25.99,259.90\n2024-01-02,Widget B,5,45.50,227.50',
      inventory: 'SKU,Product Name,Category,Stock,Price\nWID001,Widget Alpha,Electronics,150,29.99\nWID002,Widget Beta,Electronics,75,39.99'
    };
    
    onChange(templates[template] || 'Column 1,Column 2,Column 3\nRow 1 Col 1,Row 1 Col 2,Row 1 Col 3');
  };

  if (viewMode === 'raw') {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        {!readOnly && (
          <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', gap: 1 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="table">
                <TableViewIcon sx={{ mr: 0.5 }} />
                Table
              </ToggleButton>
              <ToggleButton value="raw">
                <RawViewIcon sx={{ mr: 0.5 }} />
                Raw
              </ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Button size="small" onClick={exportCsv}>
                <ExportIcon sx={{ mr: 0.5 }} />
                Export
              </Button>
              <Button size="small" onClick={importCsv}>
                <ImportIcon sx={{ mr: 0.5 }} />
                Import
              </Button>
            </Box>
          </Toolbar>
        )}

        {/* Raw Text Editor */}
        <TextField
          fullWidth
          multiline
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter CSV data here..."
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
                resize: 'none'
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
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      {!readOnly && (
        <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', gap: 1, flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="table">
              <TableViewIcon sx={{ mr: 0.5 }} />
              Table
            </ToggleButton>
            <ToggleButton value="raw">
              <RawViewIcon sx={{ mr: 0.5 }} />
              Raw
            </ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" onClick={addRow}>
              <AddIcon sx={{ mr: 0.5 }} />
              Row
            </Button>
            <Button size="small" onClick={removeRow} disabled={data.length <= 1}>
              <RemoveIcon sx={{ mr: 0.5 }} />
              Row
            </Button>
            <Button size="small" onClick={addColumn}>
              <AddIcon sx={{ mr: 0.5 }} />
              Column
            </Button>
            <Button size="small" onClick={removeColumn}>
              <RemoveIcon sx={{ mr: 0.5 }} />
              Column
            </Button>
          </Box>

          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Button size="small" onClick={() => insertTemplate('contacts')}>
              Contacts
            </Button>
            <Button size="small" onClick={() => insertTemplate('sales')}>
              Sales
            </Button>
            <Button size="small" onClick={() => insertTemplate('inventory')}>
              Inventory
            </Button>
            <Button size="small" onClick={exportCsv}>
              <ExportIcon sx={{ mr: 0.5 }} />
              Export
            </Button>
            <Button size="small" onClick={importCsv}>
              <ImportIcon sx={{ mr: 0.5 }} />
              Import
            </Button>
          </Box>
        </Toolbar>
      )}

      {/* Table View */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <TableContainer component={Paper} sx={{ height: '100%' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50, backgroundColor: 'grey.100', fontWeight: 'bold' }}>
                  #
                </TableCell>
                {data[0]?.map((_, colIndex) => (
                  <TableCell
                    key={colIndex}
                    sx={{
                      minWidth: 150,
                      backgroundColor: 'grey.100',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  >
                    {String.fromCharCode(65 + colIndex)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell
                    sx={{
                      backgroundColor: 'grey.50',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  >
                    {rowIndex + 1}
                  </TableCell>
                  {row.map((cell, colIndex) => (
                    <TableCell key={colIndex} sx={{ p: 0 }}>
                      <TextField
                        fullWidth
                        value={cell || ''}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        variant="standard"
                        size="small"
                        InputProps={{
                          disableUnderline: true,
                          readOnly,
                          sx: {
                            px: 1,
                            py: 0.5,
                            fontSize: '14px',
                            '& input': {
                              fontWeight: rowIndex === 0 ? 'bold' : 'normal'
                            }
                          }
                        }}
                        sx={{
                          '& .MuiInput-root': {
                            '&:hover:not(.Mui-disabled):before': {
                              borderBottom: readOnly ? 'none' : '1px solid rgba(0, 0, 0, 0.42)'
                            },
                            '&:focus-within': {
                              backgroundColor: readOnly ? 'transparent' : 'rgba(25, 118, 210, 0.04)'
                            }
                          }
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Info Panel */}
      <Box sx={{ borderTop: 1, borderColor: 'divider', backgroundColor: '#f5f5f5', p: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {data.length} rows • {Math.max(...data.map(row => row.length))} columns • Delimiter: "{delimiter}"
        </Typography>
      </Box>
    </Box>
  );
};

export default CsvEditor;
