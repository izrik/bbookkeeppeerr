import api from './api';
import { Account, AccountCreate, LedgerEntry, LedgerEntryCreate, LedgerEntryWithAccounts } from '../types';

export const accountService = {
  async getAccounts(): Promise<Account[]> {
    const response = await api.get('/accounts/');
    return response.data;
  },

  async getAccount(id: number): Promise<Account> {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  async createAccount(account: AccountCreate): Promise<Account> {
    const response = await api.post('/accounts/', account);
    return response.data;
  },

  async updateAccount(id: number, account: AccountCreate): Promise<Account> {
    const response = await api.put(`/accounts/${id}`, account);
    return response.data;
  },

  async deleteAccount(id: number): Promise<void> {
    await api.delete(`/accounts/${id}`);
  },
};

export const ledgerService = {
  async getLedgerEntries(): Promise<LedgerEntryWithAccounts[]> {
    const response = await api.get('/ledger/');
    return response.data;
  },

  async getLedgerEntry(id: number): Promise<LedgerEntryWithAccounts> {
    const response = await api.get(`/ledger/${id}`);
    return response.data;
  },

  async createLedgerEntry(entry: LedgerEntryCreate): Promise<LedgerEntry> {
    const response = await api.post('/ledger/', entry);
    return response.data;
  },

  async updateLedgerEntry(id: number, entry: LedgerEntryCreate): Promise<LedgerEntry> {
    const response = await api.put(`/ledger/${id}`, entry);
    return response.data;
  },

  async deleteLedgerEntry(id: number): Promise<void> {
    await api.delete(`/ledger/${id}`);
  },
};