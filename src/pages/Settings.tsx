import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Palette, HelpCircle, ShieldCheck, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import BottomNav from '@/components/BottomNav';
import SettingsProfile from '@/components/settings/SettingsProfile';
import SettingsAppearance from '@/components/settings/SettingsAppearance';
import SettingsSupport from '@/components/settings/SettingsSupport';
import SettingsVerification from '@/components/settings/SettingsVerification';

type SubPage = null | 'profile' | 'appearance' | 'support' | 'verification';

const menuItems = [
  { key: 'profile' as const, icon: User, label: 'Edit Profile', desc: 'Name, bio, avatar & banner' },
  { key: 'appearance' as const, icon: Palette, label: 'Appearance', desc: 'Dark mode & theme' },
  { key: 'verification' as const, icon: ShieldCheck, label: 'Verification', desc: 'Get verified badge' },
  { key: 'support' as const, icon: HelpCircle, label: 'Support', desc: 'Report an issue or get help' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [subPage, setSubPage] = useState<SubPage>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/welcome');
  };

  if (subPage === 'profile') return <SettingsProfile onBack={() => setSubPage(null)} />;
  if (subPage === 'appearance') return <SettingsAppearance onBack={() => setSubPage(null)} />;
  if (subPage === 'support') return <SettingsSupport onBack={() => setSubPage(null)} />;
  if (subPage === 'verification') return <SettingsVerification onBack={() => setSubPage(null)} />;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </motion.button>
          <span className="text-sm font-bold">Settings</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-3">
        <div className="border border-border rounded-md bg-card divide-y divide-border overflow-hidden">
          {menuItems.map((item) => (
            <motion.button
              key={item.key}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSubPage(item.key)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <item.icon size={16} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </motion.button>
          ))}
        </div>

        <div className="border border-border rounded-md bg-card overflow-hidden">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <LogOut size={16} className="text-destructive" />
            </div>
            <p className="text-sm font-semibold text-destructive">Sign Out</p>
          </motion.button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
