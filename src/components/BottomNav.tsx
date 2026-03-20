import { Home, Search, MessageCircle, Bell, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useUnreadMessagesCount } from '@/hooks/useMessages';

const items = [
  { icon: Home, path: '/', label: 'Home' },
  { icon: Search, path: '/search', label: 'Search' },
  { icon: MessageCircle, path: '/messages', label: 'Messages' },
  { icon: Bell, path: '/notifications', label: 'Notifications' },
  { icon: Settings, path: '/settings', label: 'Settings' },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { count: unreadCount } = useUnreadCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-nav border-t border-nav-border z-30 flex items-center justify-around max-w-2xl mx-auto">
      {items.map(({ icon: Icon, path, label }) => {
        const active = pathname === path;
        const showBadge = path === '/notifications' && unreadCount > 0;
        return (
          <motion.button
            key={path}
            whileTap={{ scale: 0.85 }}
            onClick={() => navigate(path)}
            className={`relative flex items-center justify-center p-2 transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`}
            aria-label={label}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
            {showBadge && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
