import React, { useState } from 'react';
import {
  Box,
  TextField,
  Toolbar,
  Button,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Visibility as PreviewIcon,
  Edit as EditIcon,
  ViewColumn as SplitIcon,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  Link,
  Image,
  Code,
  FormatQuote
} from '@mui/icons-material';

const MarkdownEditor = ({ content, onChange, readOnly = false }) => {
  const [viewMode, setViewMode] = useState('edit');

  const insertMarkdown = (syntax) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newText = '';
    let cursorOffset = 0;

    switch (syntax) {
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? 0 : -11;
        break;
      case 'italic':
        newText = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? 0 : -12;
        break;
      case 'code':
        newText = `\`${selectedText || 'code'}\``;
        cursorOffset = selectedText ? 0 : -6;
        break;
      case 'quote':
        newText = `> ${selectedText || 'quote'}`;
        cursorOffset = selectedText ? 0 : -7;
        break;
      case 'link':
        newText = `[${selectedText || 'link text'}](url)`;
        cursorOffset = selectedText ? -5 : -15;
        break;
      case 'image':
        newText = `![${selectedText || 'alt text'}](image-url)`;
        cursorOffset = selectedText ? -12 : -23;
        break;
      case 'ul':
        newText = `- ${selectedText || 'list item'}`;
        cursorOffset = selectedText ? 0 : -11;
        break;
      case 'ol':
        newText = `1. ${selectedText || 'list item'}`;
        cursorOffset = selectedText ? 0 : -11;
        break;
      case 'h1':
        newText = `# ${selectedText || 'Heading 1'}`;
        cursorOffset = selectedText ? 0 : -11;
        break;
      case 'h2':
        newText = `## ${selectedText || 'Heading 2'}`;
        cursorOffset = selectedText ? 0 : -11;
        break;
      case 'h3':
        newText = `### ${selectedText || 'Heading 3'}`;
        cursorOffset = selectedText ? 0 : -11;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    onChange(newContent);

    // Set cursor position after insertion
    setTimeout(() => {
      const newPosition = start + newText.length + cursorOffset;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  const insertTemplate = (template) => {
    const templates = {
      document: '# Document Title\n\n## Introduction\n\nThis is a sample markdown document.\n\n## Features\n\n- **Bold text**\n- *Italic text*\n- `Code snippets`\n- [Links](https://example.com)\n\n### Code Block\n\n```javascript\nfunction example() {\n    return "Hello, Markdown!";\n}\n```\n\n## Conclusion\n\nMarkdown makes formatting easy!',
      readme: '# Project Name\n\n## Description\n\nA brief description of your project.\n\n## Installation\n\n```bash\nnpm install\n```\n\n## Usage\n\n```javascript\nconst example = require(\'./example\');\nexample.run();\n```\n\n## Contributing\n\n1. Fork the repository\n2. Create a feature branch\n3. Make your changes\n4. Submit a pull request\n\n## License\n\nMIT License',
      notes: '# Meeting Notes\n\n**Date:** ' + new Date().toLocaleDateString() + '\n**Attendees:** \n\n## Agenda\n\n1. Item 1\n2. Item 2\n3. Item 3\n\n## Discussion\n\n### Topic 1\n\n- Point 1\n- Point 2\n\n### Topic 2\n\n- Point 1\n- Point 2\n\n## Action Items\n\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n## Next Meeting\n\n**Date:** TBD'
    };
    
    onChange(templates[template] || '# New Document\n\nStart writing your markdown here...');
  };

  const renderPreview = () => {
    // Simple markdown to HTML conversion for preview
    let html = content
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li>$1. $2</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
      .replace(/\n/g, '<br />');

    // Wrap consecutive <li> elements in <ul> tags
    html = html.replace(/(<li>.*?<\/li>(?:\s*<br \/>\s*<li>.*?<\/li>)*)/g, '<ul>$1</ul>');
    html = html.replace(/<br \/>\s*(?=<li>)/g, '');
    html = html.replace(/(?<=<\/li>)\s*<br \/>/g, '');

    return html;
  };

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
            <ToggleButton value="edit">
              <EditIcon sx={{ mr: 0.5 }} />
              Edit
            </ToggleButton>
            <ToggleButton value="split">
              <SplitIcon sx={{ mr: 0.5 }} />
              Split
            </ToggleButton>
            <ToggleButton value="preview">
              <PreviewIcon sx={{ mr: 0.5 }} />
              Preview
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Formatting Buttons */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Bold">
              <IconButton size="small" onClick={() => insertMarkdown('bold')}>
                <FormatBold />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
              <IconButton size="small" onClick={() => insertMarkdown('italic')}>
                <FormatItalic />
              </IconButton>
            </Tooltip>
            <Tooltip title="Code">
              <IconButton size="small" onClick={() => insertMarkdown('code')}>
                <Code />
              </IconButton>
            </Tooltip>
            <Tooltip title="Quote">
              <IconButton size="small" onClick={() => insertMarkdown('quote')}>
                <FormatQuote />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider orientation="vertical" flexItem />

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Bullet List">
              <IconButton size="small" onClick={() => insertMarkdown('ul')}>
                <FormatListBulleted />
              </IconButton>
            </Tooltip>
            <Tooltip title="Numbered List">
              <IconButton size="small" onClick={() => insertMarkdown('ol')}>
                <FormatListNumbered />
              </IconButton>
            </Tooltip>
            <Tooltip title="Link">
              <IconButton size="small" onClick={() => insertMarkdown('link')}>
                <Link />
              </IconButton>
            </Tooltip>
            <Tooltip title="Image">
              <IconButton size="small" onClick={() => insertMarkdown('image')}>
                <Image />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider orientation="vertical" flexItem />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" onClick={() => insertMarkdown('h1')}>
              H1
            </Button>
            <Button size="small" onClick={() => insertMarkdown('h2')}>
              H2
            </Button>
            <Button size="small" onClick={() => insertMarkdown('h3')}>
              H3
            </Button>
          </Box>

          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Button size="small" onClick={() => insertTemplate('document')}>
              Document
            </Button>
            <Button size="small" onClick={() => insertTemplate('readme')}>
              README
            </Button>
            <Button size="small" onClick={() => insertTemplate('notes')}>
              Notes
            </Button>
          </Box>
        </Toolbar>
      )}

      {/* Content Area */}
      <Box sx={{ flex: 1, display: 'flex' }}>
        {/* Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <Box sx={{ flex: viewMode === 'split' ? 0.5 : 1, display: 'flex', flexDirection: 'column' }}>
            <TextField
              fullWidth
              multiline
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder="# Start writing your markdown here...\n\nUse the toolbar buttons or type markdown syntax directly."
              variant="outlined"
              InputProps={{
                readOnly,
                sx: {
                  height: '100%',
                  alignItems: 'flex-start',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  '& .MuiInputBase-input': {
                    height: '100% !important',
                    overflow: 'auto !important',
                    resize: 'none',
                    whiteSpace: 'pre-wrap'
                  }
                }
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  height: '100%',
                  ...(viewMode === 'split' && {
                    borderRight: 0,
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0
                  })
                }
              }}
            />
          </Box>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <Box sx={{ 
            flex: viewMode === 'split' ? 0.5 : 1,
            border: 1,
            borderColor: 'divider',
            borderLeft: viewMode === 'split' ? 0 : 1,
            borderTopLeftRadius: viewMode === 'split' ? 0 : 4,
            borderBottomLeftRadius: viewMode === 'split' ? 0 : 4,
            overflow: 'auto',
            p: 2,
            backgroundColor: 'background.paper'
          }}>
            <Box
              sx={{
                '& h1': { fontSize: '2rem', fontWeight: 'bold', mb: 2, mt: 1 },
                '& h2': { fontSize: '1.5rem', fontWeight: 'bold', mb: 1.5, mt: 2 },
                '& h3': { fontSize: '1.25rem', fontWeight: 'bold', mb: 1, mt: 1.5 },
                '& p': { mb: 1, lineHeight: 1.6 },
                '& ul': { pl: 3, mb: 1 },
                '& ol': { pl: 3, mb: 1 },
                '& li': { mb: 0.5 },
                '& blockquote': { 
                  borderLeft: 4, 
                  borderColor: 'primary.main', 
                  pl: 2, 
                  py: 1, 
                  backgroundColor: 'grey.50',
                  fontStyle: 'italic',
                  mb: 1
                },
                '& code': { 
                  backgroundColor: 'grey.100', 
                  px: 0.5, 
                  py: 0.25, 
                  borderRadius: 0.5,
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                },
                '& pre': { 
                  backgroundColor: 'grey.900', 
                  color: 'white', 
                  p: 2, 
                  borderRadius: 1,
                  overflow: 'auto',
                  mb: 1
                },
                '& a': { color: 'primary.main', textDecoration: 'underline' },
                '& img': { maxWidth: '100%', height: 'auto', mb: 1 }
              }}
              dangerouslySetInnerHTML={{ __html: renderPreview() }}
            />
            {!content.trim() && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Preview will appear here as you type...
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MarkdownEditor;
