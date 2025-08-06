import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bookmark, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { validateEmail, validatePassword, RateLimiter } from '../utils/validation';
import { getErrorMessage } from '../utils/errors';

export const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();
  const rateLimiter = new RateLimiter(5, 60000); // 5 attempts per minute

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }

    if (isSignUp) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.error;
      }
    } else if (!password.trim()) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    setError('');
    if (!resetEmail) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) {
      setError(error.message);
    } else {
      setResetMsg('Password reset email sent! Check your inbox.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Rate limiting
    const userKey = email.toLowerCase();
    if (!rateLimiter.isAllowed(userKey)) {
      setError('Too many attempts. Please try again in a minute.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      rateLimiter.recordAttempt(userKey);

      const emailValidation = validateEmail(email);
      const sanitizedEmail = emailValidation.sanitized!;

      const { error, data } = isSignUp 
        ? await signUp(sanitizedEmail, password)
        : await signIn(sanitizedEmail, password);

      if (error) {
        // Show full error details for debugging
        setError(`${getErrorMessage(error)}\nStatus: ${error.status || ''}\nName: ${error.name || ''}`);
      } else if (!data?.session && !data?.user) {
        setError('No session or user returned. Check Supabase Auth settings.');
      }
    } catch (err: any) {
      setError(`Unexpected error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Bookmark className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            BookmarkAI
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Save and summarize your bookmarks with AI
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {showReset ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email address
                </label>
                <input
                  id="reset-email"
                  name="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors border-gray-300 dark:border-gray-600"
                  placeholder="Enter your email"
                />
              </div>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                </div>
              )}
              {resetMsg && (
                <div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-600 dark:text-green-300">{resetMsg}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setShowReset(false); setError(''); setResetMsg(null); }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                    validationErrors.email 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your email"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                      validationErrors.password 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                {loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
              </button>

              <div className="text-center flex flex-col gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};