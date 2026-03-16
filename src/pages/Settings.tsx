import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [handle, setHandle] = useState(profile?.handle ?? '');
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ bio, handle }).eq('user_id', user.id);
    if (error) toast.error(error.message);
    else toast.success('Profile updated!');
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

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

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        <div className="border border-border rounded-md p-5 bg-card space-y-4">
          <h3 className="text-xs uppercase tracking-label text-muted-foreground font-semibold">Profile</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Handle</label>
              <input
                type="text"
                value={handle}
                onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring mt-1"
                maxLength={20}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring mt-1"
                maxLength={160}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              className="bg-fab text-fab-foreground px-5 py-2 rounded-md text-xs font-semibold uppercase tracking-label disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </div>

        <div className="border border-border rounded-md p-5 bg-card space-y-4">
          <h3 className="text-xs uppercase tracking-label text-muted-foreground font-semibold">Appearance</h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleDark}
            className="flex items-center gap-2 text-sm text-foreground"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </motion.button>
        </div>

        <div className="border border-border rounded-md p-5 bg-card">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-destructive font-semibold"
          >
            <LogOut size={16} />
            Sign Out
          </motion.button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
