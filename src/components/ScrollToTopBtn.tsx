import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScrollToTopBtn() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // ৩০০ পিক্সেল স্ক্রল করলে বাটন দেখাবে
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
          // initial, animate এবং exit কে আরও স্মুথ করা হয়েছে
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 260,
              damping: 20
            }
          }}
          exit={{ 
            opacity: 0, 
            y: 10, 
            scale: 0.9,
            transition: { duration: 0.2 } 
          }}
          whileTap={{ scale: 0.92 }}
          onClick={scrollToTop}
          
          // বর্ডারকে আরও উজ্জ্বল করার জন্য 'border-current/80' ব্যবহার করা হয়েছে
          // এটি ডার্ক মোডে সাদা (text-foreground) কালার ব্যবহার করবে বর্ডারের জন্য
          className="fixed bottom-20 left-4 w-10 h-10 bg-background/30 backdrop-blur-md border border-current/80 text-foreground rounded-full shadow-sm flex items-center justify-center z-30 transition-colors hover:bg-background/60 hover:border-current/100"
          aria-label="Scroll up"
        >
          <ChevronUp size={20} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
