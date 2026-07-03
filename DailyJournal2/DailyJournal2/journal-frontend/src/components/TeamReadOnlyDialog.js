import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Card, CardContent, Chip, CircularProgress,
  Alert, Avatar, Stack, Grid, IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Group as GroupIcon,
  Assignment as JournalIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import * as teamApi from '../services/teamApi';

function TeamReadOnlyDialog({ open, onClose, team }) {
  const [members, setMembers] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && team) {
      loadTeamData();
    }
  }, [open, team]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load team members and journals in parallel
      const [membersResponse, journalsResponse] = await Promise.all([
        teamApi.listMembers(team.id),
        teamApi.listTeamJournals(team.id)
      ]);

      setMembers(membersResponse.data || []);
      setJournals(journalsResponse.data || []);
    } catch (err) {
      console.error('Error loading team data:', err);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'MASTER': return 'error';
      case 'ADMIN': return 'warning';
      case 'MEMBER': return 'primary';
      default: return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'MASTER': return '👑';
      case 'ADMIN': return '⚡';
      case 'MEMBER': return '👤';
      default: return '❓';
    }
  };

  // Format content: first 175 characters, 25 characters per line
  const formatContentPreview = (text) => {
    if (!text) return '';
    const preview = text.slice(0, 175);
    const lines = [];
    for (let i = 0; i < preview.length; i += 25) {
      lines.push(preview.slice(i, i + 25));
    }
    return lines.join('\n');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box display="flex" alignItems="center">
          <GroupIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {team?.name || 'Team'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Read-only view • You are not a member
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {loading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <Grid container spacing={3}>
            {/* Team Members Section */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: 'fit-content' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Members ({members.length})</Typography>
                  </Box>

                  <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {members.map((member) => (
                      <Card key={member.id} variant="outlined" sx={{ mb: 1, p: 1.5 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, width: 32, height: 32, bgcolor: 'primary.main' }}>
                              {member.userName?.charAt(0)?.toUpperCase() || '?'}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {member.userName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {member.userEmail}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={member.role}
                            color={getRoleColor(member.role)}
                            size="small"
                            icon={<span>{getRoleIcon(member.role)}</span>}
                          />
                        </Box>
                      </Card>
                    ))}
                    {members.length === 0 && (
                      <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                        No members found
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Team Journals Section */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: 'fit-content' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <JournalIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Journals ({journals.length})</Typography>
                  </Box>

                  <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {journals.map((journal) => (
                      <Card key={journal.id} variant="outlined" sx={{ mb: 1.5, p: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {journal.title || 'Untitled Journal'}
                        </Typography>

                        {journal.user && (
                          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                            <Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                              {journal.user.name?.charAt(0)?.toUpperCase() || journal.user.email?.charAt(0)?.toUpperCase() || '?'}
                            </Avatar>
                            <Typography variant="caption" color="text.secondary">
                              by {journal.user.name || journal.user.email}
                            </Typography>
                          </Stack>
                        )}

                        <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                          <Chip
                            icon={<DateIcon />}
                            label={journal.date ? new Date(journal.date).toLocaleDateString() : 'No date'}
                            size="small"
                            variant="outlined"
                          />
                          {journal.mood && (
                            <Chip
                              label={journal.mood}
                              size="small"
                              variant="outlined"
                              color="secondary"
                            />
                          )}
                          {journal.content && (
                            <Chip
                              label={`${journal.content.length} chars`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>

                        {journal.tags && (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={1}>
                            {journal.tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`}
                                size="small"
                                variant="filled"
                                color="primary"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            ))}
                          </Stack>
                        )}

                        {journal.content && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'monospace'
                            }}
                          >
                            {formatContentPreview(journal.content)}
                          </Typography>
                        )}
                      </Card>
                    ))}
                    {journals.length === 0 && (
                      <Box textAlign="center" py={2}>
                        <JournalIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          No journals found
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TeamReadOnlyDialog;
