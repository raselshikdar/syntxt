import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Moon, Sun, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [handle, setHandle] = useState(profile?.handle ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = (profile as any)?.avatar_url
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${(profile as any).avatar_url}`
    : null;

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    
    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: path } as any)
      .eq('user_id', user.id);

    if (updateError) toast.error(updateError.message);
    else toast.success('Avatar updated!');
    setUploading(false);
    // Refresh page to show new avatar
    window.location.reload();
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
        {/* Avatar Section */}
        <div className="border border-border rounded-md p-5 bg-card space-y-4">
          <h3 className="text-xs uppercase tracking-label text-muted-foreground font-semibold">Avatar</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={profile?.handle} /> : null}
                <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground">
                  {profile?.handle?.slice(0, 2).toUpperCase() ?? '??'}
                </AvatarFallback>
              </Avatar>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 bg-fab text-fab-foreground rounded-full p-1.5"
              >
                <Camera size={12} />
              </motion.button>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Click the camera icon to upload a new photo.</p>
              <p className="mt-1">Max 2MB, JPG or PNG.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Profile Section */}
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
