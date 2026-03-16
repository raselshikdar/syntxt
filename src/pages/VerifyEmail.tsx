import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
            <Mail size={28} className="text-handle" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We've sent a verification link to your email address. Click it to activate your account and start using <span className="font-semibold text-foreground">syntxt_</span>.
          </p>
        </div>
        <div className="border border-border rounded-md p-4 bg-card">
          <p className="text-xs text-muted-foreground">
            Didn't receive it? Check your spam folder or try registering again.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/auth')}
          className="text-xs text-handle font-semibold hover:underline"
        >
          ← Back to Sign In
        </motion.button>
      </motion.div>
    </div>
  );
}
