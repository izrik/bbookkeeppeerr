import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dashboard from '../pages/Dashboard';
import { ledgerService, accountService } from '../services/ledger';

// Mock services
jest.mock('../services/ledger');
const mockLedgerService = ledgerService as jest.Mocked<typeof ledgerService>;
const mockAccountService = accountService as jest.Mocked<typeof accountService>;

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token');
  });

  test('renders dashboard with ledger entries', async () => {
    const mockAccounts = [
      {
        id: 1,
        name: 'Cash Account',
        account_type: 'asset',
        description: 'Cash account',
        account_number: '1001',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Revenue Account',
        account_type: 'revenue',
        description: 'Revenue account',
        account_number: '4001',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    ];

    const mockEntries = [
      {
        id: 1,
        date: '2024-01-01T00:00:00Z',
        description: 'Test transaction',
        debit_account_id: 1,
        credit_account_id: 2,
        amount: 100.50,
        reference: 'TEST-001',
        user_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        debit_account: mockAccounts[0],
        credit_account: mockAccounts[1],
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'user',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      }
    ];

    mockAccountService.getAccounts.mockResolvedValue(mockAccounts);
    mockLedgerService.getLedgerEntries.mockResolvedValue(mockEntries);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('General Ledger')).toBeInTheDocument();
      expect(screen.getByText('Add Entry')).toBeInTheDocument();
      expect(screen.getByText('Test transaction')).toBeInTheDocument();
      expect(screen.getByText('Cash Account')).toBeInTheDocument();
      expect(screen.getByText('Revenue Account')).toBeInTheDocument();
      expect(screen.getByText('$100.50')).toBeInTheDocument();
      expect(screen.getByText('TEST-001')).toBeInTheDocument();
    });
  });

  test('opens add entry dialog', async () => {
    mockAccountService.getAccounts.mockResolvedValue([]);
    mockLedgerService.getLedgerEntries.mockResolvedValue([]);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Add Entry')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Entry'));

    await waitFor(() => {
      expect(screen.getByText('Add Ledger Entry')).toBeInTheDocument();
      expect(screen.getByLabelText('Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Debit Account')).toBeInTheDocument();
      expect(screen.getByLabelText('Credit Account')).toBeInTheDocument();
      expect(screen.getByLabelText('Amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Reference')).toBeInTheDocument();
    });
  });

  test('creates new ledger entry', async () => {
    const mockAccounts = [
      {
        id: 1,
        name: 'Asset Account',
        account_type: 'asset',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Expense Account',
        account_type: 'expense',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    ];

    mockAccountService.getAccounts.mockResolvedValue(mockAccounts);
    mockLedgerService.getLedgerEntries.mockResolvedValue([]);
    mockLedgerService.createLedgerEntry.mockResolvedValue({} as any);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Add Entry')).toBeInTheDocument();
    });

    // Open dialog
    fireEvent.click(screen.getByText('Add Entry'));

    await waitFor(() => {
      expect(screen.getByText('Add Ledger Entry')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'New transaction' }
    });
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '75.25' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mockLedgerService.createLedgerEntry).toHaveBeenCalledWith({
        date: expect.any(String),
        description: 'New transaction',
        debit_account_id: 0,
        credit_account_id: 0,
        amount: 75.25,
        reference: ''
      });
    });
  });

  test('deletes ledger entry', async () => {
    const mockEntries = [
      {
        id: 1,
        date: '2024-01-01T00:00:00Z',
        description: 'Transaction to delete',
        debit_account_id: 1,
        credit_account_id: 2,
        amount: 50.00,
        user_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        debit_account: {
          id: 1,
          name: 'Debit Account',
          account_type: 'asset',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        credit_account: {
          id: 2,
          name: 'Credit Account',
          account_type: 'revenue',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'user',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      }
    ];

    mockAccountService.getAccounts.mockResolvedValue([]);
    mockLedgerService.getLedgerEntries.mockResolvedValue(mockEntries);
    mockLedgerService.deleteLedgerEntry.mockResolvedValue();

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Transaction to delete')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.getAttribute('aria-label') === 'Delete'
    );
    
    if (deleteButton) {
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this entry?');
        expect(mockLedgerService.deleteLedgerEntry).toHaveBeenCalledWith(1);
      });
    }
  });
});