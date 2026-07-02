import React, { useState, useEffect } from 'react';
import {
    Alert,
    AlertTitle,
    Box,
    Typography,
    Chip,
    Avatar,
    Collapse,
    IconButton,
    Divider,
    CircularProgress
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Person as PersonIcon,
    Security as SecurityIcon,
    Edit as EditIcon
} from '@mui/icons-material';

const JournalPermissionError = ({ 
    open, 
    message, 
    journalId, 
    journalTitle, 
    onClose 
}) => {
    const [expanded, setExpanded] = useState(false);
    const [editors, setEditors] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && journalId) {
            loadJournalEditors();
        }
    }, [open, journalId]);

    const loadJournalEditors = async () => {
        if (!journalId) return;
        
        setLoading(true);
        try {
            // ✅ Use cookies for authentication
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journal-editors/journal/${journalId}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const editorsData = await response.json();
                setEditors(editorsData || []);
            }
        } catch (err) {
            console.error('Error loading journal editors:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const isPermissionError = message && (
        message.toLowerCase().includes('insufficient') ||
        message.toLowerCase().includes('permission') ||
        message.toLowerCase().includes('not authorized') ||
        message.toLowerCase().includes('forbidden') ||
        message.toLowerCase().includes('upload failed') ||
        message.toLowerCase().includes('manage media files')
    );

    if (!isPermissionError) {
        return (
            <Alert 
                severity="error" 
                onClose={onClose}
                sx={{ mb: 2 }}
            >
                {message}
            </Alert>
        );
    }

    return (
        <Alert 
            severity="error" 
            onClose={onClose}
            sx={{ 
                mb: 2,
                '& .MuiAlert-message': {
                    width: '100%'
                }
            }}
        >
            <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon fontSize="small" />
                Insufficient Permissions
            </AlertTitle>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
                {message.toLowerCase().includes('upload failed') || message.toLowerCase().includes('manage media files') ? (
                    <>
                        You don't have permission to manage media files for this journal. Only assigned admin editors, 
                        team masters, or regular admins (when no admin editor assigned) can upload or delete media files.
                    </>
                ) : (
                    <>
                        You don't have permission to edit this journal. Only the journal owner, team masters, 
                        and specifically assigned editors can modify this content.
                    </>
                )}
            </Typography>

            {journalTitle && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Journal:</strong> {journalTitle}
                    </Typography>
                </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <IconButton
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    sx={{ p: 0.5 }}
                >
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {message.toLowerCase().includes('upload failed') || message.toLowerCase().includes('manage media files') ? 
                        'Who can manage media files for this journal?' : 
                        'Who can edit this journal?'
                    }
                </Typography>
            </Box>

            <Collapse in={expanded}>
                <Box sx={{ mt: 1, pl: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {message.toLowerCase().includes('upload failed') || message.toLowerCase().includes('manage media files') ? 
                            'The following users have permission to manage media files for this journal:' : 
                            'The following users have permission to edit this journal:'
                        }
                    </Typography>

                    {/* Team Masters */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            TEAM MASTERS
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {message.toLowerCase().includes('upload failed') || message.toLowerCase().includes('manage media files') ? 
                                'Team masters can upload and delete media files for all team journals' : 
                                'Team masters have full access to all team journals'
                            }
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Assigned Editors */}
                    <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                            ASSIGNED EDITORS
                        </Typography>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="text.secondary">
                                Loading assigned editors...
                            </Typography>
                        </Box>
                    ) : editors.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {editors.map((editor) => (
                                <Chip
                                    key={editor.id}
                                    avatar={
                                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                            {editor.user.username.charAt(0).toUpperCase()}
                                        </Avatar>
                                    }
                                    label={editor.user.username}
                                    size="small"
                                    variant="outlined"
                                    icon={<EditIcon />}
                                    sx={{
                                        borderColor: 'secondary.main',
                                        color: 'secondary.main',
                                        '& .MuiChip-avatar': {
                                            backgroundColor: 'secondary.main',
                                            color: 'white'
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                            No specific editors assigned to this journal
                        </Typography>
                    )}

                    <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            💡 <strong>Tip:</strong> {message.toLowerCase().includes('upload failed') || message.toLowerCase().includes('manage media files') ? 
                                'Contact a team master to request media management access or to be assigned as an admin editor for this journal.' : 
                                'Contact a team master to request edit access or to be assigned as an editor for this journal.'
                            }
                        </Typography>
                    </Box>
                </Box>
            </Collapse>
        </Alert>
    );
};

export default JournalPermissionError;
