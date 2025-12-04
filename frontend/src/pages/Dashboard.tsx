import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  MenuItem,
  IconButton,
  Chip,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { ledgerService, accountService } from '../services/ledger';
import { LedgerEntryWithAccounts, Account, LedgerEntryCreate } from '../types';

const Dashboard: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntryWithAccounts[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LedgerEntryWithAccounts | null>(null);
  const [formData, setFormData] = useState<LedgerEntryCreate>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    debit_account_id: 0,
    credit_account_id: 0,
    amount: 0,
    reference: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesData, accountsData] = await Promise.all([
        ledgerService.getLedgerEntries(),
        accountService.getAccounts(),
      ]);
      setEntries(entriesData);
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (entry?: LedgerEntryWithAccounts) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        date: entry.date.split('T')[0],
        description: entry.description,
        debit_account_id: entry.debit_account_id,
        credit_account_id: entry.credit_account_id,
        amount: entry.amount,
        reference: entry.reference || '',
      });
    } else {
      setEditingEntry(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        debit_account_id: 0,
        credit_account_id: 0,
        amount: 0,
        reference: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEntry(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await ledgerService.updateLedgerEntry(editingEntry.id, formData);
      } else {
        await ledgerService.createLedgerEntry(formData);
      }
      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await ledgerService.deleteLedgerEntry(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'primary';
      case 'liability': return 'secondary';
      case 'equity': return 'success';
      case 'revenue': return 'info';
      case 'expense': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          General Ledger
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ mb: 3 }}
        >
          Add Entry
        </Button>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Debit Account</TableCell>
                <TableCell>Credit Account</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{entry.debit_account.name}</Typography>
                      <Chip
                        label={entry.debit_account.account_type}
                        size="small"
                        color={getAccountTypeColor(entry.debit_account.account_type) as any}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{entry.credit_account.name}</Typography>
                      <Chip
                        label={entry.credit_account.account_type}
                        size="small"
                        color={getAccountTypeColor(entry.credit_account.account_type) as any}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">${entry.amount.toFixed(2)}</TableCell>
                  <TableCell>{entry.reference || '-'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(entry)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(entry.id)} size="small" color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingEntry ? 'Edit Ledger Entry' : 'Add Ledger Entry'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Date"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Description"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                select
                margin="dense"
                label="Debit Account"
                fullWidth
                variant="outlined"
                value={formData.debit_account_id}
                onChange={(e) => setFormData({ ...formData, debit_account_id: Number(e.target.value) })}
                sx={{ mb: 2 }}
              >
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name} ({account.account_type})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                margin="dense"
                label="Credit Account"
                fullWidth
                variant="outlined"
                value={formData.credit_account_id}
                onChange={(e) => setFormData({ ...formData, credit_account_id: Number(e.target.value) })}
                sx={{ mb: 2 }}
              >
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name} ({account.account_type})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                margin="dense"
                label="Amount"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Reference"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingEntry ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Dashboard;