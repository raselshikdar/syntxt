import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScrollToTopBtn() {
  const [isVisible, setIsVisible] = useState(false);

  // ৩০০ পিক্সেল স্ক্রল করলে বাটনটি দেখাবে
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={scrollToTop}
          // bg-background/30 এবং backdrop-blur দিয়ে সেমি-ট্রান্সপারেন্ট করা হয়েছে
          // text-[#1A1A1A] দিয়ে আইকন কালার ব্ল্যাকিশ করা হয়েছে
          className="fixed bottom-20 left-4 w-10 h-10 bg-background/30 backdrop-blur-md border border-border/50 text-[#1A1A1A] rounded-full shadow-sm flex items-center justify-center z-30 transition-all hover:bg-background/60"
          aria-label="Scroll up"
        >
          <ChevronUp size={20} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
