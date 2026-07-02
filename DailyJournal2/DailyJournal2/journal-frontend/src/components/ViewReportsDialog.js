import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Card,
    CardContent,
    Chip,
    Alert,
    CircularProgress,
    Divider,
    Stack
} from '@mui/material';
import { Visibility as VisibilityIcon, Person as PersonIcon, CalendarToday as CalendarTodayIcon, Flag as FlagIcon } from '@mui/icons-material';
import api from '../services/api';

const ViewReportsDialog = ({ open, onClose, journalId, journalTitle }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && journalId) {
            fetchReports();
        }
    }, [open, journalId]);

    const fetchReports = async () => {
        setLoading(true);
        setError('');
        
        try {
            // ✅ Use cookie-based API service
            const response = await api.get(`/reports/my-journal/${journalId}`);
            
            setReports(response.data || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
            setError('Failed to load reports for this journal.');
        } finally {
            setLoading(false);
        }
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
            case 'PRIVACY_VIOLATION': return 'info';
            case 'COPYRIGHT_INFRINGEMENT': return 'warning';
            case 'MISINFORMATION': return 'warning';
            case 'OTHER': return 'default';
            default: return 'default';
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="md"
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
                <VisibilityIcon color="primary" />
                Reports for "{journalTitle}"
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : reports.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <FlagIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No Reports Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            This journal has not been reported by any users.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                            Found {reports.length} report{reports.length !== 1 ? 's' : ''} for this journal
                        </Typography>
                        
                        {reports.map((report, index) => (
                            <Card key={report.id} variant="outlined" sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            <Chip 
                                                label={report.reasonDisplayName} 
                                                color={getReasonColor(report.reason)}
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Chip 
                                                label={report.statusDisplayName} 
                                                color={getStatusColor(report.status)}
                                                size="small"
                                            />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Report #{report.id}
                                        </Typography>
                                    </Box>

                                    {report.description && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                                Description:
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {report.description}
                                            </Typography>
                                        </Box>
                                    )}

                                    <Divider sx={{ my: 2 }} />

                                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                Reporter: {report.reporterName || 'Anonymous'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                Submitted: {new Date(report.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        {report.reviewedAt && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    Reviewed: {new Date(report.reviewedAt).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    {report.adminNotes && (
                                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                                Admin Notes:
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {report.adminNotes}
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewReportsDialog;
