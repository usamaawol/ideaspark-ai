import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Sparkles, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import VoiceInput from '@/components/VoiceInput';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';

const DRAFT_KEY = 'ideavault_draft';

export default function CreateIdea() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const { title: t, description: d } = JSON.parse(draft);
        if (t) setTitle(t);
        if (d) setDescription(d);
      } catch { /* ignore */ }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (title || description) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, description }));
    }
  }, [title, description]);

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  const handleSave = async (analyze = false) => {
    if (!user || !title.trim()) return;

    // Offline: save to localStorage queue
    if (!isOnline) {
      const queue = JSON.parse(localStorage.getItem('ideavault_offline_queue') || '[]');
      queue.push({ title: title.trim(), description: description.trim() || null, language, savedAt: Date.now() });
      localStorage.setItem('ideavault_offline_queue', JSON.stringify(queue));
      clearDraft();
      setTitle('');
      setDescription('');
      toast.success('Idea saved offline! It will sync when you reconnect.');
      navigate('/');
      return;
    }

    if (analyze) setAnalyzing(true);
    else setSaving(true);

    try {
      const { data: idea, error } = await supabase
        .from('ideas')
        .insert({ user_id: user.id, title: title.trim(), description: description.trim() || null, language })
        .select().single();

      if (error) throw error;

      if (analyze && idea) {
        try {
          const { data: aiData, error: aiError } = await supabase.functions.invoke('analyze-idea', {
            body: { ideaId: idea.id, title: idea.title, description: idea.description, language },
          });
          if (aiError) throw aiError;
          if (aiData) {
            await supabase.from('ideas').update({
              ai_summary: aiData.summary, ai_suggestions: aiData.suggestions,
              ai_features: aiData.features, ai_evaluation: aiData.evaluation,
              ai_market_check: aiData.marketCheck, feasibility_score: aiData.feasibilityScore,
              innovation_score: aiData.innovationScore,
            }).eq('id', idea.id);
          }
        } catch (aiErr) {
          toast.error('AI analysis failed, but your idea was saved.');
        }
      }

      clearDraft();
      toast.success('Idea saved!');
      navigate(`/idea/${idea.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save idea');
    } finally {
      setSaving(false);
      setAnalyzing(false);
    }
  };

  const handleVoiceResult = (text: string) => {
    if (!title) setTitle(text);
    else setDescription((prev) => (prev ? prev + ' ' + text : text));
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading text-xl font-bold text-foreground">{t('newIdea')}</h1>
          {!isOnline && <WifiOff className="w-4 h-4 text-yellow-500 ml-auto" />}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t('title')}</label>
            <div className="flex gap-2">
              <Input
                placeholder={t('title')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1"
              />
              <VoiceInput onResult={handleVoiceResult} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t('description')}</label>
            <Textarea
              placeholder={t('description')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleSave(false)}
              disabled={!title.trim() || saving || analyzing}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {t('save')}
            </Button>
            <Button
              className="flex-1 gap-1.5"
              onClick={() => handleSave(true)}
              disabled={!title.trim() || saving || analyzing || !isOnline}
              title={!isOnline ? 'AI features require internet' : ''}
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Sparkles className="w-4 h-4" />}
              {analyzing ? t('analyzing') : t('analyze')}
            </Button>
          </div>
          {!isOnline && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
              Offline mode — idea will be saved locally and synced when online.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
