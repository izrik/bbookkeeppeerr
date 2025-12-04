export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role?: 'admin' | 'user';
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Account {
  id: number;
  name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  description?: string;
  account_number?: string;
  is_active: boolean;
  created_at: string;
}

export interface AccountCreate {
  name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  description?: string;
  account_number?: string;
}

export interface LedgerEntry {
  id: number;
  date: string;
  description: string;
  debit_account_id: number;
  credit_account_id: number;
  amount: number;
  reference?: string;
  user_id: number;
  created_at: string;
}

export interface LedgerEntryCreate {
  date: string;
  description: string;
  debit_account_id: number;
  credit_account_id: number;
  amount: number;
  reference?: string;
}

export interface LedgerEntryWithAccounts extends LedgerEntry {
  debit_account: Account;
  credit_account: Account;
  user: User;
}