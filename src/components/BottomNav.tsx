import { Home, Search, Bell, Bookmark, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const items = [
  { icon: Home, path: '/', label: 'Home' },
  { icon: Search, path: '/search', label: 'Search' },
  { icon: Bell, path: '/notifications', label: 'Notifications' },
  { icon: Bookmark, path: '/saved', label: 'Saved' },
  { icon: Settings, path: '/settings', label: 'Settings' },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-nav border-t border-nav-border z-30 flex items-center justify-around max-w-2xl mx-auto">
      {items.map(({ icon: Icon, path, label }) => {
        const active = pathname === path;
        return (
          <motion.button
            key={path}
            whileTap={{ scale: 0.85 }}
            onClick={() => navigate(path)}
            className={`flex items-center justify-center p-2 transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`}
            aria-label={label}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
          </motion.button>
        );
      })}
    </nav>
  );
}
