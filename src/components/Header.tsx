import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  // ১. সরাসরি রিয়েল-টাইম চেক করে স্টেট সেট করা
  const [darkMode, setDarkMode] = useState(() => {
    // এটি রেন্ডারিং এর আগেই এক্সিকিউট হবে
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // ২. থিম অ্যাপ্লাই করার জন্য একটি ডেডিকেটেড ইফেক্ট
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDark = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // ৩. স্ক্রল ট্র্যাকিং (আপনার অরিজিনাল লজিক)
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 80) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  return (
    <header 
      className={`sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-2xl mx-auto grid grid-cols-3 items-center px-4 h-14">
        
        {/* বাম পাশ: ডার্ক মোড সুইচ */}
        <div className="flex justify-start">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleDark}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>
        </div>

        {/* মাঝখান: লোগো (Center) */}
        <div className="flex justify-center">
          <h1 
            className="text-base font-bold tracking-tight cursor-pointer whitespace-nowrap" 
            onClick={() => navigate('/')}
          >
            syntxt_
          </h1>
        </div>

        {/* ডান পাশ: ইউজার হ্যান্ডেল বা সাইন ইন */}
        <div className="flex justify-end">
          {user && profile ? (
            <span
              onClick={() => navigate(`/u/${profile.handle}`)}
              className="text-xs text-handle font-semibold cursor-pointer hover:underline truncate max-w-[100px]"
            >
              @{profile.handle}
            </span>
          ) : !user ? (
            <span
              onClick={() => navigate('/auth?mode=login')}
              className="text-xs text-handle font-semibold cursor-pointer hover:underline"
            >
              Sign In
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
