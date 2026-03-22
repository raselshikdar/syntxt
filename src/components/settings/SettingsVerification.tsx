import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, ShieldCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import BottomNav from '@/components/BottomNav';
import VerifiedBadge from '@/components/VerifiedBadge';
import { toast } from 'sonner';

export default function SettingsVerification({ onBack }: { onBack: () => void }) {
  const { user, profile } = useAuth();
  const [docType, setDocType] = useState('national_id');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVerified = (profile as any)?.verified === true;

  const { data: existingRequest } = useQuery({
    queryKey: ['verification-request', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('verification_requests' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as any;
    },
    enabled: !!user,
  });

  const handleSubmit = async () => {
    if (!user || !selectedFile) return;
    setUploading(true);

    try {
      const ext = selectedFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-docs')
        .upload(path, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('verification_requests' as any)
        .insert({
          user_id: user.id,
          document_type: docType,
          document_url: path,
          description: description.trim(),
          status: 'pending',
        } as any);

      if (insertError) throw insertError;

      toast.success('Verification request submitted!');
      setSelectedFile(null);
      setDescription('');
    } catch (err: any) {
      toast.error('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle size={14} className="text-green-500" />;
    if (status === 'rejected') return <XCircle size={14} className="text-destructive" />;
    return <Clock size={14} className="text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <motion.button whileTap={{ scale: 0.85 }} onClick={onBack}>
            <ArrowLeft size={18} />
          </motion.button>
          <span className="text-sm font-bold">Verification</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        {isVerified ? (
          <div className="border border-border rounded-md p-5 bg-card flex items-center gap-3">
            <VerifiedBadge size={24} />
            <div>
              <p className="text-sm font-bold">Account Verified</p>
              <p className="text-xs text-muted-foreground">Your account is verified and the badge is visible on your profile.</p>
            </div>
          </div>
        ) : existingRequest?.status === 'pending' ? (
          <div className="border border-border rounded-md p-5 bg-card space-y-3">
            <div className="flex items-center gap-2">
              {statusIcon('pending')}
              <p className="text-sm font-bold">Request Pending</p>
            </div>
            <p className="text-xs text-muted-foreground">Your verification request is under review. We'll notify you once it's processed.</p>
            <p className="text-[10px] text-muted-foreground">Submitted: {new Date(existingRequest.created_at).toLocaleDateString()}</p>
          </div>
        ) : (
          <div className="border border-border rounded-md p-5 bg-card space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-muted-foreground" />
              <h3 className="text-xs uppercase tracking-label text-muted-foreground font-semibold">Apply for Verification</h3>
            </div>
            <p className="text-xs text-muted-foreground">Submit a government-issued ID to verify your identity.</p>

            {existingRequest?.status === 'rejected' && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  {statusIcon('rejected')}
                  <p className="text-xs font-semibold text-destructive">Previous request rejected</p>
                </div>
                {existingRequest.review_note && (
                  <p className="text-xs text-muted-foreground">{existingRequest.review_note}</p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground">Document Type</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring mt-1"
              >
                <option value="national_id">National ID Card</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Document Image</label>
              <div className="mt-1">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-muted border border-border rounded-md px-4 py-3 text-sm text-muted-foreground w-full hover:bg-accent transition-colors"
                >
                  <Upload size={16} />
                  {selectedFile ? selectedFile.name : 'Choose file...'}
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Description (optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Any additional information..."
                className="w-full bg-background border border-border rounded-md p-3 text-sm font-mono resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring mt-1"
                maxLength={500}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={uploading || !selectedFile}
              className="bg-fab text-fab-foreground px-5 py-2 rounded-md text-xs font-semibold uppercase tracking-label disabled:opacity-50"
            >
              {uploading ? 'Submitting...' : 'Submit Request'}
            </motion.button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
