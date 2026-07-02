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
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  AddCircle as AddRowIcon,
  RemoveCircle as RemoveRowIcon,
  FilterList,
  InsertChart,
  Functions,
  Sort,
  ViewColumn,
  TableRows,
  Delete,
  PlaylistAdd
} from '@mui/icons-material';

const SpreadsheetEditor = ({ content, onChange, readOnly = false }) => {
  const [data, setData] = useState({ sheets: [{ name: 'Sheet1', data: [['']] }] });
  const [activeSheet, setActiveSheet] = useState(0);
  const [selectedCell, setSelectedCell] = useState({ row: -1, col: -1 });
  const [filterColumn, setFilterColumn] = useState(-1);
  const [sortColumn, setSortColumn] = useState(-1);
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    try {
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.sheets && parsed.sheets.length > 0) {
          setData(parsed);
        }
      }
    } catch (error) {
      console.error('Error parsing spreadsheet content:', error);
      setData({
        sheets: [{
          name: 'Sheet1',
          data: [
            ['Column A', 'Column B', 'Column C'],
            ['', '', ''],
            ['', '', '']
          ]
        }]
      });
    }
  }, [content]);

  const updateContent = (newData) => {
    setData(newData);
    onChange(JSON.stringify(newData, null, 2));
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const newData = { ...data };
    // Check if value is a formula and calculate it
    if (value.startsWith('=')) {
      const calculatedValue = calculateFormula(value, rowIndex, colIndex);
      newData.sheets[activeSheet].data[rowIndex][colIndex] = calculatedValue;
    } else {
      newData.sheets[activeSheet].data[rowIndex][colIndex] = value;
    }
    updateContent(newData);
  };

  const addRow = () => {
    const newData = { ...data };
    const currentSheet = newData.sheets[activeSheet];
    const colCount = currentSheet.data[0]?.length || 1;
    const newRow = new Array(colCount).fill('');
    currentSheet.data.push(newRow);
    updateContent(newData);
  };

  const removeRow = () => {
    const newData = { ...data };
    const currentSheet = newData.sheets[activeSheet];
    if (currentSheet.data.length > 1) {
      currentSheet.data.pop();
      updateContent(newData);
    }
  };

  const addColumn = () => {
    const newData = { ...data };
    const currentSheet = newData.sheets[activeSheet];
    currentSheet.data.forEach(row => row.push(''));
    updateContent(newData);
  };

  const removeColumn = () => {
    const newData = { ...data };
    const currentSheet = newData.sheets[activeSheet];
    if (currentSheet.data[0]?.length > 1) {
      currentSheet.data.forEach(row => row.pop());
      updateContent(newData);
    }
  };

  // New Excel-like functions
  const insertRowAt = (index) => {
    const newData = { ...data };
    const currentSheet = newData.sheets[activeSheet];
    const colCount = currentSheet.data[0]?.length || 1;
    const newRow = new Array(colCount).fill('');
    currentSheet.data.splice(index, 0, newRow);
    updateContent(newData);
  };

  const deleteRowAt = (index) => {
    const newData = { ...data };
    const currentSheet = newData.sheets[activeSheet];
    if (currentSheet.data.length > 1) {
      currentSheet.data.splice(index, 1);
      updateContent(newData);
    }
  };

  const insertColumnAt = (index) => {
    const newData = { ...data };
    const currentSheet = newData.sheets[activeSheet];
    currentSheet.data.forEach(row => row.splice(index, 0, ''));
    updateContent(newData);
  };

  const deleteColumnAt = (index) => {
    const newData = { ...data };
    const currentSheet = newData.sheets[activeSheet];
    if (currentSheet.data[0]?.length > 1) {
      currentSheet.data.forEach(row => row.splice(index, 1));
      updateContent(newData);
    }
  };

  const sortByColumn = (colIndex) => {
    const newData = { ...data };
    const currentSheet = newData.sheets[activeSheet];
    const header = currentSheet.data[0];
    const dataRows = currentSheet.data.slice(1);
    
    const direction = sortColumn === colIndex && sortDirection === 'asc' ? 'desc' : 'asc';
    
    dataRows.sort((a, b) => {
      const aVal = a[colIndex] || '';
      const bVal = b[colIndex] || '';
      
      if (direction === 'asc') {
        return aVal.localeCompare(bVal, undefined, { numeric: true });
      } else {
        return bVal.localeCompare(aVal, undefined, { numeric: true });
      }
    });
    
    currentSheet.data = [header, ...dataRows];
    setSortColumn(colIndex);
    setSortDirection(direction);
    updateContent(newData);
  };

  const toggleFilter = (colIndex) => {
    setFilterColumn(filterColumn === colIndex ? -1 : colIndex);
  };

  const calculateFormula = (formula, rowIndex, colIndex) => {
    try {
      if (formula.startsWith('=SUM(')) {
        // Calculate sum of range or current column
        const currentSheet = data.sheets[activeSheet];
        let sum = 0;
        for (let i = 1; i < currentSheet.data.length; i++) {
          const value = parseFloat(currentSheet.data[i][colIndex]) || 0;
          sum += value;
        }
        return sum.toString();
      }
      if (formula.startsWith('=AVERAGE(')) {
        // Calculate average of current column
        const currentSheet = data.sheets[activeSheet];
        let sum = 0, count = 0;
        for (let i = 1; i < currentSheet.data.length; i++) {
          const value = parseFloat(currentSheet.data[i][colIndex]);
          if (!isNaN(value)) {
            sum += value;
            count++;
          }
        }
        return count > 0 ? (sum / count).toFixed(2) : '0';
      }
      if (formula.startsWith('=COUNT(')) {
        // Count non-empty cells in current column
        const currentSheet = data.sheets[activeSheet];
        let count = 0;
        for (let i = 1; i < currentSheet.data.length; i++) {
          if (currentSheet.data[i][colIndex] && currentSheet.data[i][colIndex].trim() !== '') {
            count++;
          }
        }
        return count.toString();
      }
      return formula;
    } catch (error) {
      return '#ERROR';
    }
  };

  const getColumnLabel = (index) => {
    let label = '';
    while (index >= 0) {
      label = String.fromCharCode(65 + (index % 26)) + label;
      index = Math.floor(index / 26) - 1;
    }
    return label;
  };

  const currentSheet = data.sheets[activeSheet] || { name: 'Sheet1', data: [['']] };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!readOnly && (
        <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', gap: 1 }}>
          <Typography variant="subtitle2">
            {currentSheet.name}
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {/* Row Operations */}
            <Button size="small" startIcon={<TableRows />} onClick={addRow}>
              Add Row
            </Button>
            <Button size="small" startIcon={<PlaylistAdd />} onClick={() => selectedCell.row >= 0 && insertRowAt(selectedCell.row)}>
              Insert Row
            </Button>
            <Button size="small" startIcon={<Delete />} onClick={() => selectedCell.row >= 0 && deleteRowAt(selectedCell.row)} disabled={currentSheet.data.length <= 1}>
              Delete Row
            </Button>
            
            {/* Column Operations */}
            <Button size="small" startIcon={<ViewColumn />} onClick={addColumn}>
              Add Column
            </Button>
            <Button size="small" startIcon={<AddIcon />} onClick={() => selectedCell.col >= 0 && insertColumnAt(selectedCell.col)}>
              Insert Column
            </Button>
            <Button size="small" startIcon={<RemoveIcon />} onClick={() => selectedCell.col >= 0 && deleteColumnAt(selectedCell.col)} disabled={currentSheet.data[0]?.length <= 1}>
              Delete Column
            </Button>
            
            {/* Excel Features */}
            <Button size="small" startIcon={<Sort />} onClick={() => selectedCell.col >= 0 && sortByColumn(selectedCell.col)}>
              Sort
            </Button>
            <Button size="small" startIcon={<FilterList />} onClick={() => selectedCell.col >= 0 && toggleFilter(selectedCell.col)}>
              Filter
            </Button>
            <Button size="small" startIcon={<Functions />} title="Use formulas: =SUM(), =AVERAGE(), =COUNT() in cells">
              Formulas
            </Button>
          </Box>
        </Toolbar>
      )}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <TableContainer component={Paper} sx={{ height: '100%' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50, backgroundColor: 'grey.100', fontWeight: 'bold', textAlign: 'center' }}>
                  #
                </TableCell>
                {currentSheet.data[0]?.map((_, colIndex) => (
                  <TableCell 
                    key={colIndex} 
                    sx={{ 
                      minWidth: 120, 
                      backgroundColor: sortColumn === colIndex ? 'primary.light' : 'grey.100',
                      fontWeight: 'bold', 
                      textAlign: 'center',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => setSelectedCell({ row: -1, col: colIndex })}
                  >
                    {getColumnLabel(colIndex)}
                    {sortColumn === colIndex && (
                      <Sort sx={{ 
                        fontSize: 16, 
                        ml: 0.5,
                        transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none'
                      }} />
                    )}
                    {filterColumn === colIndex && (
                      <FilterList sx={{ fontSize: 16, ml: 0.5, color: 'primary.main' }} />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {currentSheet.data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell 
                    sx={{ 
                      backgroundColor: selectedCell.row === rowIndex ? 'primary.light' : 'grey.50', 
                      fontWeight: 'bold', 
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedCell({ row: rowIndex, col: -1 })}
                  >
                    {rowIndex + 1}
                  </TableCell>
                  {row.map((cell, colIndex) => (
                    <TableCell 
                      key={colIndex} 
                      sx={{ 
                        p: 0,
                        backgroundColor: selectedCell.row === rowIndex && selectedCell.col === colIndex ? 'primary.light' : 'transparent'
                      }}
                      onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                    >
                      <TextField
                        fullWidth
                        value={cell}
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
                              textAlign: rowIndex === 0 ? 'center' : 'left',
                              fontWeight: rowIndex === 0 ? 'bold' : 'normal'
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
      {data.sheets.length > 1 && (
        <Box sx={{ borderTop: 1, borderColor: 'divider', p: 1 }}>
          {data.sheets.map((sheet, index) => (
            <Button key={index} size="small" variant={index === activeSheet ? 'contained' : 'text'} onClick={() => setActiveSheet(index)} sx={{ mr: 1 }}>
              {sheet.name}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SpreadsheetEditor;
