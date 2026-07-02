import React, { useState, useEffect, useContext } from 'react';
import {
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Box,
  Container,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Flag as FlagIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Article as ArticleIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

function AdminReports() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalReports, setTotalReports] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [updateDialog, setUpdateDialog] = useState({ 
    open: false, 
    reportId: null, 
    currentStatus: '', 
    adminNotes: '' 
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [page, rowsPerPage, statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: rowsPerPage.toString()
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      // ✅ Use cookie-based API service
      const response = await api.get(`/reports/admin?${params}`);

      if (response.data.success) {
        setReports(response.data.data.content);
        setTotalReports(response.data.data.totalElements);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      showSnackbar('Failed to fetch reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // ✅ Use cookie-based API service
      const response = await api.get('/reports/admin/stats');

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      // ✅ Use cookie-based API service
      const response = await api.put(`/reports/admin/${updateDialog.reportId}`, {
        status: updateDialog.currentStatus,
        adminNotes: updateDialog.adminNotes
      });

      if (response.data.success) {
        showSnackbar('Report status updated successfully', 'success');
        setUpdateDialog({ open: false, reportId: null, currentStatus: '', adminNotes: '' });
        fetchReports();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating report:', error);
      showSnackbar('Failed to update report status', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'UNDER_REVIEW': return 'info';
      case 'RESOLVED': return 'success';
      case 'DISMISSED': return 'default';
      case 'ESCALATED': return 'error';
      default: return 'default';
    }
  };

  const getReasonColor = (reason) => {
    switch (reason) {
      case 'INAPPROPRIATE_CONTENT': return 'error';
      case 'SPAM': return 'warning';
      case 'HARASSMENT': return 'error';
      case 'HATE_SPEECH': return 'error';
      case 'VIOLENCE': return 'error';
      default: return 'info';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Report Management
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
              {stats.total || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Reports
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
              {stats.pending || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
              {stats.underReview || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Under Review
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
              {stats.resolved || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resolved
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="text.secondary" sx={{ fontWeight: 600 }}>
              {stats.dismissed || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dismissed
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="error.main" sx={{ fontWeight: 600 }}>
              {stats.escalated || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Escalated
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Filter by Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
              <MenuItem value="RESOLVED">Resolved</MenuItem>
              <MenuItem value="DISMISSED">Dismissed</MenuItem>
              <MenuItem value="ESCALATED">Escalated</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="outlined" 
            onClick={() => {
              setStatusFilter('');
              setPage(0);
            }}
          >
            Clear Filters
          </Button>
        </Stack>
      </Paper>

      {/* Reports Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Report ID</TableCell>
                <TableCell>Reporter</TableCell>
                <TableCell>Journal</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No reports found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>#{report.id}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PersonIcon fontSize="small" />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {report.reporterName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {report.reporterEmail}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ArticleIcon fontSize="small" />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {report.reportedJournalTitle}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {report.reportedUserName}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.reasonDisplayName} 
                        color={getReasonColor(report.reason)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.statusDisplayName} 
                        color={getStatusColor(report.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TimeIcon fontSize="small" />
                        <Typography variant="body2">
                          {formatDate(report.createdAt)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setSelectedReport(report);
                              setViewDialog(true);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update Status">
                          <IconButton 
                            size="small"
                            onClick={() => setUpdateDialog({
                              open: true,
                              reportId: report.id,
                              currentStatus: report.status,
                              adminNotes: report.adminNotes || ''
                            })}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalReports}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Update Status Dialog */}
      <Dialog open={updateDialog.open} onClose={() => setUpdateDialog({ ...updateDialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Update Report Status</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={updateDialog.currentStatus}
                onChange={(e) => setUpdateDialog({ ...updateDialog, currentStatus: e.target.value })}
                label="Status"
              >
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
                <MenuItem value="DISMISSED">Dismissed</MenuItem>
                <MenuItem value="ESCALATED">Escalated</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Admin Notes"
              value={updateDialog.adminNotes}
              onChange={(e) => setUpdateDialog({ ...updateDialog, adminNotes: e.target.value })}
              placeholder="Add notes about your decision..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialog({ ...updateDialog, open: false })}>
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Report Details</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Report ID</Typography>
                  <Typography variant="body1">#{selectedReport.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedReport.statusDisplayName} 
                    color={getStatusColor(selectedReport.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Reporter</Typography>
                  <Typography variant="body1">{selectedReport.reporterName}</Typography>
                  <Typography variant="caption" color="text.secondary">{selectedReport.reporterEmail}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Reported User</Typography>
                  <Typography variant="body1">{selectedReport.reportedUserName}</Typography>
                  <Typography variant="caption" color="text.secondary">{selectedReport.reportedUserEmail}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Journal Title</Typography>
                  <Typography variant="body1">{selectedReport.reportedJournalTitle}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Reason</Typography>
                  <Chip 
                    label={selectedReport.reasonDisplayName} 
                    color={getReasonColor(selectedReport.reason)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">{formatDate(selectedReport.createdAt)}</Typography>
                </Grid>
                {selectedReport.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">{selectedReport.description}</Typography>
                    </Paper>
                  </Grid>
                )}
                {selectedReport.adminNotes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Admin Notes</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">{selectedReport.adminNotes}</Typography>
                    </Paper>
                  </Grid>
                )}
                {selectedReport.reviewedAt && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Reviewed</Typography>
                    <Typography variant="body2">
                      {formatDate(selectedReport.reviewedAt)} by {selectedReport.reviewedByName}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default AdminReports;
