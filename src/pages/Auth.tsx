import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!handle || handle.length < 3) {
          setError('Handle must be at least 3 characters.');
          setLoading(false);
          return;
        }
        const { data: existing } = await supabase.from('profiles').select('handle').eq('handle', handle).maybeSingle();
        if (existing) {
          setError('This handle is already taken.');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { handle, full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        navigate('/verify-email');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage('Password reset link sent! Check your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold tracking-tight">syntxt_</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-label">Reset your password</p>
          </div>
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <input
              type="email"
              placeholder="email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              className="w-full bg-card border border-border rounded-md px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            {message && <p className="text-xs text-handle">{message}</p>}
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading}
              className="w-full bg-fab text-fab-foreground rounded-md px-4 py-2.5 text-xs font-semibold uppercase tracking-label hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '...' : 'Send Reset Link'}
            </motion.button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            <button onClick={() => { setShowForgot(false); setError(''); setMessage(''); }} className="text-handle font-semibold hover:underline">
              Back to Sign In
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold tracking-tight">syntxt_</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-label">
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-card border border-border rounded-md px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                maxLength={50}
              />
              <input
                type="text"
                placeholder="@handle"
                value={handle}
                onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full bg-card border border-border rounded-md px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                maxLength={20}
              />
            </>
          )}
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-card border border-border rounded-md px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-card border border-border rounded-md px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />

          {error && <p className="text-xs text-destructive">{error}</p>}
          {message && <p className="text-xs text-handle">{message}</p>}

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full bg-fab text-fab-foreground rounded-md px-4 py-2.5 text-xs font-semibold uppercase tracking-label hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </motion.button>
        </form>

        {mode === 'login' && (
          <p className="text-center text-xs text-muted-foreground">
            <button onClick={() => { setShowForgot(true); setError(''); setMessage(''); }} className="text-handle font-semibold hover:underline">
              Forgot password?
            </button>
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage(''); }}
            className="text-handle font-semibold hover:underline"
          >
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
