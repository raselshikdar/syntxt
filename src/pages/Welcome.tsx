import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm space-y-8 text-center"
      >
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">syntxt_</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pure text. Raw context.<br />A microblogging platform for concise thoughts.
          </p>
        </div>

        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/auth?mode=register')}
            className="w-full bg-fab text-fab-foreground rounded-md px-4 py-3 text-xs font-semibold uppercase tracking-label hover:opacity-90 transition-opacity"
          >
            Create Account
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/auth?mode=login')}
            className="w-full border border-border rounded-md px-4 py-3 text-xs font-semibold uppercase tracking-label hover:bg-accent transition-colors"
          >
            Sign In
          </motion.button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-border" />
          <span className="text-[10px] uppercase tracking-label text-muted-foreground">or</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="text-sm text-handle font-semibold hover:underline"
        >
          Explore without an account →
        </motion.button>
      </motion.div>
    </div>
  );
}
