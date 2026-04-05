import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lightbulb, Sparkles, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IdeaCardProps {
  id: string;
  title: string;
  description: string | null;
  language: string | null;
  feasibility_score: number | null;
  innovation_score: number | null;
  ai_summary: string | null;
  created_at: string;
  onDelete?: (id: string) => void;
}

export default function IdeaCard({ id, title, description, language, feasibility_score, innovation_score, ai_summary, created_at, onDelete }: IdeaCardProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const hasAI = !!ai_summary;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('confirmDelete') || 'Delete this idea?')) return;
    const { error } = await supabase.from('ideas').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete idea');
    } else {
      toast.success('Idea deleted');
      onDelete?.(id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/idea/${id}`)}
      className="group cursor-pointer rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-elevated"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-card-foreground truncate">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasAI && (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Sparkles className="w-3 h-3" /> AI
            </Badge>
          )}
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{description}</p>
      )}

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {language && (
          <Badge variant="outline" className="text-[10px]">{language.toUpperCase()}</Badge>
        )}
        {feasibility_score !== null && (
          <span className="text-[10px] text-muted-foreground">
            {t('feasibility')}: {feasibility_score}/10
          </span>
        )}
        {innovation_score !== null && (
          <span className="text-[10px] text-muted-foreground">
            {t('innovation')}: {innovation_score}/10
          </span>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {new Date(created_at).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  );
}
