import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import PostCard from '@/components/PostCard';
import { usePosts } from '@/hooks/usePosts';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ type: 'user'; handle: string }[]>([]);
  const { data: allPosts = [] } = usePosts();
  const navigate = useNavigate();

  const filteredPosts = query.trim()
    ? allPosts.filter(p => p.content.toLowerCase().includes(query.toLowerCase()) || p.handle.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    const { data } = await supabase.from('profiles').select('handle').ilike('handle', `%${q}%`).limit(5);
    setResults(data?.map(d => ({ type: 'user' as const, handle: d.handle })) ?? []);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        <div className="relative">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search users or posts..."
            className="w-full bg-card border border-border rounded-md pl-9 pr-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {results.length > 0 && (
          <div className="border border-border rounded-md bg-card divide-y divide-border">
            {results.map(r => (
              <motion.button
                key={r.handle}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/u/${r.handle}`)}
                className="w-full text-left px-4 py-3 text-sm text-handle font-semibold hover:bg-accent transition-colors"
              >
                @{r.handle}
              </motion.button>
            ))}
          </div>
        )}

        {query.trim() && (
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-label text-muted-foreground font-semibold">Posts</h3>
            {filteredPosts.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No matching posts.</p>
            ) : (
              filteredPosts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
