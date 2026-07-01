import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Briefcase, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/api';
import Toast from '../components/Toast';

export const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setToast({ message: 'Please enter both username and password.', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const data = await loginApi(username, password);
      login(data.token, data.user);
      setToast({ message: 'Login successful! Redirecting...', type: 'success' });
      
      // Delay navigation slightly so they see the success toast
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1000);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glowing blobs */}
      <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] rounded-full bg-brand-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full bg-emerald-600/5 blur-[120px] pointer-events-none" />

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors duration-150 py-2 px-3 rounded-lg hover:bg-slate-900/60"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Search
      </button>

      {/* Login Box */}
      <div className="w-full max-w-md glass-panel rounded-3xl overflow-hidden shadow-2xl relative border-slate-800 animate-scale-up">
        {/* Accent strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 to-brand-400" />
        
        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/25 mb-4">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Admin Portal Login</h2>
            <p className="text-xs text-slate-500 mt-1">Authenticate to access the administrative panel</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Username</label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full !pl-10 pr-4 py-2.5 glass-input text-sm text-white"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full !pl-10 pr-11 py-2.5 glass-input text-sm text-white"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 text-slate-500 hover:text-slate-350 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all active:scale-98 duration-200 shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminLogin;
