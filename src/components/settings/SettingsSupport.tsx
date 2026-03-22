import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

export default function SettingsSupport({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);

  const handleSupportSubmit = async () => {
    if (!supportMessage.trim() || !user) return;
    setSendingSupport(true);
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
          <motion.button whileTap={{ scale: 0.85 }} onClick={onBack}>
            <ArrowLeft size={18} />
          </motion.button>
          <span className="text-sm font-bold">Support</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="border border-border rounded-md p-5 bg-card space-y-4">
          <h3 className="text-xs uppercase tracking-label text-muted-foreground font-semibold">Contact Support</h3>
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
      </div>
      <BottomNav />
    </div>
  );
}
