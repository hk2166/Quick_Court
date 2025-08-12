import React, { useState, useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, Eye, EyeOff, Loader } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState<'admin' | 'member'>('member');
  const [fadeIn, setFadeIn] = useState(false);
  
  // Trigger fade-in animation after component mounts
  useEffect(() => {
    setFadeIn(true);
  }, []);

  const { login, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isAuthenticated && user) {
    const dashboardPaths = {
      user: '/home',
      customer: '/home',
      facility_owner: '/owner/dashboard',
      admin: '/admin/dashboard',
    };
    const from = location.state?.from || dashboardPaths[user.role];
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      console.log('Login attempt with:', email);
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password. Make sure you have registered and verified your email.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 page-transition">
      <div className={`max-w-md w-full space-y-8 ${fadeIn ? 'fade-in' : 'opacity-0'}`}>
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center slide-in-up">
          <div className="p-3 bg-blue-600 rounded-2xl hover-scale">
            <Trophy className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-3xl font-bold text-gray-900 slide-in-up stagger-1">Welcome to QuickCourt</h2>
        <p className="mt-2 text-gray-600 slide-in-up stagger-2">
          {loginMode === 'admin' ? 'Admin access' : 'Sign in to your account'}
        </p>
        </div>

        {/* Mode Switch */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between slide-in-up stagger-3">
          <button
            type="button"
            onClick={() => setLoginMode('admin')}
            className={`w-1/2 py-3 text-sm font-medium rounded-lg transition-colors ripple ${
              loginMode === 'admin'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Login as Admin
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('member')}
            className={`w-1/2 py-3 text-sm font-medium rounded-lg transition-colors ripple ${
              loginMode === 'member'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Owners & Customers
          </button>
        </div>

        {/* Context note */}
        {loginMode === 'admin' ? (
          <div className="text-xs text-center text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            For authorized administrators only. Use your admin credentials.
          </div>
        ) : (
          <div className="text-xs text-center text-gray-600">
            Sign in as a facility owner or customer.
          </div>
        )}
        {/* Login Form */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-gray-100 slide-in-up stagger-4 card-hover" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm fade-in">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {loginMode === 'admin' ? 'Admin email' : 'Email address'}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={loginMode === 'admin' ? 'Enter admin email' : 'Enter your email'}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                  placeholder={loginMode === 'admin' ? 'Enter admin password' : 'Enter your password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ripple hover-lift"
          >
            {loading ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              loginMode === 'admin' ? 'Sign in as Admin' : 'Sign in'
            )}
          </button>

          {loginMode === 'member' && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up
                </Link>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}