import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Moon, Sun, Camera, ImageIcon, HelpCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const [fullName, setFullName] = useState((profile as any)?.full_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);

  const avatarUrl = profile?.avatar_url
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
    : null;

  const bannerUrl = (profile as any)?.banner_url
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/banners/${(profile as any).banner_url}`
    : null;

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  const uploadImage = async (file: File, bucket: string, pathPrefix: string, field: string) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${pathPrefix}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [field]: path } as any)
      .eq('user_id', user.id);

    if (updateError) toast.error(updateError.message);
    else toast.success('Image updated!');
    setUploading(false);
    window.location.reload();
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ bio, full_name: fullName } as any).eq('user_id', user.id);
    if (error) toast.error(error.message);
    else toast.success('Profile updated!');
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/welcome');
  };

  const handleSupportSubmit = async () => {
    if (!supportMessage.trim() || !user) return;
    setSendingSupport(true);
    // Store support message as a report with special type
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      post_id: null as any,
      reason: `[SUPPORT] ${supportMessage.trim()}`,
      status: 'pending',
    } as any);
    if (error) {
      toast.error('Failed to send. Please try again.');
    } else {
      toast.success('Support message sent! We will get back to you.');
      setSupportMessage('');
    }
    setSendingSupport(false);
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
        {/* Banner & Avatar Section */}
        <div className="border border-border rounded-md bg-card overflow-hidden">
          <div className="relative h-24 bg-gradient-to-r from-muted to-accent">
            {bannerUrl && (
              <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-2 right-2 bg-card/80 backdrop-blur-sm rounded-full p-1.5 text-muted-foreground hover:text-foreground"
            >
              <ImageIcon size={14} />
            </motion.button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'banners', 'banner', 'banner_url'); }}
              className="hidden"
            />
          </div>
          <div className="px-5 pb-5">
            <div className="flex items-end -mt-8">
              <div className="relative">
                <Avatar className="h-16 w-16 border-4 border-card">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={profile?.handle} /> : null}
                  <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground">
                    {profile?.handle?.slice(0, 2).toUpperCase() ?? '??'}
                  </AvatarFallback>
                </Avatar>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 bg-fab text-fab-foreground rounded-full p-1.5"
                >
                  <Camera size={12} />
                </motion.button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'avatars', 'avatar', 'avatar_url'); }}
                className="hidden"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">Click icons to update avatar or banner image.</p>
          </div>
        </div>

        {/* Profile Section */}
        <div className="border border-border rounded-md p-5 bg-card space-y-4">
          <h3 className="text-xs uppercase tracking-label text-muted-foreground font-semibold">Profile</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Handle</label>
              <div className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm font-mono text-muted-foreground mt-1 cursor-not-allowed">
                @{profile?.handle}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring mt-1"
                maxLength={50}
                placeholder="Your full name"
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

        {/* Support Section */}
        <div className="border border-border rounded-md p-5 bg-card space-y-4">
          <h3 className="text-xs uppercase tracking-label text-muted-foreground font-semibold flex items-center gap-1.5">
            <HelpCircle size={14} /> Support
          </h3>
          <p className="text-xs text-muted-foreground">Having an issue or need help? Send us a message.</p>
          <textarea
            value={supportMessage}
            onChange={e => setSupportMessage(e.target.value)}
            placeholder="Describe your issue..."
            className="w-full bg-background border border-border rounded-md p-3 text-sm font-mono resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring"
            maxLength={1000}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSupportSubmit}
            disabled={sendingSupport || !supportMessage.trim()}
            className="flex items-center gap-2 bg-fab text-fab-foreground px-5 py-2 rounded-md text-xs font-semibold uppercase tracking-label disabled:opacity-50"
          >
            <Send size={12} />
            {sendingSupport ? 'Sending...' : 'Send Message'}
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
