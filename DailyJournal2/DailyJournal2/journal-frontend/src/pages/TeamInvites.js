import React, { useEffect, useState } from 'react';
import { 
  Box, Button, Card, CardContent, Grid, Stack, Typography, 
  Avatar, Chip, Paper, Fade, CircularProgress, Alert,
  Container, Divider
} from '@mui/material';
import {
  Group as GroupIcon,
  Person as PersonIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Mail as MailIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { getMyPendingInvites, acceptInvite, rejectInvite } from '../services/teamApi';

export default function TeamInvites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getMyPendingInvites();
      setInvites(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onAccept = async (id) => {
    setLoading(true);
    try {
      await acceptInvite(id);
      await load();
    } finally { setLoading(false); }
  };

  const onReject = async (id) => {
    setLoading(true);
    try {
      await rejectInvite(id);
      await load();
    } finally { setLoading(false); }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
            <MailIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Team Invitations
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {invites.length > 0 
                ? `You have ${invites.length} pending invitation${invites.length > 1 ? 's' : ''}`
                : 'No pending invitations'
              }
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={40} />
        </Box>
      )}

      {/* Invites Grid */}
      {!loading && invites.length > 0 && (
        <Grid container spacing={3}>
          {invites.map((inv, index) => (
            <Grid item xs={12} md={6} lg={4} key={inv.id}>
              <Fade in timeout={600 + index * 100}>
                <Card 
                  elevation={2}
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                    },
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}
                >
                  {/* Card Header */}
                  <Box 
                    sx={{ 
                      p: 3, 
                      pb: 2,
                      background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
                      borderBottom: '1px solid rgba(0,0,0,0.06)'
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar 
                        sx={{ 
                          bgcolor: 'primary.main',
                          width: 48,
                          height: 48
                        }}
                      >
                        <GroupIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            mb: 0.5,
                            color: 'text.primary'
                          }}
                        >
                          {inv.teamName}
                        </Typography>
                        <Chip 
                          icon={<ScheduleIcon />}
                          label="Pending"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </Box>
                    </Stack>
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    {/* Inviter Info */}
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                        <PersonIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Invited by
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {inv.inviterName}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider sx={{ mb: 3 }} />

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={2}>
                      <Button 
                        variant="contained" 
                        size="medium"
                        startIcon={<CheckIcon />}
                        onClick={() => onAccept(inv.id)} 
                        disabled={loading}
                        sx={{ 
                          flex: 1,
                          py: 1.2,
                          fontWeight: 600,
                          borderRadius: 2
                        }}
                      >
                        Accept
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="medium"
                        startIcon={<CloseIcon />}
                        color="error" 
                        onClick={() => onReject(inv.id)} 
                        disabled={loading}
                        sx={{ 
                          flex: 1,
                          py: 1.2,
                          fontWeight: 600,
                          borderRadius: 2
                        }}
                      >
                        Decline
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!loading && invites.length === 0 && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 6, 
            textAlign: 'center',
            bgcolor: 'rgba(0,0,0,0.02)',
            borderRadius: 3,
            border: '2px dashed rgba(0,0,0,0.1)'
          }}
        >
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 3,
              bgcolor: 'rgba(102,126,234,0.1)',
              color: 'primary.main'
            }}
          >
            <MailIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            No Pending Invitations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You don't have any team invitations at the moment.
          </Typography>
        </Paper>
      )}
    </Container>
  );
}
