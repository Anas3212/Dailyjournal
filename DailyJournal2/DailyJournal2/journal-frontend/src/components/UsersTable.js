import React, { useState, useEffect } from 'react';
import { 

  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Button, Box, TextField, TableSortLabel, 
  Chip, Switch, FormControlLabel, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle
} from '@mui/material';
import api, { toggleUserStatus, deleteUser, promoteUser } from '../services/api';

const UsersTable = ({ onViewJournals }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  
  // State for confirmation dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToToggle, setUserToToggle] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Open status toggle confirmation dialog
  const openStatusDialog = (user) => {
    setUserToToggle(user);
    setStatusDialogOpen(true);
  };

  // Close status toggle confirmation dialog
  const closeStatusDialog = () => {
    setStatusDialogOpen(false);
    setUserToToggle(null);
  };

  // Handle toggle status with confirmation
  const handleToggleStatus = async () => {
    if (!userToToggle) return;
    
    try {
      await toggleUserStatus(userToToggle.id);
      closeStatusDialog();
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert(`Error toggling user status: ${error.message}`);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // Handle delete with confirmation
  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.id);
      closeDeleteDialog();
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Error deleting user: ${error.message}`);
    }
  };

  const handlePromote = async (userId) => {
    try {
      await promoteUser(userId);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error promoting user:', error);
      alert(`Error promoting user: ${error.message}`);
    }
  };

  // Sorting function
  const getSortedUsers = () => {
    let filteredUsers = users;

    // Search filter
    if (searchTerm) {
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Active users filter
    if (showActiveOnly) {
      filteredUsers = filteredUsers.filter(user => user.enabled);
    }

    // Sorting
    return filteredUsers.sort((a, b) => {
      const key = sortConfig.key;
      if (a[key] < b[key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === 'asc';
    setSortConfig({ key, direction: isAsc ? 'desc' : 'asc' });
  };

  const sortedUsers = getSortedUsers();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          label="Search Users"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '50%' }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={showActiveOnly}
              onChange={() => setShowActiveOnly(!showActiveOnly)}
            />
          }
          label="Active Users Only"
        />
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'id'}
                  direction={sortConfig.key === 'id' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('id')}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'name'}
                  direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'email'}
                  direction={sortConfig.key === 'email' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('email')}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.roles.map(role => role.name).join(', ')}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.enabled ? 'Active' : 'Blocked'} 
                    color={user.enabled ? 'success' : 'error'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }}
                    onClick={() => handlePromote(user.id)}
                    disabled={user.roles.some(role => role.name === 'ROLE_ADMIN')}
                  >
                    Promote
                  </Button>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }}
                    onClick={() => openDeleteDialog(user)}
                  >
                    Delete
                  </Button>
                  <Button 
                    variant="contained" 
                    color={user.enabled ? 'warning' : 'success'} 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }}
                    onClick={() => openStatusDialog(user)}
                  >
                    {user.enabled ? 'Block' : 'Unblock'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="info" 
                    size="small" 
                    onClick={() => onViewJournals(user.id)}
                  >
                    View Journals
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete user {userToDelete?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="secondary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Toggle Confirmation Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={closeStatusDialog}
        aria-labelledby="status-dialog-title"
        aria-describedby="status-dialog-description"
      >
        <DialogTitle id="status-dialog-title">
          Confirm {userToToggle?.enabled ? 'Block' : 'Unblock'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="status-dialog-description">
            Are you sure you want to {userToToggle?.enabled ? 'block' : 'unblock'} user {userToToggle?.name}?
            {userToToggle?.enabled ? ' This will prevent them from logging in.' : ' This will allow them to log in again.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStatusDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleToggleStatus} color={userToToggle?.enabled ? 'warning' : 'success'} autoFocus>
            {userToToggle?.enabled ? 'Block' : 'Unblock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersTable;