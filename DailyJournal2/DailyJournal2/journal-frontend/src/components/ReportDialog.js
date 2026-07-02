import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Box
} from '@mui/material';
import { Flag as FlagIcon } from '@mui/icons-material';
import api from '../services/api';

const ReportDialog = ({ open, onClose, journalId, journalTitle }) => {
    const [reasons, setReasons] = useState([
        { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content' },
        { value: 'SPAM', label: 'Spam' },
        { value: 'HARASSMENT', label: 'Harassment' },
        { value: 'HATE_SPEECH', label: 'Hate Speech' },
        { value: 'VIOLENCE', label: 'Violence or Threats' },
        { value: 'PRIVACY_VIOLATION', label: 'Privacy Violation' },
        { value: 'COPYRIGHT_INFRINGEMENT', label: 'Copyright Infringement' },
        { value: 'MISINFORMATION', label: 'Misinformation' },
        { value: 'OTHER', label: 'Other' }
    ]);
    const [selectedReason, setSelectedReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [existingReport, setExistingReport] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchReportReasons();
            checkExistingReport();
            // Reset form when dialog opens
            setSelectedReason('');
            setDescription('');
            setError('');
            setSuccess(false);
            setExistingReport(null);
            setIsViewMode(false);
        }
    }, [open]);

    const fetchReportReasons = async () => {
        try {
            // ✅ Use cookie-based API service
            const response = await api.get('/reports/reasons');
            if (response.data && response.data.data) {
                setReasons(response.data.data);
            } else {
                setError('Failed to load report reasons');
            }
        } catch (error) {
            console.error('Error fetching report reasons:', error);
            setError('Failed to load report reasons');
        }
    };

    const checkExistingReport = async () => {
        try {
            // ✅ Use cookie-based API service
            const response = await api.get(`/reports/journal/${journalId}`);
            
            if (response.data) {
                const report = response.data;
                setExistingReport(report);
                setIsViewMode(true);
                setSelectedReason(report.reason);
                setDescription(report.description || '');
            }
        } catch (error) {
            // No existing report found, which is fine
            console.log('No existing report found for this journal');
        }
    };

    const handleSubmit = async () => {
        if (!selectedReason) {
            setError('Please select a reason for reporting');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // ✅ Use cookie-based API service
            const response = await api.post('/reports', {
                journalId: journalId,
                reason: selectedReason,
                description: description.trim() || null
            });

            if (response.data.success) {
                const report = response.data.data;
                setExistingReport(report);
                setIsViewMode(true);
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to submit report');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            setError('Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReport = async () => {
        if (!existingReport) return;
        
        setDeleteLoading(true);
        setError('');
        
        try {
            // ✅ Use cookie-based API service
            const response = await api.delete(`/reports/${existingReport.id}`);

            if (response.ok) {
                setSuccess(true);
                setExistingReport(null);
                setIsViewMode(false);
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setError('Failed to delete report. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            setError('An error occurred while deleting the report.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                pb: 1
            }}>
                <FlagIcon color="error" />
                {isViewMode ? 'Your Report' : 'Report Journal'}
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {isViewMode ? 'Your report for: ' : 'You are reporting: '}"{journalTitle}"
                </Typography>

                {isViewMode && existingReport && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        You have already reported this journal on {new Date(existingReport.createdAt).toLocaleDateString()}. 
                        Status: {existingReport.statusDisplayName}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Report submitted successfully!
                    </Alert>
                )}

                <FormControl fullWidth margin="normal" required>
                    <InputLabel>Reason for reporting</InputLabel>
                    <Select
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        label="Reason for reporting"
                        disabled={loading || isViewMode}
                    >
                        {reasons.map((reason) => (
                            <MenuItem key={reason.value} value={reason.value}>
                                {reason.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label={isViewMode ? "Your report details" : "Additional details (optional)"}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    margin="normal"
                    disabled={loading || isViewMode}
                    placeholder={isViewMode ? "" : "Please provide any additional context or details about why you're reporting this journal..."}
                />

                {isViewMode && existingReport && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Report Details:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Submitted:</strong> {new Date(existingReport.createdAt).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Status:</strong> {existingReport.statusDisplayName}
                        </Typography>
                        {existingReport.reviewedAt && (
                            <Typography variant="body2" color="text.secondary">
                                <strong>Reviewed:</strong> {new Date(existingReport.reviewedAt).toLocaleString()}
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading || deleteLoading}>
                    {isViewMode ? 'Close' : 'Cancel'}
                </Button>
                {isViewMode && existingReport && (
                    <Button 
                        onClick={handleDeleteReport}
                        variant="outlined"
                        color="error"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
                    >
                        {deleteLoading ? 'Deleting...' : 'Delete Report'}
                    </Button>
                )}
                {!isViewMode && (
                    <Button 
                        onClick={handleSubmit}
                        variant="contained"
                        color="error"
                        disabled={loading || !selectedReason}
                        startIcon={loading ? <CircularProgress size={20} /> : <FlagIcon />}
                    >
                        {loading ? 'Submitting...' : 'Submit Report'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ReportDialog;
