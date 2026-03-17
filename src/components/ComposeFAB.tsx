import { PenLine } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ComposeFAB({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      // পজিশন সামান্য নিচে (bottom-20) এবং ডানে (right-4) সরানো হয়েছে
      className="fixed bottom-20 right-4 w-14 h-14 bg-fab text-fab-foreground rounded-full shadow-brutalist flex items-center justify-center z-30"
      aria-label="Compose"
    >
      <PenLine size={22} />
    </motion.button>
  );
}
