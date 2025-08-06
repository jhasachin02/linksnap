import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';

// Mock the hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('AuthForm', () => {
  const mockSignIn = vi.fn();
  const mockSignUp = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: vi.fn(),
    });
  });

  it('renders sign in form by default', () => {
    render(<AuthForm />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
  });

  it('switches to sign up form when clicked', async () => {
    const user = userEvent.setup();
    render(<AuthForm />);
    
    await user.click(screen.getByText(/don't have an account\?/i));
    
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
  });

  it('validates email input', async () => {
    const user = userEvent.setup();
    render(<AuthForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('validates password in sign up mode', async () => {
    const user = userEvent.setup();
    render(<AuthForm />);
    
    // Switch to sign up
    await user.click(screen.getByText(/don't have an account\?/i));
    
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, '123');
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<AuthForm />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button
    await user.click(toggleButton);
    
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('calls signIn with valid credentials', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ error: null });
    
    render(<AuthForm />);
    
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays error message on auth failure', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } });
    
    render(<AuthForm />);
    
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });
});
