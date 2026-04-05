import { useNavigate } from 'react-router-dom';
import { Plus, Search, Lightbulb, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import IdeaCard from '@/components/IdeaCard';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface Idea {
  id: string;
  title: string;
  description: string | null;
  language: string | null;
  feasibility_score: number | null;
  innovation_score: number | null;
  ai_summary: string | null;
  created_at: string;
}

export default function Home() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: ideas = [], isLoading } = useQuery<Idea[]>({
    queryKey: ['ideas', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ideas')
        .select('id, title, description, language, feasibility_score, innovation_score, ai_summary, created_at')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  // Sync offline queue when back online
  useEffect(() => {
    if (!isOnline || !user) return;
    const queue = JSON.parse(localStorage.getItem('ideavault_offline_queue') || '[]');
    if (queue.length === 0) return;
    const syncQueue = async () => {
      for (const item of queue) {
        try {
          await supabase.from('ideas').insert({ user_id: user.id, title: item.title, description: item.description, language: item.language });
        } catch { /* ignore */ }
      }
      localStorage.removeItem('ideavault_offline_queue');
      toast.success(`${queue.length} offline idea(s) synced!`);
      queryClient.invalidateQueries({ queryKey: ['ideas', user.id] });
    };
    syncQueue();
  }, [isOnline, user]);

  const filtered = ideas.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    (i.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">{t('myIdeas')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{ideas.length} ideas</p>
        </div>
        <Button size="sm" onClick={() => navigate('/create')} className="gap-1.5">
          <Plus className="w-4 h-4" />
          {t('newIdea')}
        </Button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t('searchIdeas')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Lightbulb className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-heading font-semibold text-foreground">{t('noIdeas')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('createFirst')}</p>
          <Button className="mt-4" onClick={() => navigate('/create')}>
            <Plus className="w-4 h-4 mr-1.5" />{t('newIdea')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(idea => (
            <IdeaCard
              key={idea.id}
              {...idea}
              onDelete={id => queryClient.setQueryData<Idea[]>(['ideas', user?.id], prev => prev?.filter(i => i.id !== id) ?? [])}
            />
          ))}
        </div>
      )}
    </div>
  );
}
