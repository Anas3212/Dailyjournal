import React, { useEffect, useState } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Box, TextField, Stack, Snackbar, Alert, IconButton } from '@mui/material';
import { getAllUsers, promoteUser, blockUser, deleteUser, adminSearchJournals, adminGetAllJournals, adminDeleteJournal } from '../services/api';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

function Admin() {
  const [users, setUsers] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const usersRes = await getAllUsers();
    const journalsRes = await adminGetAllJournals();
    setUsers(usersRes.data);
    setJournals(journalsRes.data);
    setLoading(false);
  };

  const handlePromote = async (id) => {
    await promoteUser(id);
    setSnackbar({ open: true, message: 'User promoted to admin!', severity: 'success' });
    fetchData();
  };
  const handleBlock = async (id) => {
    await blockUser(id);
    setSnackbar({ open: true, message: 'User blocked!', severity: 'warning' });
    fetchData();
  };
  const handleDeleteUser = async (id) => {
    await deleteUser(id);
    setSnackbar({ open: true, message: 'User deleted!', severity: 'error' });
    fetchData();
  };
  const handleDeleteJournal = async (id) => {
    await adminDeleteJournal(id);
    setSnackbar({ open: true, message: 'Journal deleted!', severity: 'error' });
    fetchData();
  };
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await adminSearchJournals(search);
    setJournals(res.data);
    setLoading(false);
  };

  return (
    <Box sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Users</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.roles ? user.roles.join(', ') : (user.isAdmin ? 'ADMIN' : 'USER')}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" color="secondary" onClick={() => handlePromote(user.id)}>Promote</Button>
                      <Button size="small" color="warning" onClick={() => handleBlock(user.id)}>Block</Button>
                      <Button size="small" color="error" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>All Journal Entries</Typography>
        <form onSubmit={handleSearch} style={{ marginBottom: 16 }}>
          <TextField
            placeholder="Search by user name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              endAdornment: (
                <IconButton type="submit">
                  <SearchIcon />
                </IconButton>
              ),
            }}
            fullWidth
          />
        </form>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {journals.map(journal => (
                <TableRow key={journal.id}>
                  <TableCell>{journal.title}</TableCell>
                  <TableCell>{journal.userName} ({journal.userEmail})</TableCell>
                  <TableCell>{journal.date}</TableCell>
                  <TableCell>
                    <Button size="small" color="error" onClick={() => handleDeleteJournal(journal.id)} startIcon={<DeleteIcon />}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Admin; 