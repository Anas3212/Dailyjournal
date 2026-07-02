import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Toolbar,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Tooltip,
  Popover,
  Grid,
  Slider,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatListBulleted,
  FormatListNumbered,
  Link,
  Image,
  Undo,
  Redo,
  FormatColorText,
  FormatColorFill,
  TableChart,
  FindReplace,
  Print,
  Save,
  FormatIndentIncrease,
  FormatIndentDecrease,
  FormatStrikethrough,
  Subscript,
  Superscript,
  FormatQuote,
  Code,
  Title,
  HorizontalRule,
  FormatClear,
  Add,
  Remove,
  Delete,
  ContentCopy,
  AddCircleOutline,
  RemoveCircleOutline,
  Rectangle,
  Circle,
  TrendingFlat,
  Timeline,
  Crop,
  OpenWith,
  AspectRatio,
  ChangeHistory,
  Star,
  Hexagon
} from '@mui/icons-material';

const DocumentEditor = ({ content, onChange, readOnly = false }) => {
  const editorRef = useRef(null);
  const [selectedFormat, setSelectedFormat] = useState([]);
  const [fontSize, setFontSize] = useState('14');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [showHighlightPicker, setShowHighlightPicker] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [savedSelection, setSavedSelection] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [cropData, setCropData] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [cropStartPos, setCropStartPos] = useState({ x: 0, y: 0 });
  const [showShapeDialog, setShowShapeDialog] = useState(false);
  const [selectedShape, setSelectedShape] = useState('rectangle');
  const [shapeColor, setShapeColor] = useState('#000000');
  const [shapeSize, setShapeSize] = useState({ width: 100, height: 50 });
  const [selectedShapeElement, setSelectedShapeElement] = useState(null);
  const [shapeRotation, setShapeRotation] = useState(0);
  const [shapeBorderWidth, setShapeBorderWidth] = useState(2);
  const [shapeFillOpacity, setShapeFillOpacity] = useState(0.2);
  const [shapeFormatDialog, setShapeFormatDialog] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content || '';
      // Use setTimeout to ensure DOM is fully updated
      setTimeout(() => {
        addShapeDragListeners();
        reinitializeAllShapes();
        initializeEnhancedTables();
      }, 100);
    }
  }, [content]);

  useEffect(() => {
    // Add table listeners when component mounts
    addTableEventListeners();
    addEnhancedTableEventListeners();
    // Add shape listeners when component mounts
    addShapeDragListeners();
    // Initialize enhanced tables
    initializeEnhancedTables();
  }, []);

  const handleContentChange = (saveToHistory = true) => {
    if (editorRef.current && onChange) {
      const newContent = editorRef.current.innerHTML;
      if (saveToHistory && undoStack.length === 0 || undoStack[undoStack.length - 1] !== newContent) {
        setUndoStack(prev => [...prev.slice(-19), newContent]); // Keep last 20 states
        setRedoStack([]); // Clear redo stack on new change
      }
      
      onChange(newContent);
      
      // Reinitialize shapes and tables after content changes
      setTimeout(() => {
        addShapeDragListeners();
        initializeEnhancedTables();
      }, 50);
    }
  };

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleContentChange();
  };

  const handleFormatChange = (event, newFormats) => {
    setSelectedFormat(newFormats);
  };

  const insertLink = () => {
    // Get selected text and create a link
    const selection = window.getSelection();
    if (selection.toString()) {
      executeCommand('createLink', 'https://example.com');
    } else {
      executeCommand('insertHTML', '<a href="https://example.com">Link Text</a>');
    }
  };

  const insertImage = () => {
    // Create a file input for image upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target.result);
          setShowImageEditor(true);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Enhanced Word-like functions (no dialogs)
  const insertTable = () => {
    // Force focus away from editor to ensure prompt works
    document.activeElement.blur();
    
    // Use setTimeout to ensure prompt appears
    setTimeout(() => {
      const rows = window.prompt('Enter number of rows (1-20):');
      if (rows === null) return; // User cancelled
      
      const cols = window.prompt('Enter number of columns (1-10):');
      if (cols === null) return; // User cancelled
      
      if (!rows || !cols || isNaN(rows) || isNaN(cols)) {
        alert('Please enter valid numbers for rows and columns.');
        return;
      }
    
    const numRows = Math.max(1, Math.min(20, parseInt(rows)));
    const numCols = Math.max(1, Math.min(10, parseInt(cols)));
    
    // Create table with container and enhanced controls
    const tableId = `enhanced-table-${Date.now()}`;
    let tableHTML = `
      <div class="table-wrapper" style="
        position: absolute;
        display: inline-block;
        margin: 15px;
        border: 2px dashed transparent;
        transition: all 0.2s ease;
        left: 20px;
        top: 20px;
      ">
        <!-- Enhanced Table Controls -->
        <div class="table-toolbar" style="
          position: absolute;
          top: -40px;
          right: 0;
          display: none;
          gap: 6px;
          background: white;
          padding: 4px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 1000;
        ">
          <button onclick="addTableRow('${tableId}')" style="
            width: 28px;
            height: 28px;
            border: 1px solid #ddd;
            background: #f8f9fa;
            cursor: pointer;
            border-radius: 4px;
            font-size: 18px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #28a745;
            transition: all 0.2s;
          " 
          onmouseover="this.style.background='#e8f5e8'; this.style.borderColor='#28a745';"
          onmouseout="this.style.background='#f8f9fa'; this.style.borderColor='#ddd';"
          title="Add Row">+</button>
          
          <button onclick="removeTableRow('${tableId}')" style="
            width: 28px;
            height: 28px;
            border: 1px solid #ddd;
            background: #f8f9fa;
            cursor: pointer;
            border-radius: 4px;
            font-size: 18px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #dc3545;
            transition: all 0.2s;
          " 
          onmouseover="this.style.background='#fdeaea'; this.style.borderColor='#dc3545';"
          onmouseout="this.style.background='#f8f9fa'; this.style.borderColor='#ddd';"
          title="Remove Row">−</button>
          
          <button onclick="addTableColumn('${tableId}')" style="
            width: 28px;
            height: 28px;
            border: 1px solid #ddd;
            background: #f8f9fa;
            cursor: pointer;
            border-radius: 4px;
            font-size: 18px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #007bff;
            transition: all 0.2s;
          " 
          onmouseover="this.style.background='#e7f3ff'; this.style.borderColor='#007bff';"
          onmouseout="this.style.background='#f8f9fa'; this.style.borderColor='#ddd';"
          title="Add Column">+</button>
          
          <button onclick="removeTableColumn('${tableId}')" style="
            width: 28px;
            height: 28px;
            border: 1px solid #ddd;
            background: #f8f9fa;
            cursor: pointer;
            border-radius: 4px;
            font-size: 18px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffc107;
            transition: all 0.2s;
          " 
          onmouseover="this.style.background='#fff8e1'; this.style.borderColor='#ffc107';"
          onmouseout="this.style.background='#f8f9fa'; this.style.borderColor='#ddd';"
          title="Remove Column">−</button>
          
          <button onclick="deleteTable('${tableId}')" style="
            width: 28px;
            height: 28px;
            border: 1px solid #dc3545;
            background: #dc3545;
            color: white;
            cursor: pointer;
            border-radius: 4px;
            font-size: 18px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          " 
          onmouseover="this.style.background='#c82333';"
          onmouseout="this.style.background='#dc3545';"
          title="Delete Table">×</button>
        </div>
        
        <!-- Always Visible Resize Handles -->
        <div class="resize-handle se" style="
          position: absolute;
          bottom: -6px;
          right: -6px;
          width: 16px;
          height: 16px;
          background: #007bff;
          cursor: se-resize;
          border-radius: 3px;
          display: block;
          z-index: 1001;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
        
        <!-- Corner Resize Handles -->
        <div class="resize-handle nw" style="
          position: absolute;
          top: -6px;
          left: -6px;
          width: 12px;
          height: 12px;
          background: #007bff;
          cursor: nw-resize;
          border-radius: 2px;
          display: block;
          z-index: 1001;
          border: 1px solid white;
        "></div>
        
        <div class="resize-handle ne" style="
          position: absolute;
          top: -6px;
          right: -6px;
          width: 12px;
          height: 12px;
          background: #007bff;
          cursor: ne-resize;
          border-radius: 2px;
          display: block;
          z-index: 1001;
          border: 1px solid white;
        "></div>
        
        <div class="resize-handle sw" style="
          position: absolute;
          bottom: -6px;
          left: -6px;
          width: 12px;
          height: 12px;
          background: #007bff;
          cursor: sw-resize;
          border-radius: 2px;
          display: block;
          z-index: 1001;
          border: 1px solid white;
        "></div>
        
        <!-- Edge Resize Handles -->
        <div class="resize-handle n" style="
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 8px;
          background: #007bff;
          cursor: n-resize;
          border-radius: 2px;
          display: block;
          z-index: 1001;
          border: 1px solid white;
        "></div>
        
        <div class="resize-handle s" style="
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 8px;
          background: #007bff;
          cursor: s-resize;
          border-radius: 2px;
          display: block;
          z-index: 1001;
          border: 1px solid white;
        "></div>
        
        <div class="resize-handle e" style="
          position: absolute;
          right: -4px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 20px;
          background: #007bff;
          cursor: e-resize;
          border-radius: 2px;
          display: block;
          z-index: 1001;
          border: 1px solid white;
        "></div>
        
        <div class="resize-handle w" style="
          position: absolute;
          left: -4px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 20px;
          background: #007bff;
          cursor: w-resize;
          border-radius: 2px;
          display: block;
          z-index: 1001;
          border: 1px solid white;
        "></div>
        
        <!-- Drag Handle -->
        <div class="drag-handle" style="
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 12px;
          background: #28a745;
          cursor: move;
          border-radius: 6px;
          display: block;
          z-index: 1001;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
        
        <table id="${tableId}" class="enhanced-table" style="
          border-collapse: collapse;
          width: 100%;
          margin: 0;
          min-width: 250px;
          background: white;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: relative;
        ">`;
    
    // Generate table content
    for (let i = 0; i < numRows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < numCols; j++) {
        const isHeader = i === 0;
        const cellTag = isHeader ? 'th' : 'td';
        const cellContent = isHeader ? `Header ${j + 1}` : `Row ${i} Col ${j + 1}`;
        
        tableHTML += `<${cellTag} style="
          border: 1px solid #dee2e6;
          padding: 12px;
          text-align: left;
          min-width: 100px;
          background: ${isHeader ? '#f8f9fa' : 'white'};
          font-weight: ${isHeader ? 'bold' : 'normal'};
          color: ${isHeader ? '#495057' : '#212529'};
        ">${cellContent}</${cellTag}>`;
      }
      tableHTML += '</tr>';
    }
    
    tableHTML += '</table></div>';
    
    executeCommand('insertHTML', tableHTML);
    
    // Initialize table functionality
    setTimeout(() => {
      initializeEnhancedTables();
      handleContentChange();
    }, 100);
      
    }, 10); // Small delay for prompt
  };

  const changeTextColor = (color = '#ff0000') => {
    if (!editorRef.current) return;
    
    // Focus the editor first
    editorRef.current.focus();
    
    // Use saved selection if available
    if (savedSelection && savedSelection.text.length > 0) {
      console.log('Using saved selection:', savedSelection.text);
      
      // Restore the saved selection
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedSelection.range);
      
      // Apply color using manual method for reliability
      try {
        const span = document.createElement('span');
        span.style.color = color;
        span.textContent = savedSelection.text;
        
        savedSelection.range.deleteContents();
        savedSelection.range.insertNode(span);
        
        console.log('Applied color to saved selection');
      } catch (error) {
        console.error('Failed to apply color to saved selection:', error);
      }
      
      // Clear saved selection
      setSavedSelection(null);
    } else {
      // Check current selection
      const selection = window.getSelection();
      const selectedText = selection.toString();
      
      if (selectedText.length > 0) {
        console.log('Applying color to current selection:', selectedText);
        document.execCommand('foreColor', false, color);
      } else {
        console.log('No text selected, inserting colored text');
        // Enhanced: Insert custom colored text with the selected color
        const colorName = getColorName(color);
        const coloredSpan = `<span style="color: ${color}; font-weight: bold;">${colorName} text</span>&nbsp;`;
        document.execCommand('insertHTML', false, coloredSpan);
      }
    }
    
    handleContentChange();
    setShowColorPicker(null);
  };

  const changeBackgroundColor = (color = '#ffff00') => {
    if (!editorRef.current) return;
    
    // Focus the editor first
    editorRef.current.focus();
    
    // Use saved selection if available
    if (savedSelection && savedSelection.text.length > 0) {
      console.log('Using saved selection for highlight:', savedSelection.text);
      
      // Restore the saved selection
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedSelection.range);
      
      // Apply background color using manual method for reliability
      try {
        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.textContent = savedSelection.text;
        
        savedSelection.range.deleteContents();
        savedSelection.range.insertNode(span);
        
        console.log('Applied background color to saved selection');
      } catch (error) {
        console.error('Failed to apply background color to saved selection:', error);
      }
      
      // Clear saved selection
      setSavedSelection(null);
    } else {
      // Check current selection
      const selection = window.getSelection();
      const selectedText = selection.toString();
      
      if (selectedText.length > 0) {
        console.log('Applying background color to current selection:', selectedText);
        document.execCommand('hiliteColor', false, color);
      } else {
        console.log('No text selected, inserting highlighted text');
        // Enhanced: Insert custom highlighted text with the selected color
        const colorName = getColorName(color);
        const highlightedSpan = `<span style="background-color: ${color}; padding: 2px 4px; border-radius: 2px;">${colorName} highlighted</span>&nbsp;`;
        document.execCommand('insertHTML', false, highlightedSpan);
      }
    }
    
    handleContentChange();
    setShowHighlightPicker(null);
  };

  // Helper function to get color name
  const getColorName = (color) => {
    const colorNames = {
      '#000000': 'Black', '#FF0000': 'Red', '#00FF00': 'Green', '#0000FF': 'Blue',
      '#FFFF00': 'Yellow', '#FF00FF': 'Magenta', '#00FFFF': 'Cyan', '#FFFFFF': 'White',
      '#800000': 'Maroon', '#008000': 'Dark Green', '#000080': 'Navy', '#808000': 'Olive',
      '#800080': 'Purple', '#008080': 'Teal', '#C0C0C0': 'Silver', '#808080': 'Gray',
      '#FF9999': 'Light Red', '#99FF99': 'Light Green', '#9999FF': 'Light Blue',
      '#FFFF99': 'Light Yellow', '#FF99FF': 'Light Magenta', '#99FFFF': 'Light Cyan',
      '#FFE6CC': 'Peach', '#E6E6FA': 'Lavender'
    };
    return colorNames[color.toUpperCase()] || 'Custom';
  };

  // Color picker colors
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF',
    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080',
    '#FF9999', '#99FF99', '#9999FF', '#FFFF99', '#FF99FF', '#99FFFF', '#FFE6CC', '#E6E6FA'
  ];

  // Image editing functions
  const cropImage = (imageElement, cropData) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = cropData.width;
    canvas.height = cropData.height;
    
    ctx.drawImage(
      imageElement,
      cropData.x, cropData.y, cropData.width, cropData.height,
      0, 0, cropData.width, cropData.height
    );
    
    return canvas.toDataURL();
  };

  const resizeImage = (imageElement, newWidth, newHeight) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    ctx.drawImage(imageElement, 0, 0, newWidth, newHeight);
    return canvas.toDataURL();
  };

  const rotateImage = (imageElement, degrees) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const radians = (degrees * Math.PI) / 180;
    canvas.width = imageElement.height;
    canvas.height = imageElement.width;
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.drawImage(imageElement, -imageElement.width / 2, -imageElement.height / 2);
    
    return canvas.toDataURL();
  };

  // Enhanced crop functions with drag support
  const handleCropMouseDown = (e, imageRect) => {
    e.preventDefault();
    setIsDraggingCrop(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setCropStartPos({ x, y });
    setCropData({ x, y, width: 10, height: 10 });
  };

  const handleCropMouseMove = (e, imageRect) => {
    if (!isDraggingCrop) return;
    
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;
    
    const width = Math.abs(currentX - cropStartPos.x);
    const height = Math.abs(currentY - cropStartPos.y);
    const x = Math.min(cropStartPos.x, currentX);
    const y = Math.min(cropStartPos.y, currentY);
    
    setCropData({
      x: Math.max(0, Math.min(x, 100 - width)),
      y: Math.max(0, Math.min(y, 100 - height)),
      width: Math.min(width, 100),
      height: Math.min(height, 100)
    });
  };

  const handleCropMouseUp = () => {
    setIsDraggingCrop(false);
  };

  const findAndReplace = () => {
    // Use browser's built-in find functionality
    if (document.execCommand) {
      document.execCommand('find', false, null);
    }
  };

  // New advanced functions
  const insertHeading = (level = 1) => {
    executeCommand('formatBlock', `<h${level}>`);
  };

  const insertQuote = () => {
    executeCommand('formatBlock', '<blockquote>');
  };

  const insertCodeBlock = () => {
    executeCommand('formatBlock', '<pre>');
  };

  const clearFormatting = () => {
    executeCommand('removeFormat');
  };

  const insertHorizontalRule = () => {
    executeCommand('insertHorizontalRule');
  };

  const toggleStrikethrough = () => {
    executeCommand('strikeThrough');
  };

  const insertSubscript = () => {
    executeCommand('subscript');
  };

  const insertSuperscript = () => {
    executeCommand('superscript');
  };

  const insertSymbol = (symbol) => {
    executeCommand('insertText', symbol);
  };

  // Direct Shape insertion functions (Word-like) - positioned within editor bounds
  const insertWordLikeShape = (shapeType) => {
    const shapeId = `word-shape-${Date.now()}`;
    const defaultColor = '#0078d4';
    const defaultSize = shapeType === 'circle' ? { width: 80, height: 80 } : 
                      shapeType === 'arrow' || shapeType === 'line' ? { width: 120, height: 30 } :
                      shapeType === 'triangle' || shapeType === 'star' ? { width: 80, height: 80 } :
                      shapeType === 'hexagon' ? { width: 90, height: 90 } :
                      { width: 100, height: 60 };
    const fillOpacity = 0.2;
    const borderWidth = 2;
    const fillColor = `${defaultColor}${Math.round(fillOpacity * 255).toString(16).padStart(2, '0')}`;
    
    // Calculate safe insertion position within editor bounds
    const editorRect = editorRef.current.getBoundingClientRect();
    const safeLeft = Math.max(20, Math.min(200, editorRect.width - defaultSize.width - 50));
    const safeTop = Math.max(20, Math.min(100, editorRect.height - defaultSize.height - 50));
    
    // Create shape container with Word-like styling and text editing capability
    const shapeContainer = document.createElement('div');
    shapeContainer.id = shapeId;
    shapeContainer.className = 'word-like-shape';
    shapeContainer.style.cssText = `
      position: absolute;
      width: ${defaultSize.width}px;
      height: ${defaultSize.height}px;
      left: ${safeLeft}px;
      top: ${safeTop}px;
      cursor: move;
      user-select: none;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Store shape properties as data attributes for easy access
    shapeContainer.setAttribute('data-shape-type', shapeType);
    shapeContainer.setAttribute('data-border-color', defaultColor);
    shapeContainer.setAttribute('data-border-width', borderWidth);
    shapeContainer.setAttribute('data-fill-opacity', fillOpacity);
    
    // Create the actual shape content
    let shapeContent = '';
    switch (shapeType) {
      case 'rectangle':
        shapeContent = `
          <div class="shape-content" style="
            width: 100%;
            height: 100%;
            border: ${borderWidth}px solid ${defaultColor};
            background-color: ${fillColor};
            box-sizing: border-box;
            position: relative;
          ">
            <div class="shape-text" contenteditable="true" style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: calc(100% - 16px);
              height: calc(100% - 16px);
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-size: 12px;
              color: #333;
              outline: none;
              overflow: hidden;
              word-wrap: break-word;
              cursor: text;
            " placeholder="Text"></div>
          </div>
        `;
        break;
      case 'circle':
        shapeContent = `
          <div class="shape-content" style="
            width: 100%;
            height: 100%;
            border: ${borderWidth}px solid ${defaultColor};
            background-color: ${fillColor};
            border-radius: 50%;
            box-sizing: border-box;
            position: relative;
          ">
            <div class="shape-text" contenteditable="true" style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: calc(100% - 20px);
              height: calc(100% - 20px);
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-size: 12px;
              color: #333;
              outline: none;
              overflow: hidden;
              word-wrap: break-word;
              cursor: text;
            " placeholder="Text"></div>
          </div>
        `;
        break;
      case 'arrow':
        shapeContent = `
          <div style="position: relative; width: 100%; height: 100%;">
            <svg class="shape-content" width="100%" height="100%" viewBox="0 0 ${defaultSize.width} ${defaultSize.height}">
              <defs>
                <marker id="arrowhead-${shapeId}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="${defaultColor}" />
                </marker>
              </defs>
              <line x1="10" y1="${defaultSize.height/2}" x2="${defaultSize.width-10}" y2="${defaultSize.height/2}" 
                    stroke="${defaultColor}" stroke-width="${borderWidth}" marker-end="url(#arrowhead-${shapeId})" />
            </svg>
            <div class="shape-text" contenteditable="true" style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 10px;
              color: #333;
              outline: none;
              white-space: nowrap;
              cursor: text;
              background: rgba(255,255,255,0.8);
              padding: 2px 4px;
              border-radius: 2px;
            " placeholder="Text"></div>
          </div>
        `;
        break;
      case 'line':
        shapeContent = `
          <div style="position: relative; width: 100%; height: 100%;">
            <svg class="shape-content" width="100%" height="100%" viewBox="0 0 ${defaultSize.width} ${defaultSize.height}">
              <line x1="10" y1="${defaultSize.height/2}" x2="${defaultSize.width-10}" y2="${defaultSize.height/2}" 
                    stroke="${defaultColor}" stroke-width="${borderWidth}" />
            </svg>
            <div class="shape-text" contenteditable="true" style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 10px;
              color: #333;
              outline: none;
              white-space: nowrap;
              cursor: text;
              background: rgba(255,255,255,0.8);
              padding: 2px 4px;
              border-radius: 2px;
            " placeholder="Text"></div>
          </div>
        `;
        break;
      case 'triangle':
        shapeContent = `
          <div style="position: relative; width: 100%; height: 100%;">
            <svg class="shape-content" width="100%" height="100%" viewBox="0 0 ${defaultSize.width} ${defaultSize.height}">
              <polygon points="${defaultSize.width/2},10 10,${defaultSize.height-10} ${defaultSize.width-10},${defaultSize.height-10}" 
                       fill="${fillColor}" stroke="${defaultColor}" stroke-width="${borderWidth}" />
            </svg>
            <div class="shape-text" contenteditable="true" style="
              position: absolute;
              top: 60%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 60%;
              text-align: center;
              font-size: 11px;
              color: #333;
              outline: none;
              overflow: hidden;
              word-wrap: break-word;
              cursor: text;
            " placeholder="Text"></div>
          </div>
        `;
        break;
      case 'star':
        shapeContent = `
          <div style="position: relative; width: 100%; height: 100%;">
            <svg class="shape-content" width="100%" height="100%" viewBox="0 0 ${defaultSize.width} ${defaultSize.height}">
              <polygon points="${defaultSize.width/2},5 ${defaultSize.width*0.6},${defaultSize.height*0.35} ${defaultSize.width-5},${defaultSize.height*0.35} ${defaultSize.width*0.7},${defaultSize.height*0.6} ${defaultSize.width*0.8},${defaultSize.height-5} ${defaultSize.width/2},${defaultSize.height*0.75} ${defaultSize.width*0.2},${defaultSize.height-5} ${defaultSize.width*0.3},${defaultSize.height*0.6} 5,${defaultSize.height*0.35} ${defaultSize.width*0.4},${defaultSize.height*0.35}" 
                       fill="${fillColor}" stroke="${defaultColor}" stroke-width="${borderWidth}" />
            </svg>
            <div class="shape-text" contenteditable="true" style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 50%;
              text-align: center;
              font-size: 10px;
              color: #333;
              outline: none;
              overflow: hidden;
              word-wrap: break-word;
              cursor: text;
            " placeholder="Text"></div>
          </div>
        `;
        break;
      case 'hexagon':
        shapeContent = `
          <div style="position: relative; width: 100%; height: 100%;">
            <svg class="shape-content" width="100%" height="100%" viewBox="0 0 ${defaultSize.width} ${defaultSize.height}">
              <polygon points="22,${defaultSize.height/2} ${defaultSize.width*0.3},8 ${defaultSize.width*0.7},8 ${defaultSize.width-22},${defaultSize.height/2} ${defaultSize.width*0.7},${defaultSize.height-8} ${defaultSize.width*0.3},${defaultSize.height-8}" 
                       fill="${fillColor}" stroke="${defaultColor}" stroke-width="${borderWidth}" />
            </svg>
            <div class="shape-text" contenteditable="true" style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 60%;
              text-align: center;
              font-size: 11px;
              color: #333;
              outline: none;
              overflow: hidden;
              word-wrap: break-word;
              cursor: text;
            " placeholder="Text"></div>
          </div>
        `;
        break;
      default:
        return;
    }
    
    shapeContainer.innerHTML = shapeContent;
    
    // Insert into editor at safe position
    editorRef.current.appendChild(shapeContainer);
    
    // Add Word-like functionality and auto-select
    setTimeout(() => {
      addWordLikeShapeHandlers(shapeContainer);
      selectShape(shapeContainer);
      handleContentChange();
    }, 100);
  };

  // Word-like shape handlers with resize handles, rotation, drag, and text editing
  const addWordLikeShapeHandlers = (shape) => {
    if (shape.hasAttribute('data-word-handlers')) return;
    shape.setAttribute('data-word-handlers', 'true');
    
    let isDragging = false;
    let dragStartX, dragStartY, shapeStartLeft, shapeStartTop;
    
    // Add selection handler
    shape.addEventListener('click', (e) => {
      // Don't select if clicking on text area
      if (e.target.classList.contains('shape-text')) return;
      e.stopPropagation();
      selectShape(shape);
    });
    
    // Add drag functionality
    shape.addEventListener('mousedown', (e) => {
      // Only start drag if clicking on the shape itself, not handles or text
      if (e.target.closest('.shape-handle') || e.target.classList.contains('shape-text')) return;
      
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      shapeStartLeft = parseInt(shape.style.left) || 0;
      shapeStartTop = parseInt(shape.style.top) || 0;
      
      shape.style.cursor = 'grabbing';
      shape.style.zIndex = '1000'; // Bring to front while dragging
      e.preventDefault();
      e.stopPropagation();
      
      // Create specific drag handlers for this shape
      const handleDragMove = (moveEvent) => {
        if (!isDragging) return;
        
        const deltaX = moveEvent.clientX - dragStartX;
        const deltaY = moveEvent.clientY - dragStartY;
        
        let newLeft = shapeStartLeft + deltaX;
        let newTop = shapeStartTop + deltaY;
        
        // Constrain within editor bounds
        const editorRect = editorRef.current.getBoundingClientRect();
        const shapeWidth = parseInt(shape.style.width) || 100;
        const shapeHeight = parseInt(shape.style.height) || 60;
        
        // Calculate boundaries relative to editor content
        const minLeft = 0;
        const minTop = 0;
        const maxLeft = Math.max(0, editorRect.width - shapeWidth - 20);
        const maxTop = Math.max(0, editorRect.height - shapeHeight - 20);
        
        // Apply constraints
        newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
        newTop = Math.max(minTop, Math.min(newTop, maxTop));
        
        shape.style.left = newLeft + 'px';
        shape.style.top = newTop + 'px';
        
        // Update handles position in real-time
        updateHandlePositions(shape);
      };
      
      const handleDragEnd = () => {
        if (isDragging) {
          isDragging = false;
          shape.style.cursor = 'move';
          shape.style.zIndex = '10'; // Reset z-index
          handleContentChange();
          
          // Remove event listeners
          document.removeEventListener('mousemove', handleDragMove);
          document.removeEventListener('mouseup', handleDragEnd);
        }
      };
      
      // Add temporary event listeners for this drag operation
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    });
    
    // Add text editing functionality
    const textElement = shape.querySelector('.shape-text');
    if (textElement) {
      // Double-click to edit text
      shape.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        textElement.focus();
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(textElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      });
      
      // Handle text editing events
      textElement.addEventListener('focus', () => {
        textElement.style.outline = '1px solid #0078d4';
      });
      
      textElement.addEventListener('blur', () => {
        textElement.style.outline = 'none';
        handleContentChange();
      });
      
      textElement.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          textElement.blur();
        }
      });
      
      textElement.addEventListener('input', () => {
        handleContentChange();
      });
    }
    
    // Add right-click context menu
    shape.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showShapeContextMenu(e, shape);
    });
  };
  
  // Select shape and show handles (Word-like)
  const selectShape = (shape) => {
    // Clear previous selection
    clearShapeSelection();
    
    setSelectedShapeElement(shape);
    shape.classList.add('selected-shape');
    
    // Create selection handles
    createShapeHandles(shape);
  };
  
  // Clear shape selection
  const clearShapeSelection = () => {
    // Remove existing handles
    document.querySelectorAll('.shape-handle').forEach(handle => handle.remove());
    
    // Remove selection class
    document.querySelectorAll('.selected-shape').forEach(shape => {
      shape.classList.remove('selected-shape');
    });
    
    setSelectedShapeElement(null);
  };
  
  // Create Word-like resize and rotation handles (constrained within editor)
  const createShapeHandles = (shape) => {
    const shapeRect = shape.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    
    // Calculate shape position relative to editor's content area
    const shapeLeft = parseInt(shape.style.left) || 0;
    const shapeTop = parseInt(shape.style.top) || 0;
    const shapeWidth = parseInt(shape.style.width) || shapeRect.width;
    const shapeHeight = parseInt(shape.style.height) || shapeRect.height;
    
    // Resize handles (8 handles like Word) - positioned relative to shape
    const handlePositions = [
      { name: 'nw', x: -4, y: -4, cursor: 'nw-resize' },
      { name: 'n', x: shapeWidth/2 - 4, y: -4, cursor: 'n-resize' },
      { name: 'ne', x: shapeWidth - 4, y: -4, cursor: 'ne-resize' },
      { name: 'e', x: shapeWidth - 4, y: shapeHeight/2 - 4, cursor: 'e-resize' },
      { name: 'se', x: shapeWidth - 4, y: shapeHeight - 4, cursor: 'se-resize' },
      { name: 's', x: shapeWidth/2 - 4, y: shapeHeight - 4, cursor: 's-resize' },
      { name: 'sw', x: -4, y: shapeHeight - 4, cursor: 'sw-resize' },
      { name: 'w', x: -4, y: shapeHeight/2 - 4, cursor: 'w-resize' }
    ];
    
    handlePositions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = 'shape-handle resize-handle';
      handle.style.cssText = `
        position: absolute;
        left: ${shapeLeft + pos.x}px;
        top: ${shapeTop + pos.y}px;
        width: 8px;
        height: 8px;
        background: #fff;
        border: 1px solid #0078d4;
        cursor: ${pos.cursor};
        z-index: 1001;
        box-sizing: border-box;
        pointer-events: auto;
      `;
      handle.setAttribute('data-handle-type', pos.name);
      
      // Add resize functionality
      addResizeHandler(handle, shape, pos.name);
      
      editorRef.current.appendChild(handle);
    });
    
    // Rotation handle - positioned above the shape
    const rotationHandle = document.createElement('div');
    rotationHandle.className = 'shape-handle rotation-handle';
    rotationHandle.style.cssText = `
      position: absolute;
      left: ${shapeLeft + shapeWidth/2 - 4}px;
      top: ${shapeTop - 20}px;
      width: 8px;
      height: 8px;
      background: #0078d4;
      border: 1px solid #fff;
      border-radius: 50%;
      cursor: grab;
      z-index: 1001;
      pointer-events: auto;
    `;
    
    // Add rotation functionality
    addRotationHandler(rotationHandle, shape);
    
    editorRef.current.appendChild(rotationHandle);
  };
  
  // Add resize handler functionality
  const addResizeHandler = (handle, shape, handleType) => {
    let isResizing = false;
    let startX, startY, startWidth, startHeight, startLeft, startTop;
    
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = shape.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      startLeft = shape.offsetLeft;
      startTop = shape.offsetTop;
      
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
    });
    
    const handleResize = (e) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;
      
      // Constrain resize within editor bounds
      const editorRect = editorRef.current.getBoundingClientRect();
      const maxWidth = editorRect.width - startLeft - 20;
      const maxHeight = editorRect.height - startTop - 20;
      
      switch (handleType) {
        case 'se':
          newWidth = Math.max(20, Math.min(startWidth + deltaX, maxWidth));
          newHeight = Math.max(20, Math.min(startHeight + deltaY, maxHeight));
          break;
        case 'sw':
          newWidth = Math.max(20, startWidth - deltaX);
          newHeight = Math.max(20, Math.min(startHeight + deltaY, maxHeight));
          newLeft = Math.max(0, startLeft + deltaX);
          break;
        case 'ne':
          newWidth = Math.max(20, Math.min(startWidth + deltaX, maxWidth));
          newHeight = Math.max(20, startHeight - deltaY);
          newTop = Math.max(0, startTop + deltaY);
          break;
        case 'nw':
          newWidth = Math.max(20, startWidth - deltaX);
          newHeight = Math.max(20, startHeight - deltaY);
          newLeft = Math.max(0, startLeft + deltaX);
          newTop = Math.max(0, startTop + deltaY);
          break;
        case 'n':
          newHeight = Math.max(20, startHeight - deltaY);
          newTop = Math.max(0, startTop + deltaY);
          break;
        case 's':
          newHeight = Math.max(20, Math.min(startHeight + deltaY, maxHeight));
          break;
        case 'e':
          newWidth = Math.max(20, Math.min(startWidth + deltaX, maxWidth));
          break;
        case 'w':
          newWidth = Math.max(20, startWidth - deltaX);
          newLeft = Math.max(0, startLeft + deltaX);
          break;
      }
      
      shape.style.width = newWidth + 'px';
      shape.style.height = newHeight + 'px';
      shape.style.left = newLeft + 'px';
      shape.style.top = newTop + 'px';
      
      // Update handles position
      updateHandlePositions(shape);
    };
    
    const stopResize = () => {
      isResizing = false;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      handleContentChange();
    };
  };
  
  // Add rotation handler functionality
  const addRotationHandler = (handle, shape) => {
    let isRotating = false;
    let startAngle = 0;
    
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isRotating = true;
      
      const rect = shape.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      
      document.addEventListener('mousemove', handleRotation);
      document.addEventListener('mouseup', stopRotation);
    });
    
    const handleRotation = (e) => {
      if (!isRotating) return;
      
      const rect = shape.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const rotation = (currentAngle - startAngle) * (180 / Math.PI);
      
      const currentRotation = parseFloat(shape.style.transform.match(/rotate\(([^)]+)deg\)/)?.[1] || 0);
      const newRotation = currentRotation + rotation;
      
      shape.style.transform = `rotate(${newRotation}deg)`;
      setShapeRotation(newRotation);
    };
    
    const stopRotation = () => {
      isRotating = false;
      document.removeEventListener('mousemove', handleRotation);
      document.removeEventListener('mouseup', stopRotation);
      handleContentChange();
    };
  };
  
  // Update handle positions when shape is resized
  const updateHandlePositions = (shape) => {
    const handles = document.querySelectorAll('.shape-handle');
    handles.forEach(handle => handle.remove());
    createShapeHandles(shape);
  };
  
  // Show enhanced shape context menu with direct formatting
  const showShapeContextMenu = (event, shape) => {
    const contextMenu = document.createElement('div');
    contextMenu.className = 'shape-context-menu';
    contextMenu.style.cssText = `
      position: fixed;
      top: ${event.clientY}px;
      left: ${event.clientX}px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 6px;
      padding: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 2000;
      font-size: 14px;
      min-width: 200px;
      max-width: 250px;
    `;
    
    // Color picker section
    const colorSection = document.createElement('div');
    colorSection.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #333;">Border Color</div>
      <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 12px;">
        ${colors.slice(0, 12).map(color => `
          <div style="
            width: 24px;
            height: 24px;
            background-color: ${color};
            border: 2px solid #ddd;
            border-radius: 3px;
            cursor: pointer;
            transition: transform 0.1s;
          " 
          onmouseover="this.style.transform='scale(1.1)'" 
          onmouseout="this.style.transform='scale(1)'"
          onclick="updateShapeColor('${shape.id}', '${color}'); document.body.removeChild(document.querySelector('.shape-context-menu'));"></div>
        `).join('')}
      </div>
    `;
    
    // Border width section
    const borderSection = document.createElement('div');
    borderSection.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #333;">Border Width</div>
      <div style="display: flex; gap: 4px; margin-bottom: 12px;">
        ${[1, 2, 3, 4, 5].map(width => `
          <div style="
            width: 30px;
            height: 20px;
            border: ${width}px solid #333;
            cursor: pointer;
            border-radius: 2px;
          " 
          onclick="updateShapeBorderWidth('${shape.id}', ${width}); document.body.removeChild(document.querySelector('.shape-context-menu'));"></div>
        `).join('')}
      </div>
    `;
    
    // Fill opacity section
    const fillSection = document.createElement('div');
    fillSection.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #333;">Fill Opacity</div>
      <div style="display: flex; gap: 4px; margin-bottom: 12px;">
        ${[0, 0.2, 0.4, 0.6, 0.8, 1.0].map(opacity => `
          <div style="
            width: 24px;
            height: 20px;
            background-color: rgba(0, 120, 212, ${opacity});
            border: 1px solid #ccc;
            cursor: pointer;
            border-radius: 2px;
          " 
          title="${Math.round(opacity * 100)}%"
          onclick="updateShapeFillOpacity('${shape.id}', ${opacity}); document.body.removeChild(document.querySelector('.shape-context-menu'));"></div>
        `).join('')}
      </div>
    `;
    
    // Divider
    const divider = document.createElement('div');
    divider.style.cssText = 'height: 1px; background: #eee; margin: 8px 0;';
    
    // Action items
    const actionItems = [
      { text: '↑ Bring to Front', action: () => bringShapeToFront(shape) },
      { text: '↓ Send to Back', action: () => sendShapeToBack(shape) },
      { text: '📋 Copy', action: () => copyShape(shape) },
      { text: '🗑️ Delete', action: () => deleteShape(shape) }
    ];
    
    // Append sections
    contextMenu.appendChild(colorSection);
    contextMenu.appendChild(borderSection);
    contextMenu.appendChild(fillSection);
    contextMenu.appendChild(divider);
    
    actionItems.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.textContent = item.text;
      menuItem.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        transition: background-color 0.2s;
        border-radius: 3px;
        margin: 2px 0;
      `;
      menuItem.onmouseover = () => menuItem.style.backgroundColor = '#f0f0f0';
      menuItem.onmouseout = () => menuItem.style.backgroundColor = 'transparent';
      menuItem.onclick = () => {
        item.action();
        document.body.removeChild(contextMenu);
      };
      contextMenu.appendChild(menuItem);
    });
    
    document.body.appendChild(contextMenu);
    
    // Remove menu when clicking elsewhere
    setTimeout(() => {
      document.addEventListener('click', function removeMenu() {
        if (document.body.contains(contextMenu)) {
          document.body.removeChild(contextMenu);
        }
        document.removeEventListener('click', removeMenu);
      });
    }, 100);
  };
  
  // Direct shape formatting functions
  window.updateShapeColor = (shapeId, color) => {
    const shape = document.getElementById(shapeId);
    if (shape) {
      shape.setAttribute('data-border-color', color);
      updateShapeStyle(shape, 'borderColor', color);
      handleContentChange();
    }
  };
  
  window.updateShapeBorderWidth = (shapeId, width) => {
    const shape = document.getElementById(shapeId);
    if (shape) {
      shape.setAttribute('data-border-width', width);
      updateShapeStyle(shape, 'borderWidth', width);
      handleContentChange();
    }
  };
  
  window.updateShapeFillOpacity = (shapeId, opacity) => {
    const shape = document.getElementById(shapeId);
    if (shape) {
      shape.setAttribute('data-fill-opacity', opacity);
      updateShapeStyle(shape, 'fillOpacity', opacity);
      handleContentChange();
    }
  };
  
  // Shape context menu actions
  const openShapeFormatDialog = (shape) => {
    setSelectedShapeElement(shape);
    setShapeFormatDialog(true);
  };
  
  const bringShapeToFront = (shape) => {
    shape.style.zIndex = '100';
    handleContentChange();
  };
  
  const sendShapeToBack = (shape) => {
    shape.style.zIndex = '1';
    handleContentChange();
  };
  
  const copyShape = (shape) => {
    const clone = shape.cloneNode(true);
    clone.id = `word-shape-${Date.now()}`;
    clone.style.left = (parseInt(shape.style.left) + 20) + 'px';
    clone.style.top = (parseInt(shape.style.top) + 20) + 'px';
    
    // Remove any existing handler attributes to ensure fresh setup
    clone.removeAttribute('data-word-handlers');
    
    // Update any SVG marker IDs to be unique
    const svgMarkers = clone.querySelectorAll('marker');
    svgMarkers.forEach(marker => {
      const oldId = marker.id;
      const newId = `arrowhead-${clone.id}`;
      marker.id = newId;
      
      // Update references to the marker
      const lines = clone.querySelectorAll('line[marker-end]');
      lines.forEach(line => {
        if (line.getAttribute('marker-end').includes(oldId)) {
          line.setAttribute('marker-end', `url(#${newId})`);
        }
      });
    });
    
    shape.parentNode.insertBefore(clone, shape.nextSibling);
    
    // Use setTimeout to ensure the element is fully inserted before adding handlers
    setTimeout(() => {
      addWordLikeShapeHandlers(clone);
      selectShape(clone); // Auto-select the copied shape
      handleContentChange();
    }, 50);
  };
  
  const deleteShape = (shape) => {
    clearShapeSelection();
    shape.remove();
    handleContentChange();
  };
  
  // Global table operation functions
  window.addTableRow = (tableId) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tbody = table.querySelector('tbody') || table;
    const lastRow = tbody.querySelector('tr:last-child');
    const colCount = lastRow ? lastRow.cells.length : 3;
    
    const newRow = document.createElement('tr');
    for (let i = 0; i < colCount; i++) {
      const cell = document.createElement('td');
      cell.style.cssText = `
        border: 1px solid #dee2e6;
        padding: 12px;
        text-align: left;
        min-width: 100px;
        background: white;
        color: #212529;
      `;
      cell.textContent = `New Cell ${tbody.children.length + 1}-${i + 1}`;
      newRow.appendChild(cell);
    }
    tbody.appendChild(newRow);
    handleContentChange();
  };
  
  window.removeTableRow = (tableId) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tbody = table.querySelector('tbody') || table;
    const rows = tbody.querySelectorAll('tr');
    if (rows.length > 1) {
      rows[rows.length - 1].remove();
      handleContentChange();
    }
  };
  
  window.addTableColumn = (tableId) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, index) => {
      const isHeader = index === 0;
      const cell = document.createElement(isHeader ? 'th' : 'td');
      const colIndex = row.cells.length + 1;
      
      cell.style.cssText = `
        border: 1px solid #dee2e6;
        padding: 12px;
        text-align: left;
        min-width: 100px;
        background: ${isHeader ? '#f8f9fa' : 'white'};
        font-weight: ${isHeader ? 'bold' : 'normal'};
        color: ${isHeader ? '#495057' : '#212529'};
      `;
      cell.textContent = isHeader ? `Header ${colIndex}` : `New Cell ${index}-${colIndex}`;
      row.appendChild(cell);
    });
    handleContentChange();
  };
  
  window.removeTableColumn = (tableId) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    if (rows[0]?.cells.length > 1) {
      rows.forEach(row => {
        if (row.cells.length > 0) {
          row.cells[row.cells.length - 1].remove();
        }
      });
      handleContentChange();
    }
  };
  
  window.deleteTable = (tableId) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const wrapper = table.closest('.table-wrapper');
    if (wrapper) {
      wrapper.remove();
    } else {
      table.remove();
    }
    handleContentChange();
  };

  // Initialize enhanced tables functionality
  const initializeEnhancedTables = () => {
    if (!editorRef.current) return;
    
    const wrappers = editorRef.current.querySelectorAll('.table-wrapper');
    wrappers.forEach(wrapper => {
      if (wrapper.hasAttribute('data-initialized')) return;
      wrapper.setAttribute('data-initialized', 'true');
      
      const table = wrapper.querySelector('.enhanced-table');
      const toolbar = wrapper.querySelector('.table-toolbar');
      const resizeHandles = wrapper.querySelectorAll('.resize-handle');
      const dragHandle = wrapper.querySelector('.drag-handle');
      
      if (!table || !toolbar) return;
      
      // Show/hide toolbar on hover (resize handles always visible)
      wrapper.addEventListener('mouseenter', () => {
        toolbar.style.display = 'flex';
        wrapper.style.border = '2px dashed #007bff';
      });
      
      wrapper.addEventListener('mouseleave', () => {
        toolbar.style.display = 'none';
        wrapper.style.border = '2px dashed transparent';
      });
      
      // Add resize functionality for all handles
      resizeHandles.forEach(handle => {
        addTableResizeHandler(wrapper, table, handle);
      });
      
      // Add drag functionality
      if (dragHandle) {
        addTableDragHandler(wrapper, dragHandle);
      }
    });
  };
  
  // Add table resize functionality for all handles
  const addTableResizeHandler = (wrapper, table, resizeHandle) => {
    let isResizing = false;
    let startX, startY, startWidth, startHeight, startLeft, startTop;
    
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const wrapperRect = wrapper.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      
      startWidth = wrapperRect.width;
      startHeight = wrapperRect.height;
      startLeft = wrapperRect.left - editorRect.left;
      startTop = wrapperRect.top - editorRect.top;
      
      const handleType = resizeHandle.classList[1]; // Get handle type (nw, ne, sw, se, n, s, e, w)
      
      resizeHandle.style.background = '#0056b3';
      wrapper.style.userSelect = 'none';
      
      const handleResize = (moveEvent) => {
        if (!isResizing) return;
        
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;
        
        // Handle different resize directions
        switch (handleType) {
          case 'se': // Southeast - resize width and height
            newWidth = Math.max(250, startWidth + deltaX);
            newHeight = Math.max(100, startHeight + deltaY);
            break;
          case 'nw': // Northwest - resize and move
            newWidth = Math.max(250, startWidth - deltaX);
            newHeight = Math.max(100, startHeight - deltaY);
            newLeft = startLeft + deltaX;
            newTop = startTop + deltaY;
            break;
          case 'ne': // Northeast
            newWidth = Math.max(250, startWidth + deltaX);
            newHeight = Math.max(100, startHeight - deltaY);
            newTop = startTop + deltaY;
            break;
          case 'sw': // Southwest
            newWidth = Math.max(250, startWidth - deltaX);
            newHeight = Math.max(100, startHeight + deltaY);
            newLeft = startLeft + deltaX;
            break;
          case 'n': // North - resize height only
            newHeight = Math.max(100, startHeight - deltaY);
            newTop = startTop + deltaY;
            break;
          case 's': // South - resize height only
            newHeight = Math.max(100, startHeight + deltaY);
            break;
          case 'e': // East - resize width only
            newWidth = Math.max(250, startWidth + deltaX);
            break;
          case 'w': // West - resize width only
            newWidth = Math.max(250, startWidth - deltaX);
            newLeft = startLeft + deltaX;
            break;
        }
        
        wrapper.style.width = newWidth + 'px';
        if (newHeight !== startHeight) {
          wrapper.style.height = newHeight + 'px';
        }
        if (newLeft !== startLeft) {
          wrapper.style.left = newLeft + 'px';
        }
        if (newTop !== startTop) {
          wrapper.style.top = newTop + 'px';
        }
        table.style.width = '100%';
      };
      
      const stopResize = () => {
        if (isResizing) {
          isResizing = false;
          resizeHandle.style.background = '#007bff';
          wrapper.style.userSelect = 'auto';
          document.removeEventListener('mousemove', handleResize);
          document.removeEventListener('mouseup', stopResize);
          handleContentChange();
        }
      };
      
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
      
      e.preventDefault();
      e.stopPropagation();
    });
  };
  
  // Add table drag functionality
  const addTableDragHandler = (wrapper, dragHandle) => {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // Get current position relative to the editor
      const editorRect = editorRef.current.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      
      startLeft = wrapperRect.left - editorRect.left;
      startTop = wrapperRect.top - editorRect.top;
      
      dragHandle.style.background = '#1e7e34';
      wrapper.style.userSelect = 'none';
      wrapper.style.zIndex = '1000';
      
      const handleDrag = (moveEvent) => {
        if (!isDragging) return;
        
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        
        const newLeft = Math.max(0, startLeft + deltaX);
        const newTop = Math.max(0, startTop + deltaY);
        
        wrapper.style.left = newLeft + 'px';
        wrapper.style.top = newTop + 'px';
      };
      
      const stopDrag = () => {
        if (isDragging) {
          isDragging = false;
          dragHandle.style.background = '#28a745';
          wrapper.style.userSelect = 'auto';
          wrapper.style.zIndex = 'auto';
          document.removeEventListener('mousemove', handleDrag);
          document.removeEventListener('mouseup', stopDrag);
          handleContentChange();
        }
      };
      
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', stopDrag);
      
      e.preventDefault();
      e.stopPropagation();
    });
  };

  // Add shape drag listeners (legacy support) and reinitialize all shapes
  const addShapeDragListeners = () => {
    const shapes = editorRef.current.querySelectorAll('.word-like-shape');
    shapes.forEach(shape => {
      if (!shape.hasAttribute('data-word-handlers')) {
        addWordLikeShapeHandlers(shape);
      }
    });
  };
  
  // Reinitialize all shapes - useful after content changes or copying
  const reinitializeAllShapes = () => {
    if (!editorRef.current) return;
    
    const shapes = editorRef.current.querySelectorAll('.word-like-shape');
    shapes.forEach(shape => {
      // Force re-initialization by removing the handler attribute
      shape.removeAttribute('data-word-handlers');
      addWordLikeShapeHandlers(shape);
    });
  };
  
  // Click outside to deselect shapes
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.word-like-shape') && !e.target.closest('.shape-handle')) {
        clearShapeSelection();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Undo/Redo functions
  const performUndo = () => {
    if (undoStack.length > 0) {
      const currentContent = editorRef.current.innerHTML;
      const previousContent = undoStack[undoStack.length - 1];
      
      setRedoStack(prev => [...prev, currentContent]);
      setUndoStack(prev => prev.slice(0, -1));
      
      editorRef.current.innerHTML = previousContent;
      handleContentChange(false); // Don't save to history
    }
  };

  const performRedo = () => {
    if (redoStack.length > 0) {
      const currentContent = editorRef.current.innerHTML;
      const nextContent = redoStack[redoStack.length - 1];
      
      setUndoStack(prev => [...prev, currentContent]);
      setRedoStack(prev => prev.slice(0, -1));
      
      editorRef.current.innerHTML = nextContent;
      handleContentChange(false); // Don't save to history
    }
  };

  // Enhanced table functions with visual controls
  const insertAdvancedTable = () => {
    const tableId = `table-${Date.now()}`;
    const tableHTML = `
      <div class="table-container" style="position: relative; margin: 20px 0; border: 2px solid transparent;">
        <div class="table-controls" style="position: absolute; top: -25px; right: 0; display: flex; gap: 5px; background: white; padding: 2px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <button onclick="copyTable('${tableId}')" style="border: none; background: #2196F3; color: white; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">Copy</button>
          <button onclick="deleteTable('${tableId}')" style="border: none; background: #f44336; color: white; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">Delete</button>
        </div>
        <table id="${tableId}" border="1" style="border-collapse: collapse; width: 100%; position: relative;" class="enhanced-table">
          <thead>
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; position: relative;">
                Header 1
                <div class="col-controls" style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); display: none; background: white; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                  <button onclick="insertColumnBefore(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
                  <button onclick="deleteColumn(this)" style="border: none; background: #f44336; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">-</button>
                  <button onclick="insertColumnAfter(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
                </div>
              </th>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; position: relative;">
                Header 2
                <div class="col-controls" style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); display: none; background: white; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                  <button onclick="insertColumnBefore(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
                  <button onclick="deleteColumn(this)" style="border: none; background: #f44336; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">-</button>
                  <button onclick="insertColumnAfter(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
                </div>
              </th>
              <th style="padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; position: relative;">
                Header 3
                <div class="col-controls" style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); display: none; background: white; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                  <button onclick="insertColumnBefore(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
                  <button onclick="deleteColumn(this)" style="border: none; background: #f44336; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">-</button>
                  <button onclick="insertColumnAfter(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; position: relative;">
                Cell 1
                <div class="row-controls" style="position: absolute; left: -25px; top: 50%; transform: translateY(-50%); display: none; flex-direction: column; background: white; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                  <button onclick="insertRowBefore(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
                  <button onclick="deleteRow(this)" style="border: none; background: #f44336; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">-</button>
                  <button onclick="insertRowAfter(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
                </div>
              </td>
              <td style="padding: 8px; border: 1px solid #ddd;">Cell 2</td>
              <td style="padding: 8px; border: 1px solid #ddd;">Cell 3</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; position: relative;">
                Cell 4
                <div class="row-controls" style="position: absolute; left: -25px; top: 50%; transform: translateY(-50%); display: none; flex-direction: column; background: white; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                  <button onclick="insertRowBefore(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
                  <button onclick="deleteRow(this)" style="border: none; background: #f44336; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">-</button>
                  <button onclick="insertRowAfter(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
                </div>
              </td>
              <td style="padding: 8px; border: 1px solid #ddd;">Cell 5</td>
              <td style="padding: 8px; border: 1px solid #ddd;">Cell 6</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    executeCommand('insertHTML', tableHTML);
    addEnhancedTableEventListeners();
  };

  const addTableEventListeners = () => {
    setTimeout(() => {
      const tables = editorRef.current.querySelectorAll('table.editable-table');
      tables.forEach(table => {
        if (!table.hasAttribute('data-listeners-added')) {
          table.setAttribute('data-listeners-added', 'true');
          
          // Add context menu for table operations
          table.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showTableContextMenu(e, table);
          });
        }
      });
    }, 100);
  };

  const showTableContextMenu = (event, table) => {
    const contextMenu = document.createElement('div');
    contextMenu.style.cssText = `
      position: fixed;
      top: ${event.clientY}px;
      left: ${event.clientX}px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 1000;
      font-size: 14px;
    `;
    
    const menuItems = [
      { text: 'Insert Row Above', action: () => insertTableRow(table, 'above') },
      { text: 'Insert Row Below', action: () => insertTableRow(table, 'below') },
      { text: 'Insert Column Left', action: () => insertTableColumn(table, 'left') },
      { text: 'Insert Column Right', action: () => insertTableColumn(table, 'right') },
      { text: 'Delete Row', action: () => deleteTableRow(table) },
      { text: 'Delete Column', action: () => deleteTableColumn(table) },
      { text: 'Delete Table', action: () => deleteTable(table) }
    ];
    
    menuItems.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.textContent = item.text;
      menuItem.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        hover: background-color: #f0f0f0;
      `;
      menuItem.onmouseover = () => menuItem.style.backgroundColor = '#f0f0f0';
      menuItem.onmouseout = () => menuItem.style.backgroundColor = 'transparent';
      menuItem.onclick = () => {
        item.action();
        document.body.removeChild(contextMenu);
        handleContentChange();
      };
      contextMenu.appendChild(menuItem);
    });
    
    document.body.appendChild(contextMenu);
    
    // Remove menu when clicking elsewhere
    setTimeout(() => {
      document.addEventListener('click', function removeMenu() {
        if (document.body.contains(contextMenu)) {
          document.body.removeChild(contextMenu);
        }
        document.removeEventListener('click', removeMenu);
      });
    }, 100);
  };

  const insertTableRow = (table, position) => {
    const tbody = table.querySelector('tbody') || table;
    const rows = tbody.querySelectorAll('tr');
    const colCount = rows[0]?.cells.length || 3;
    
    const newRow = document.createElement('tr');
    for (let i = 0; i < colCount; i++) {
      const cell = document.createElement('td');
      cell.style.cssText = 'padding: 8px; border: 1px solid #ddd;';
      cell.textContent = 'New Cell';
      newRow.appendChild(cell);
    }
    
    if (position === 'above' && rows.length > 0) {
      tbody.insertBefore(newRow, rows[0]);
    } else {
      tbody.appendChild(newRow);
    }
  };

  const insertTableColumn = (table, position) => {
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, index) => {
      const cell = document.createElement(index === 0 ? 'th' : 'td');
      cell.style.cssText = index === 0 
        ? 'padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5;'
        : 'padding: 8px; border: 1px solid #ddd;';
      cell.textContent = index === 0 ? 'New Header' : 'New Cell';
      
      if (position === 'left' && row.cells.length > 0) {
        row.insertBefore(cell, row.cells[0]);
      } else {
        row.appendChild(cell);
      }
    });
  };

  const deleteTableRow = (table) => {
    const tbody = table.querySelector('tbody') || table;
    const rows = tbody.querySelectorAll('tr');
    if (rows.length > 1) {
      rows[rows.length - 1].remove();
    }
  };

  const deleteTableColumn = (table) => {
    const rows = table.querySelectorAll('tr');
    if (rows[0]?.cells.length > 1) {
      rows.forEach(row => {
        if (row.cells.length > 0) {
          row.cells[row.cells.length - 1].remove();
        }
      });
    }
  };

  const deleteTable = (table) => {
    table.remove();
  };

  // Enhanced table event listeners with visual controls and drag/resize
  const addEnhancedTableEventListeners = () => {
    setTimeout(() => {
      const tables = editorRef.current.querySelectorAll('table.enhanced-table');
      tables.forEach(table => {
        if (!table.hasAttribute('data-enhanced-listeners')) {
          table.setAttribute('data-enhanced-listeners', 'true');
          
          // Show/hide controls on hover
          const container = table.closest('.table-container');
          
          // Make table draggable and resizable
          // makeDraggableAndResizable(container, table);
          
          container.addEventListener('mouseenter', () => {
            // Show table controls
            const tableControls = container.querySelector('.table-controls');
            if (tableControls) tableControls.style.display = 'flex';
            
            // Show column controls
            const colControls = table.querySelectorAll('.col-controls');
            colControls.forEach(control => control.style.display = 'flex');
            
            // Show row controls
            const rowControls = table.querySelectorAll('.row-controls');
            rowControls.forEach(control => control.style.display = 'flex');
          });
          
          container.addEventListener('mouseleave', () => {
            // Hide table controls
            const tableControls = container.querySelector('.table-controls');
            if (tableControls) tableControls.style.display = 'none';
            
            // Hide column controls
            const colControls = table.querySelectorAll('.col-controls');
            colControls.forEach(control => control.style.display = 'none');
            
            // Hide row controls
            const rowControls = table.querySelectorAll('.row-controls');
            rowControls.forEach(control => control.style.display = 'none');
          });
        }
      });
      
      // Make table draggable and resizable function
      window.makeDraggableAndResizable = (container, table) => {
        if (container.hasAttribute('data-drag-resize-added')) return;
        container.setAttribute('data-drag-resize-added', 'true');
        
        let isDragging = false;
        let isResizing = false;
        let startX, startY, initialX, initialY, initialWidth, initialHeight;
        
        // Add drag handle to container
        const dragHandle = document.createElement('div');
        dragHandle.style.cssText = `
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 10px;
          background: #1976d2;
          cursor: move;
          border-radius: 5px;
          display: none;
          z-index: 1001;
        `;
        dragHandle.className = 'table-drag-handle';
        container.appendChild(dragHandle);
        
        // Add resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.style.cssText = `
          position: absolute;
          bottom: -5px;
          right: -5px;
          width: 15px;
          height: 15px;
          background: #1976d2;
          cursor: se-resize;
          border-radius: 2px;
          display: none;
          z-index: 1001;
        `;
        resizeHandle.className = 'table-resize-handle';
        container.appendChild(resizeHandle);
        
        // Show/hide handles on hover
        container.addEventListener('mouseenter', () => {
          dragHandle.style.display = 'block';
          resizeHandle.style.display = 'block';
        });
        
        container.addEventListener('mouseleave', () => {
          if (!isDragging && !isResizing) {
            dragHandle.style.display = 'none';
            resizeHandle.style.display = 'none';
          }
        });
        
        // Drag functionality
        dragHandle.addEventListener('mousedown', (e) => {
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          
          const rect = container.getBoundingClientRect();
          initialX = rect.left;
          initialY = rect.top;
          
          container.style.position = 'relative';
          container.style.zIndex = '1000';
          e.preventDefault();
        });
        
        // Resize functionality
        resizeHandle.addEventListener('mousedown', (e) => {
          isResizing = true;
          startX = e.clientX;
          startY = e.clientY;
          
          const rect = table.getBoundingClientRect();
          initialWidth = rect.width;
          initialHeight = rect.height;
          
          e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
          if (isDragging) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            container.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
          } else if (isResizing) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newWidth = Math.max(200, initialWidth + deltaX);
            const newHeight = Math.max(100, initialHeight + deltaY);
            
            table.style.width = newWidth + 'px';
            table.style.height = newHeight + 'px';
          }
        });
        
        document.addEventListener('mouseup', () => {
          if (isDragging || isResizing) {
            isDragging = false;
            isResizing = false;
            container.style.zIndex = 'auto';
            dragHandle.style.display = 'none';
            resizeHandle.style.display = 'none';
            handleContentChange();
          }
        });
      };
      
      // Add global functions to window for onclick handlers
      window.copyTable = (tableId) => {
        const table = document.getElementById(tableId);
        if (table) {
          const tableHTML = table.outerHTML;
          navigator.clipboard.writeText(tableHTML).then(() => {
            console.log('Table copied to clipboard');
          });
        }
      };
      
      window.deleteTable = (tableId) => {
        const container = document.getElementById(tableId)?.closest('.table-container');
        if (container) {
          container.remove();
          handleContentChange();
        }
      };
      
      window.insertRowBefore = (button) => {
        const row = button.closest('tr');
        const table = button.closest('table');
        const colCount = row.cells.length;
        const newRow = document.createElement('tr');
        
        for (let i = 0; i < colCount; i++) {
          const cell = document.createElement('td');
          cell.style.cssText = 'padding: 8px; border: 1px solid #ddd; position: relative;';
          cell.innerHTML = i === 0 ? `New Cell<div class="row-controls" style="position: absolute; left: -25px; top: 50%; transform: translateY(-50%); display: none; flex-direction: column; background: white; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <button onclick="insertRowBefore(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
            <button onclick="deleteRow(this)" style="border: none; background: #f44336; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">-</button>
            <button onclick="insertRowAfter(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
          </div>` : 'New Cell';
          newRow.appendChild(cell);
        }
        
        row.parentNode.insertBefore(newRow, row);
        handleContentChange();
      };
      
      window.insertRowAfter = (button) => {
        const row = button.closest('tr');
        const table = button.closest('table');
        const colCount = row.cells.length;
        const newRow = document.createElement('tr');
        
        for (let i = 0; i < colCount; i++) {
          const cell = document.createElement('td');
          cell.style.cssText = 'padding: 8px; border: 1px solid #ddd; position: relative;';
          cell.innerHTML = i === 0 ? `New Cell<div class="row-controls" style="position: absolute; left: -25px; top: 50%; transform: translateY(-50%); display: none; flex-direction: column; background: white; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <button onclick="insertRowBefore(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
            <button onclick="deleteRow(this)" style="border: none; background: #f44336; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">-</button>
            <button onclick="insertRowAfter(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
          </div>` : 'New Cell';
          newRow.appendChild(cell);
        }
        
        if (row.nextSibling) {
          row.parentNode.insertBefore(newRow, row.nextSibling);
        } else {
          row.parentNode.appendChild(newRow);
        }
        handleContentChange();
      };
      
      window.deleteRow = (button) => {
        const row = button.closest('tr');
        const tbody = row.closest('tbody');
        if (tbody && tbody.querySelectorAll('tr').length > 1) {
          row.remove();
          handleContentChange();
        }
      };
      
      window.insertColumnBefore = (button) => {
        const th = button.closest('th');
        const table = button.closest('table');
        const colIndex = Array.from(th.parentNode.children).indexOf(th);
        
        // Insert header
        const newTh = document.createElement('th');
        newTh.style.cssText = 'padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; position: relative;';
        newTh.innerHTML = `New Header<div class="col-controls" style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); display: none; background: white; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
          <button onclick="insertColumnBefore(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
          <button onclick="deleteColumn(this)" style="border: none; background: #f44336; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">-</button>
          <button onclick="insertColumnAfter(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
        </div>`;
        th.parentNode.insertBefore(newTh, th);
        
        // Insert cells in body rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, rowIndex) => {
          const newTd = document.createElement('td');
          newTd.style.cssText = 'padding: 8px; border: 1px solid #ddd; position: relative;';
          newTd.innerHTML = rowIndex === 0 ? `New Cell<div class="row-controls" style="position: absolute; left: -25px; top: 50%; transform: translateY(-50%); display: none; flex-direction: column; background: white; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <button onclick="insertRowBefore(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
            <button onclick="deleteRow(this)" style="border: none; background: #f44336; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">-</button>
            <button onclick="insertRowAfter(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
          </div>` : 'New Cell';
          row.insertBefore(newTd, row.children[colIndex]);
        });
        handleContentChange();
      };
      
      window.insertColumnAfter = (button) => {
        const th = button.closest('th');
        const table = button.closest('table');
        const colIndex = Array.from(th.parentNode.children).indexOf(th);
        
        // Insert header
        const newTh = document.createElement('th');
        newTh.style.cssText = 'padding: 8px; border: 1px solid #ddd; background-color: #f5f5f5; position: relative;';
        newTh.innerHTML = `New Header<div class="col-controls" style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); display: none; background: white; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
          <button onclick="insertColumnBefore(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
          <button onclick="deleteColumn(this)" style="border: none; background: #f44336; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">-</button>
          <button onclick="insertColumnAfter(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
        </div>`;
        
        if (th.nextSibling) {
          th.parentNode.insertBefore(newTh, th.nextSibling);
        } else {
          th.parentNode.appendChild(newTh);
        }
        
        // Insert cells in body rows
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, rowIndex) => {
          const newTd = document.createElement('td');
          newTd.style.cssText = 'padding: 8px; border: 1px solid #ddd; position: relative;';
          newTd.innerHTML = rowIndex === 0 ? `New Cell<div class="row-controls" style="position: absolute; left: -25px; top: 50%; transform: translateY(-50%); display: none; flex-direction: column; background: white; border-radius: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
            <button onclick="insertRowBefore(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
            <button onclick="deleteRow(this)" style="border: none; background: #f44336; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">-</button>
            <button onclick="insertRowAfter(this)" style="border: none; background: #4CAF50; color: white; padding: 2px 4px; font-size: 10px; cursor: pointer;">+</button>
          </div>` : 'New Cell';
          
          if (row.children[colIndex + 1]) {
            row.insertBefore(newTd, row.children[colIndex + 1]);
          } else {
            row.appendChild(newTd);
          }
        });
        handleContentChange();
      };
      
      window.deleteColumn = (button) => {
        const th = button.closest('th');
        const table = button.closest('table');
        const colIndex = Array.from(th.parentNode.children).indexOf(th);
        
        if (th.parentNode.children.length > 1) {
          // Remove header
          th.remove();
          
          // Remove cells from body rows
          const rows = table.querySelectorAll('tbody tr');
          rows.forEach(row => {
            if (row.children[colIndex]) {
              row.children[colIndex].remove();
            }
          });
          handleContentChange();
        }
      };
      
    }, 100);
  };

  const insertPageBreak = () => {
    executeCommand('insertHTML', '<div style="page-break-before: always;"></div>');
  };

  const printDocument = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Print Document</title></head>
        <body>${editorRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const saveDocument = () => {
    const blob = new Blob([editorRef.current.innerHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (readOnly) {
    return (
      <Box 
        sx={{ 
          height: '100%', 
          overflow: 'auto', 
          p: 2,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'background.paper'
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Toolbar 
        variant="dense" 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          minHeight: '48px !important',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        {/* Font Family */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={fontFamily}
            onChange={(e) => {
              setFontFamily(e.target.value);
              executeCommand('fontName', e.target.value);
            }}
          >
            <MenuItem value="Arial">Arial</MenuItem>
            <MenuItem value="Times New Roman">Times New Roman</MenuItem>
            <MenuItem value="Courier New">Courier New</MenuItem>
            <MenuItem value="Helvetica">Helvetica</MenuItem>
            <MenuItem value="Georgia">Georgia</MenuItem>
          </Select>
        </FormControl>

        {/* Font Size */}
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              executeCommand('fontSize', e.target.value);
            }}
          >
            {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36].map(size => (
              <MenuItem key={size} value={size}>{size}px</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider orientation="vertical" flexItem />

        {/* Format Buttons */}
        <ToggleButtonGroup
          value={selectedFormat}
          onChange={handleFormatChange}
          size="small"
        >
          <ToggleButton value="bold" onClick={() => executeCommand('bold')}>
            <FormatBold />
          </ToggleButton>
          <ToggleButton value="italic" onClick={() => executeCommand('italic')}>
            <FormatItalic />
          </ToggleButton>
          <ToggleButton value="underline" onClick={() => executeCommand('underline')}>
            <FormatUnderlined />
          </ToggleButton>
          <ToggleButton value="strikethrough" onClick={toggleStrikethrough}>
            <FormatStrikethrough />
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Subscript/Superscript */}
        <ToggleButtonGroup size="small">
          <ToggleButton value="subscript" onClick={insertSubscript}>
            <Subscript />
          </ToggleButton>
          <ToggleButton value="superscript" onClick={insertSuperscript}>
            <Superscript />
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Alignment */}
        <ToggleButtonGroup size="small">
          <ToggleButton value="left" onClick={() => executeCommand('justifyLeft')}>
            <FormatAlignLeft />
          </ToggleButton>
          <ToggleButton value="center" onClick={() => executeCommand('justifyCenter')}>
            <FormatAlignCenter />
          </ToggleButton>
          <ToggleButton value="right" onClick={() => executeCommand('justifyRight')}>
            <FormatAlignRight />
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Lists */}
        <Tooltip title="Bullet List">
          <IconButton size="small" onClick={() => executeCommand('insertUnorderedList')}>
            <FormatListBulleted />
          </IconButton>
        </Tooltip>
        <Tooltip title="Numbered List">
          <IconButton size="small" onClick={() => executeCommand('insertOrderedList')}>
            <FormatListNumbered />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Insert */}
        <Tooltip title="Insert Link">
          <IconButton size="small" onClick={insertLink}>
            <Link />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Image">
          <IconButton size="small" onClick={insertImage}>
            <Image />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Colors & Formatting */}
        <Tooltip title="Text Color">
          <IconButton 
            size="small" 
            onClick={(e) => {
              // Save current selection before opening color picker
              const selection = window.getSelection();
              if (selection.rangeCount > 0) {
                setSavedSelection({
                  range: selection.getRangeAt(0).cloneRange(),
                  text: selection.toString()
                });
              }
              setShowColorPicker(e.currentTarget);
            }}
          >
            <FormatColorText />
          </IconButton>
        </Tooltip>
        <Tooltip title="Highlight Color">
          <IconButton 
            size="small" 
            onClick={(e) => {
              // Save current selection before opening color picker
              const selection = window.getSelection();
              if (selection.rangeCount > 0) {
                setSavedSelection({
                  range: selection.getRangeAt(0).cloneRange(),
                  text: selection.toString()
                });
              }
              setShowHighlightPicker(e.currentTarget);
            }}
          >
            <FormatColorFill />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Indentation */}
        <Tooltip title="Increase Indent">
          <IconButton size="small" onClick={() => executeCommand('indent')}>
            <FormatIndentIncrease />
          </IconButton>
        </Tooltip>
        <Tooltip title="Decrease Indent">
          <IconButton size="small" onClick={() => executeCommand('outdent')}>
            <FormatIndentDecrease />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Document Structure */}
        <Tooltip title="Heading 1">
          <IconButton size="small" onClick={() => insertHeading(1)}>
            <Title />
          </IconButton>
        </Tooltip>
        <Tooltip title="Quote">
          <IconButton size="small" onClick={insertQuote}>
            <FormatQuote />
          </IconButton>
        </Tooltip>
        <Tooltip title="Code Block">
          <IconButton size="small" onClick={insertCodeBlock}>
            <Code />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Advanced Features */}
        <Tooltip title="Insert Advanced Table">
          <IconButton size="small" onClick={insertAdvancedTable}>
            <TableChart />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Rectangle">
          <IconButton size="small" onClick={() => insertWordLikeShape('rectangle')}>
            <Rectangle />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Circle">
          <IconButton size="small" onClick={() => insertWordLikeShape('circle')}>
            <Circle />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Arrow">
          <IconButton size="small" onClick={() => insertWordLikeShape('arrow')}>
            <TrendingFlat />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Line">
          <IconButton size="small" onClick={() => insertWordLikeShape('line')}>
            <Timeline />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Triangle">
          <IconButton size="small" onClick={() => insertWordLikeShape('triangle')}>
            <ChangeHistory />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Star">
          <IconButton size="small" onClick={() => insertWordLikeShape('star')}>
            <Star />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Hexagon">
          <IconButton size="small" onClick={() => insertWordLikeShape('hexagon')}>
            <Hexagon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Horizontal Line">
          <IconButton size="small" onClick={insertHorizontalRule}>
            <HorizontalRule />
          </IconButton>
        </Tooltip>
        <Tooltip title="Page Break">
          <IconButton size="small" onClick={insertPageBreak}>
            <HorizontalRule />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear Formatting">
          <IconButton size="small" onClick={clearFormatting}>
            <FormatClear />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Tools */}
        <Tooltip title="Find (Ctrl+F)">
          <IconButton size="small" onClick={findAndReplace}>
            <FindReplace />
          </IconButton>
        </Tooltip>
        <Tooltip title="Print">
          <IconButton size="small" onClick={printDocument}>
            <Print />
          </IconButton>
        </Tooltip>
        <Tooltip title="Save as HTML">
          <IconButton size="small" onClick={saveDocument}>
            <Save />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Undo/Redo */}
        <Tooltip title="Undo">
          <IconButton size="small" onClick={performUndo} disabled={undoStack.length === 0}>
            <Undo />
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo">
          <IconButton size="small" onClick={performRedo} disabled={redoStack.length === 0}>
            <Redo />
          </IconButton>
        </Tooltip>
      </Toolbar>

      {/* Editor */}
      <Box
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onBlur={handleContentChange}
        sx={{
          flex: 1,
          p: 2,
          border: 1,
          borderColor: 'divider',
          borderTop: 0,
          outline: 'none',
          overflow: 'auto',
          position: 'relative',
          '& a': {
            color: 'primary.main',
            textDecoration: 'underline'
          },
          '& .word-like-shape': {
            border: '1px dashed transparent',
            userSelect: 'none',
            '&:hover': {
              border: '1px dashed #ccc'
            },
            '&:active': {
              cursor: 'grabbing !important'
            },
            '& .shape-text': {
              '&:focus': {
                outline: '2px solid #0078d4 !important',
                outlineOffset: '2px'
              },
              '&:empty::before': {
                content: 'attr(placeholder)',
                color: '#999',
                fontStyle: 'italic'
              }
            }
          },
          '& .selected-shape': {
            border: '2px solid #0078d4 !important',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              border: '1px solid #0078d4',
              pointerEvents: 'none'
            }
          },
          '& .shape-handle': {
            pointerEvents: 'auto !important',
            transition: 'all 0.2s ease',
            '&:hover': {
              background: '#0078d4 !important',
              transform: 'scale(1.2)',
              boxShadow: '0 2px 6px rgba(0,120,212,0.4)'
            }
          }
        }}
        suppressContentEditableWarning={true}
      />

      {/* Color Picker Popover */}
      <Popover
        open={Boolean(showColorPicker)}
        anchorEl={showColorPicker}
        onClose={() => setShowColorPicker(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, width: 240 }}>
          <Typography variant="subtitle2" gutterBottom>
            Text Color
          </Typography>
          <Grid container spacing={1}>
            {colors.map((color) => (
              <Grid item xs={3} key={color}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: color,
                    border: '2px solid #ddd',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      border: '2px solid #1976d2'
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    changeTextColor(color);
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Popover>

      {/* Highlight Color Picker Popover */}
      <Popover
        open={Boolean(showHighlightPicker)}
        anchorEl={showHighlightPicker}
        onClose={() => setShowHighlightPicker(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, width: 240 }}>
          <Typography variant="subtitle2" gutterBottom>
            Highlight Color
          </Typography>
          <Grid container spacing={1}>
            {colors.map((color) => (
              <Grid item xs={3} key={color}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: color,
                    border: '2px solid #ddd',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      border: '2px solid #1976d2'
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    changeBackgroundColor(color);
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Popover>

      {/* Image Editor Dialog */}
      <Dialog
        open={showImageEditor}
        onClose={() => setShowImageEditor(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Image Editor
        </DialogTitle>
        <DialogContent>
              {selectedImage && (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <img
                  src={selectedImage}
                  alt="Selected"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '400px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: isDraggingCrop ? 'crosshair' : 'default'
                  }}
                  onMouseDown={handleCropMouseDown}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                />
                {/* Enhanced Custom Crop Controls with Drag */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: `${cropData.y}%`, 
                  left: `${cropData.x}%`,
                  width: `${cropData.width}%`,
                  height: `${cropData.height}%`,
                  border: '2px dashed #1976d2',
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  pointerEvents: 'none',
                  '&::before': {
                    content: '"Drag to crop"',
                    position: 'absolute',
                    top: '-25px',
                    left: '0',
                    fontSize: '12px',
                    color: '#1976d2',
                    fontWeight: 'bold'
                  }
                }} />
                {/* Crop instruction overlay */}
                {!isDraggingCrop && cropData.width === 100 && cropData.height === 100 && (
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    pointerEvents: 'none'
                  }}>
                    Click and drag to select crop area
                  </Box>
                )}
              </Box>
              
              {/* Crop Controls */}
              <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Custom Crop Area</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption">X Position: {cropData.x}%</Typography>
                    <Slider
                      value={cropData.x}
                      onChange={(e, value) => setCropData(prev => ({ ...prev, x: value }))}
                      min={0}
                      max={100 - cropData.width}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption">Y Position: {cropData.y}%</Typography>
                    <Slider
                      value={cropData.y}
                      onChange={(e, value) => setCropData(prev => ({ ...prev, y: value }))}
                      min={0}
                      max={100 - cropData.height}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption">Width: {cropData.width}%</Typography>
                    <Slider
                      value={cropData.width}
                      onChange={(e, value) => setCropData(prev => ({ ...prev, width: value }))}
                      min={10}
                      max={100 - cropData.x}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption">Height: {cropData.height}%</Typography>
                    <Slider
                      value={cropData.height}
                      onChange={(e, value) => setCropData(prev => ({ ...prev, height: value }))}
                      min={10}
                      max={100 - cropData.y}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    // Rotate 90 degrees
                    const img = document.createElement('img');
                    img.onload = () => {
                      const rotatedSrc = rotateImage(img, 90);
                      setSelectedImage(rotatedSrc);
                    };
                    img.src = selectedImage;
                  }}
                >
                  Rotate 90°
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    // Resize to 50%
                    const img = document.createElement('img');
                    img.onload = () => {
                      const resizedSrc = resizeImage(img, img.width * 0.5, img.height * 0.5);
                      setSelectedImage(resizedSrc);
                    };
                    img.src = selectedImage;
                  }}
                >
                  Resize 50%
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    // Custom crop using slider values
                    const img = document.createElement('img');
                    img.onload = () => {
                      const actualCropData = {
                        x: (img.width * cropData.x) / 100,
                        y: (img.height * cropData.y) / 100,
                        width: (img.width * cropData.width) / 100,
                        height: (img.height * cropData.height) / 100
                      };
                      const croppedSrc = cropImage(img, actualCropData);
                      setSelectedImage(croppedSrc);
                    };
                    img.src = selectedImage;
                  }}
                >
                  Apply Custom Crop
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImageEditor(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              executeCommand('insertImage', selectedImage);
              setShowImageEditor(false);
              setSelectedImage(null);
            }}
          >
            Insert Image
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

// Helper function to update shape styles
const updateShapeStyle = (shapeElement, property, value) => {
  const shapeContent = shapeElement.querySelector('.shape-content');
  if (!shapeContent) return;
  
  switch (property) {
    case 'borderColor':
      if (shapeContent.tagName === 'DIV') {
        shapeContent.style.borderColor = value;
        // Update fill color with current opacity
        const currentOpacity = parseFloat(shapeElement.getAttribute('data-fill-opacity') || 0.2);
        const opacity = Math.round(currentOpacity * 255).toString(16).padStart(2, '0');
        shapeContent.style.backgroundColor = value + opacity;
      } else if (shapeContent.tagName === 'svg') {
        const lines = shapeContent.querySelectorAll('line');
        const polygons = shapeContent.querySelectorAll('polygon');
        lines.forEach(line => line.setAttribute('stroke', value));
        polygons.forEach(polygon => polygon.setAttribute('fill', value));
      }
      break;
    case 'borderWidth':
      if (shapeContent.tagName === 'DIV') {
        shapeContent.style.borderWidth = value + 'px';
      } else if (shapeContent.tagName === 'svg') {
        const lines = shapeContent.querySelectorAll('line');
        lines.forEach(line => line.setAttribute('stroke-width', value));
      }
      break;
    case 'fillOpacity':
      if (shapeContent.tagName === 'DIV') {
        const currentColor = shapeElement.getAttribute('data-border-color') || '#0078d4';
        const opacity = Math.round(value * 255).toString(16).padStart(2, '0');
        shapeContent.style.backgroundColor = currentColor + opacity;
      }
      break;
  }
};

export default DocumentEditor;
