import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Chip,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  TrendingUp as PromoteIcon,
  TrendingDown as DemoteIcon,
  SwapHoriz as TransferIcon,
  ExitToApp as LeaveIcon,
  Warning as WarningIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as MemberIcon,
  SupervisorAccount as MasterIcon
} from '@mui/icons-material';

export default function ConfirmDialog({ 
  open, 
  title, 
  description, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onClose,
  onCancel 
}) {
  const content = description || message;
  
  // Determine dialog type and styling based on title/content
  const getDialogConfig = () => {
    const titleLower = (title || '').toLowerCase();
    const contentLower = (content || '').toLowerCase();
    
    if (titleLower.includes('delete') || titleLower.includes('remove')) {
      return {
        icon: <DeleteIcon sx={{ fontSize: 28 }} />,
        color: 'error',
        bgGradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        iconBg: 'error.light'
      };
    }
    
    if (titleLower.includes('promote') || contentLower.includes('promote')) {
      return {
        icon: <PromoteIcon sx={{ fontSize: 28 }} />,
        color: 'success',
        bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        iconBg: 'rgba(255,255,255,0.9)',
        iconColor: '#059669',
        headerTextColor: 'white',
        roleInfo: {
          from: 'MEMBER',
          to: 'ADMIN',
          fromIcon: <MemberIcon sx={{ fontSize: 16 }} />,
          toIcon: <AdminIcon sx={{ fontSize: 16 }} />,
          permissions: ['Create and edit team journals', 'View all team content', 'Enhanced collaboration access']
        }
      };
    }
    
    if (titleLower.includes('demote') || contentLower.includes('demote')) {
      return {
        icon: <DemoteIcon sx={{ fontSize: 28 }} />,
        color: 'warning',
        bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        iconBg: 'rgba(255,255,255,0.9)',
        iconColor: '#d97706',
        headerTextColor: 'white',
        roleInfo: {
          from: 'ADMIN',
          to: 'MEMBER',
          fromIcon: <AdminIcon sx={{ fontSize: 16 }} />,
          toIcon: <MemberIcon sx={{ fontSize: 16 }} />,
          permissions: ['Read-only access to team journals', 'Limited collaboration features', 'Cannot create or edit content']
        }
      };
    }
    
    if (titleLower.includes('transfer') || titleLower.includes('ownership')) {
      return {
        icon: <TransferIcon sx={{ fontSize: 28 }} />,
        color: 'primary',
        bgGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        iconBg: 'primary.light'
      };
    }
    
    if (titleLower.includes('leave')) {
      return {
        icon: <LeaveIcon sx={{ fontSize: 28 }} />,
        color: 'warning',
        bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        iconBg: 'warning.light'
      };
    }
    
    // Default warning style
    return {
      icon: <WarningIcon sx={{ fontSize: 28 }} />,
      color: 'warning',
      bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      iconBg: 'warning.light'
    };
  };
  
  const config = getDialogConfig();
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose || onCancel} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          border: '1px solid',
          borderColor: 'grey.200',
          overflow: 'hidden'
        }
      }}
    >
      {title && (
        <DialogTitle sx={{ 
          pb: 2,
          background: config.bgGradient,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Avatar sx={{
            bgcolor: config.iconBg || config.iconBg,
            color: config.iconColor || `${config.color}.main`,
            width: 48,
            height: 48
          }}>
            {config.icon}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold', 
              color: config.headerTextColor || 'text.primary' 
            }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: config.headerTextColor ? 'rgba(255,255,255,0.8)' : 'text.secondary', 
              mt: 0.5 
            }}>
              Please confirm your action
            </Typography>
          </Box>
        </DialogTitle>
      )}
      
      {content && (
        <DialogContent sx={{ p: 3 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              lineHeight: 1.6,
              color: 'text.primary',
              mb: config.roleInfo ? 3 : 0
            }}
          >
            {content}
          </Typography>
          
          {config.roleInfo && (
            <Box sx={{ mt: 3 }}>
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-message': { width: '100%' }
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Role Change Details
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    icon={config.roleInfo.fromIcon}
                    label={config.roleInfo.from}
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>→</Typography>
                  <Chip
                    icon={config.roleInfo.toIcon}
                    label={config.roleInfo.to}
                    size="small"
                    color={config.color}
                    variant="filled"
                  />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                  New permissions:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {config.roleInfo.permissions.map((permission, index) => (
                    <Typography 
                      key={index}
                      component="li" 
                      variant="body2" 
                      sx={{ mb: 0.5 }}
                    >
                      {permission}
                    </Typography>
                  ))}
                </Box>
              </Alert>
            </Box>
          )}
        </DialogContent>
      )}
      
      <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
        <Button 
          onClick={onClose || onCancel}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            px: 3,
            fontWeight: 'medium'
          }}
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          color={config.color}
          sx={{ 
            borderRadius: 2,
            px: 3,
            fontWeight: 'bold',
            boxShadow: `0 4px 12px rgba(0,0,0,0.15)`,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: `0 6px 16px rgba(0,0,0,0.2)`
            }
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
