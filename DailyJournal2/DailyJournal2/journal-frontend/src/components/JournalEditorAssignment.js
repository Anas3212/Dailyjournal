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
    Chip,
    Box,
    Typography,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { listMembers } from '../services/teamApi';

export default function JournalEditorAssignment({ 
    open, 
    onClose, 
    journal, 
    teamId, 
    onAssignmentChange 
}) {
    const [teamAdmins, setTeamAdmins] = useState([]);
    const [currentEditors, setCurrentEditors] = useState([]);
    const [selectedAdmin, setSelectedAdmin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (open && teamId) {
            loadTeamAdmins();
            loadCurrentEditors();
        }
    }, [open, teamId, journal?.id]);

    const loadTeamAdmins = async () => {
        try {
            const response = await listMembers(teamId);
            console.log('Full API response:', response);
            const members = response?.data;
            console.log('All team members:', members);
            
            if (!members || !Array.isArray(members)) {
                console.error('Invalid members data:', members);
                setError('Invalid team members data');
                return;
            }
            
            // Filter only admins (not masters, as masters already have full access)
            const admins = members.filter(member => {
                return member.role === 'ADMIN';
            });
            setTeamAdmins(admins);
            
            if (admins.length === 0) {
                console.log('No admins found in team');
            }
        } catch (err) {
            console.error('Error loading team admins:', err);
            setError('Failed to load team admins');
        }
    };

    const loadCurrentEditors = async () => {
        if (!journal?.id) return;
        
        try {
            // ✅ Use cookies for authentication
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journal-editors/journal/${journal.id}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const editors = await response.json();
                setCurrentEditors(editors || []);
            }
        } catch (err) {
            console.error('Error loading current editors:', err);
        }
    };

    const handleAssignEditor = async () => {
        if (!selectedAdmin || !journal?.id) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // ✅ Use cookies for authentication
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journal-editors/assign?journalId=${journal.id}&adminUserId=${selectedAdmin}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                setSuccess('Editor assigned successfully');
                setSelectedAdmin('');
                await loadCurrentEditors();
                if (onAssignmentChange) onAssignmentChange();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to assign editor');
            }
        } catch (err) {
            console.error('Error assigning editor:', err);
            setError('Failed to assign editor');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveEditor = async (adminUserId) => {
        if (!journal?.id) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // ✅ Use cookies for authentication
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}`}/api/journal-editors/remove?journalId=${journal.id}&adminUserId=${adminUserId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setSuccess('Editor removed successfully');
                await loadCurrentEditors();
                if (onAssignmentChange) onAssignmentChange();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to remove editor');
            }
        } catch (err) {
            console.error('Error removing editor:', err);
            setError('Failed to remove editor');
        } finally {
            setLoading(false);
        }
    };

    const getAdminName = (userId) => {
        const admin = teamAdmins.find(admin => admin.userId === userId);
        return admin ? admin.userName : 'Unknown Admin';
    };

    const availableAdmins = teamAdmins.filter(admin => 
        !currentEditors.some(editor => editor.user.id === admin.userId)
    );
    

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <PersonAddIcon />
                    <Typography variant="h6">
                        Assign Journal Editors
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Journal: {journal?.title}
                </Typography>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {/* Debug Info - Remove this after fixing */}
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="caption" display="block">
                        Debug Info:
                    </Typography>
                    <Typography variant="caption" display="block">
                        Team ID: {teamId}
                    </Typography>
                    <Typography variant="caption" display="block">
                        Total Team Admins: {teamAdmins.length}
                    </Typography>
                    <Typography variant="caption" display="block">
                        Available Admins: {availableAdmins.length}
                    </Typography>
                    <Typography variant="caption" display="block">
                        Current Editors: {currentEditors.length}
                    </Typography>
                </Box>

                {/* Assign New Editor Section */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Assign New Editor
                    </Typography>
                    
                    {availableAdmins.length > 0 ? (
                        <Box display="flex" gap={2} alignItems="center">
                            <FormControl fullWidth>
                                <InputLabel>Select Admin</InputLabel>
                                <Select
                                    value={selectedAdmin}
                                    onChange={(e) => setSelectedAdmin(e.target.value)}
                                    label="Select Admin"
                                >
                                    {availableAdmins.map((admin) => (
                                        <MenuItem key={admin.userId} value={admin.userId}>
                                            {admin.userName} ({admin.userEmail})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            <Button
                                variant="contained"
                                onClick={handleAssignEditor}
                                disabled={!selectedAdmin || loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
                            >
                                Assign
                            </Button>
                        </Box>
                    ) : (
                        <Alert severity="info">
                            No available admins to assign. All team admins are already assigned to this journal.
                        </Alert>
                    )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Current Editors Section */}
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Current Editors ({currentEditors.length})
                    </Typography>
                    
                    {currentEditors.length > 0 ? (
                        <List>
                            {currentEditors.map((editor) => (
                                <ListItem key={editor.id} divider>
                                    <ListItemText
                                        primary={editor.user.username}
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {editor.user.email}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Assigned: {new Date(editor.assignedAt).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleRemoveEditor(editor.user.id)}
                                            disabled={loading}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Alert severity="info">
                            No editors currently assigned to this journal.
                        </Alert>
                    )}
                </Box>

                {/* Info Section */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Note:</strong> Only team admins can be assigned as journal editors. 
                        Team masters already have full access to all journals and don't need to be assigned.
                        Assigned editors will be able to edit this specific journal even if they're not 
                        normally allowed to edit team journals.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
