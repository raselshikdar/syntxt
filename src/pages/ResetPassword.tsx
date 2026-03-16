import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else setMessage('Password updated. You can now sign in.');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
        <h1 className="text-xl font-bold tracking-tight text-center">Reset Password</h1>
        <form onSubmit={handleReset} className="space-y-3">
          <input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-card border border-border rounded-md px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          {error && <p className="text-xs text-destructive">{error}</p>}
          {message && <p className="text-xs text-handle">{message}</p>}
          <motion.button whileTap={{ scale: 0.95 }} type="submit"
            className="w-full bg-fab text-fab-foreground rounded-md px-4 py-2.5 text-xs font-semibold uppercase tracking-label">
            Update Password
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
