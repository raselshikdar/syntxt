import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function GuestBottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-nav border-t border-nav-border z-30 flex items-center justify-center gap-6 max-w-2xl mx-auto">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/auth?mode=login')}
        className="text-xs font-semibold uppercase tracking-label text-foreground hover:text-handle transition-colors px-4 py-2"
      >
        Sign In
      </motion.button>
      <div className="w-px h-5 bg-border" />
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/auth?mode=register')}
        className="text-xs font-semibold uppercase tracking-label text-handle hover:underline px-4 py-2"
      >
        Sign Up
      </motion.button>
    </nav>
  );
}
