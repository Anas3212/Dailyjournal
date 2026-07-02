import React, { useState } from 'react';
import {
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Stack,
  TextField,
  IconButton,
  Tooltip,
  LinearProgress,
  Chip,
  Fade,
  Zoom,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Collapse
} from '@mui/material';
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  Keyboard as KeyboardIcon
} from '@mui/icons-material';

/**
 * Enhanced Pagination Controls Component with advanced features
 */
const PaginationControls = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onItemsPerPageChange,
  handleJumpToPage,
  jumpToPageValue,
  setJumpToPageValue,
  isLoading = false,
  getStatistics,
  getPageRange,
  itemsPerPageOptions = [6, 12, 24, 48],
  showItemsPerPageSelector = true,
  showResultInfo = true,
  showAdvancedControls = true,
  showStatistics = false,
  enableKeyboardHints = true,
  size = 'large',
  sx = {}
}) => {
  const [showStats, setShowStats] = useState(showStatistics);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);
  const [jumpError, setJumpError] = useState('');

  // Don't render if no items
  if (totalItems === 0) {
    return null;
  }

  const stats = getStatistics ? getStatistics() : null;
  const progressPercentage = stats ? stats.percentageComplete : 0;

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const success = handleJumpToPage(jumpToPageValue);
    if (!success) {
      setJumpError(`Please enter a page number between 1 and ${totalPages}`);
      setTimeout(() => setJumpError(''), 3000);
    }
  };

  return (
    <Box sx={{ mt: 4, mb: 2, ...sx }}>
      {/* Loading Progress Bar */}
      {isLoading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress 
            sx={{
              height: 2,
              borderRadius: 1,
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }
            }}
          />
        </Box>
      )}

      {/* Single Clean Pagination Bar */}
      {totalItems > 0 && (
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.9)' }}>
          <Stack 
            direction="row" 
            spacing={2} 
            alignItems="center" 
            justifyContent="space-between"
            flexWrap="wrap"
            sx={{ minHeight: 40 }}
          >
            {/* Left: Result Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {totalItems.toLocaleString()} Results
              </Typography>
              <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                Page {currentPage} of {totalPages}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progressPercentage}
                sx={{
                  width: 60,
                  height: 4,
                  borderRadius: 2,
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }
                }}
              />
            </Box>

            {/* Center: Main Pagination */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {totalPages > 1 ? (
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={onPageChange}
                  color="primary"
                  size="small"
                  showFirstButton
                  showLastButton
                  disabled={isLoading}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      minWidth: 32,
                      height: 32,
                    },
                    '& .Mui-selected': {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      },
                    },
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  All items on one page
                </Typography>
              )}
            </Box>

            {/* Right: Controls */}
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Statistics Toggle */}
              {getStatistics && (
                <Tooltip title={showStats ? "Hide Statistics" : "Show Statistics"}>
                  <IconButton 
                    onClick={() => setShowStats(!showStats)}
                    color={showStats ? 'primary' : 'default'}
                    size="small"
                    sx={{ height: 32, width: 32 }}
                  >
                    <AnalyticsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Jump to Page - only show if multiple pages */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">Go to:</Typography>
                  <form onSubmit={handleJumpSubmit}>
                    <TextField
                      size="small"
                      type="number"
                      value={jumpToPageValue}
                      onChange={(e) => setJumpToPageValue(e.target.value)}
                      placeholder="#"
                      inputProps={{ 
                        min: 1, 
                        max: totalPages, 
                        style: { textAlign: 'center', padding: '4px 8px' } 
                      }}
                      sx={{ 
                        width: 50,
                        '& .MuiOutlinedInput-root': {
                          height: 32,
                        }
                      }}
                      disabled={isLoading}
                    />
                  </form>
                </Box>
              )}

              {/* Items per page selector */}
              {showItemsPerPageSelector && totalItems > Math.min(...itemsPerPageOptions) && (
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={itemsPerPage}
                    onChange={onItemsPerPageChange}
                    disabled={isLoading}
                    sx={{ 
                      height: 32,
                      '& .MuiSelect-select': {
                        padding: '4px 8px',
                        fontSize: '0.875rem'
                      }
                    }}
                  >
                    {itemsPerPageOptions.map(option => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Stack>

          {/* Statistics Panel */}
          {showStats && getStatistics && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <Stack direction="row" spacing={3} flexWrap="wrap" justifyContent="center">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Total Items</Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                    {stats?.totalItems.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Total Pages</Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                    {stats?.totalPages}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Items on Page</Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                    {stats?.itemsOnCurrentPage}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Progress</Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                    {stats?.percentageComplete}%
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Error Display */}
          {jumpError && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {jumpError}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default PaginationControls;
