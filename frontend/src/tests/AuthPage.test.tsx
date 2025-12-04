import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AuthPage from '../pages/AuthPage';
import { authService } from '../services/auth';

// Mock the authService
jest.mock('../services/auth');
const mockAuthService = authService as jest.Mocked<typeof authService>;

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

describe('AuthPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders login and register tabs', () => {
    renderWithProviders(<AuthPage />);
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Register' })).toBeInTheDocument();
  });

  test('switches between login and register tabs', () => {
    renderWithProviders(<AuthPage />);
    
    // Initially on login tab
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.queryByLabelText('Email Address')).not.toBeInTheDocument();
    
    // Switch to register tab
    fireEvent.click(screen.getByRole('tab', { name: 'Register' }));
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
  });

  test('successful login', async () => {
    mockAuthService.login.mockResolvedValue({
      access_token: 'test-token',
      token_type: 'bearer'
    });

    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };

    renderWithProviders(<AuthPage />);
    
    // Fill login form
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'testpassword' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'testpassword'
      });
    });

    await waitFor(() => {
      expect(window.location.href).toBe('/dashboard');
    });
  });

  test('failed login shows error', async () => {
    mockAuthService.login.mockRejectedValue({
      response: { data: { detail: 'Invalid credentials' } }
    });

    renderWithProviders(<AuthPage />);
    
    // Fill and submit login form
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'wronguser' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('successful registration', async () => {
    mockAuthService.register.mockResolvedValue({
      id: 1,
      username: 'newuser',
      email: 'newuser@example.com',
      full_name: 'New User',
      role: 'user',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z'
    });

    mockAuthService.login.mockResolvedValue({
      access_token: 'test-token',
      token_type: 'bearer'
    });

    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };

    renderWithProviders(<AuthPage />);
    
    // Switch to register tab
    fireEvent.click(screen.getByRole('tab', { name: 'Register' }));
    
    // Fill registration form
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'newuser' }
    });
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'newuser@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'New User' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'newpassword' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    
    await waitFor(() => {
      expect(mockAuthService.register).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'newuser@example.com',
        full_name: 'New User',
        password: 'newpassword'
      });
    });

    await waitFor(() => {
      expect(window.location.href).toBe('/dashboard');
    });
  });

  test('failed registration shows error', async () => {
    mockAuthService.register.mockRejectedValue({
      response: { data: { detail: 'Username already taken' } }
    });

    renderWithProviders(<AuthPage />);
    
    // Switch to register tab
    fireEvent.click(screen.getByRole('tab', { name: 'Register' }));
    
    // Fill and submit registration form
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'existinguser' }
    });
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'existing@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    
    await waitFor(() => {
      expect(screen.getByText('Username already taken')).toBeInTheDocument();
    });
  });
});