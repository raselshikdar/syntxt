import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // অটো ডিভাইস প্রিফারেন্স লজিক
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // যদি ইউজার আগে কখনো ম্যানুয়ালি সেট না করে থাকে (প্রথমবার ভিজিট)
    if (!savedTheme) {
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark');
        setDarkMode(true);
      } else {
        document.documentElement.classList.remove('dark');
        setDarkMode(false);
      }
    }
  }, []);

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  // স্ক্রল ট্র্যাকিং লজিক
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
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
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
