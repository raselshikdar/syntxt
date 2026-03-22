import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

export default function SettingsAppearance({ onBack }: { onBack: () => void }) {
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <motion.button whileTap={{ scale: 0.85 }} onClick={onBack}>
            <ArrowLeft size={18} />
          </motion.button>
          <span className="text-sm font-bold">Appearance</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="border border-border rounded-md p-5 bg-card">
          <h3 className="text-xs uppercase tracking-label text-muted-foreground font-semibold mb-4">Theme</h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleDark}
            className="flex items-center gap-3 text-sm text-foreground w-full py-2"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </div>
            {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </motion.button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
