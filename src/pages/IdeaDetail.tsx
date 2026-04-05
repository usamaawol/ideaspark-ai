import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Image as ImageIcon, FileDown, Expand,
  Loader2, Trash2, Clock, Languages, Pencil, Wand2, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { LANGUAGES } from '@/lib/i18n';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Idea {
  id: string; title: string; description: string | null;
  ai_summary: string | null; ai_suggestions: string | null;
  ai_features: string | null; ai_evaluation: string | null;
  ai_market_check: string | null; ai_expanded: string | null;
  generated_image_url: string | null; language: string | null;
  feasibility_score: number | null; innovation_score: number | null;
  version: number | null; created_at: string; updated_at: string;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{score}/10</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${score * 10}%` }} />
      </div>
    </div>
  );
}

function AISection({ title, content, icon }: { title: string; content: string; icon: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 w-full text-left">
        {icon}
        <span className="font-heading text-sm font-semibold text-card-foreground">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>}
    </div>
  );
}

const FALLBACK_MSG = 'AI service temporarily unavailable. Please try again.';

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [analyzing, setAnalyzing] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updating, setUpdating] = useState(false);

  const { data: idea, isLoading } = useQuery<Idea>({
    queryKey: ['idea', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('ideas').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['idea-versions', id],
    queryFn: async () => {
      const { data } = await supabase.from('idea_versions').select('*').eq('idea_id', id!).order('version', { ascending: false });
      return data || [];
    },
    enabled: !!user && !!id,
    staleTime: 1000 * 60 * 10,
  });

  const updateIdea = (patch: Partial<Idea>) => {
    queryClient.setQueryData<Idea>(['idea', id], prev => prev ? { ...prev, ...patch } : prev);
  };

  const isProcessing = analyzing || generatingImage || expanding || translating || generatingPrompt;

  const handleUpdate = async () => {
    if (!idea || !editTitle.trim()) return;
    setUpdating(true);
    try {
      await supabase.from('ideas').update({ title: editTitle.trim(), description: editDescription.trim() || null }).eq('id', idea.id);
      updateIdea({ title: editTitle.trim(), description: editDescription.trim() || null });
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      setIsEditing(false);
      toast.success('Idea updated!');
    } catch (err: any) { toast.error(err?.message || 'Failed to update'); }
    setUpdating(false);
  };

  const handleAnalyze = async () => {
    if (!idea) return;
    setAnalyzing(true);
    try {
      const { data: aiData, error } = await supabase.functions.invoke('analyze-idea', {
        body: { title: idea.title, description: idea.description, language: idea.language || language },
      });
      if (error) throw error;
      if (aiData?.error) throw new Error(aiData.error);
      if (aiData) {
        const patch = {
          ai_summary: aiData.summary, ai_suggestions: aiData.suggestions,
          ai_features: aiData.features, ai_evaluation: aiData.evaluation,
          ai_market_check: aiData.marketCheck, feasibility_score: aiData.feasibilityScore,
          innovation_score: aiData.innovationScore,
        };
        await supabase.from('ideas').update(patch).eq('id', idea.id);
        updateIdea(patch);
        toast.success('Analysis complete!');
      }
    } catch (err: any) { toast.error(err?.message || FALLBACK_MSG); }
    setAnalyzing(false);
  };

  const handleExpand = async () => {
    if (!idea) return;
    setExpanding(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-idea', {
        body: { title: idea.title, description: idea.description, language: idea.language || language, mode: 'expand' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.expanded) {
        await supabase.from('ideas').update({ ai_expanded: data.expanded }).eq('id', idea.id);
        updateIdea({ ai_expanded: data.expanded });
        toast.success('Idea expanded!');
      }
    } catch (err: any) { toast.error(err?.message || FALLBACK_MSG); }
    setExpanding(false);
  };

  const handleTranslate = async (targetLang: string) => {
    if (!idea) return;
    setShowTranslateModal(false);
    setTranslating(true);
    setTranslatedText(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-idea', {
        body: { title: idea.title, description: idea.description, language: idea.language || language, mode: 'translate', targetLanguage: targetLang },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.translated) { setTranslatedText(data.translated); toast.success('Translation complete!'); }
    } catch (err: any) { toast.error(err?.message || FALLBACK_MSG); }
    setTranslating(false);
  };

  const handleGenerateImage = async () => {
    if (!idea) return;
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { title: idea.title, description: idea.description },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        await supabase.from('ideas').update({ generated_image_url: data.imageUrl }).eq('id', idea.id);
        updateIdea({ generated_image_url: data.imageUrl });
        toast.success('Image generated!');
      }
    } catch (err: any) { toast.error(err?.message || 'Image generation failed, please try again'); }
    setGeneratingImage(false);
  };

  const handleGeneratePrompt = async () => {
    if (!idea) return;
    setGeneratingPrompt(true);
    setGeneratedPrompt(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-prompt', {
        body: { title: idea.title, description: idea.description, language: idea.language || language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.prompt) { setGeneratedPrompt(data.prompt); toast.success('Prompt generated!'); }
    } catch (err: any) { toast.error(err?.message || FALLBACK_MSG); }
    setGeneratingPrompt(false);
  };

  const handleCopyPrompt = async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (!idea) return;
    const doc = new jsPDF();
    let y = 20;
    const addSection = (title: string, content: string | null) => {
      if (!content) return;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text(title, 14, y); y += 7;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(content, 180);
      lines.forEach((line: string) => { if (y > 280) { doc.addPage(); y = 20; } doc.text(line, 14, y); y += 5; });
      y += 6;
    };
    doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.text(idea.title, 14, y); y += 12;
    if (generatedPrompt) addSection('AI Generated Prompt', generatedPrompt);
    addSection('Description', idea.description);
    addSection('AI Summary', idea.ai_summary);
    addSection('Suggestions', idea.ai_suggestions);
    addSection('Features', idea.ai_features);
    addSection('Evaluation', idea.ai_evaluation);
    addSection('Market Check', idea.ai_market_check);
    addSection('Expanded Idea', idea.ai_expanded);
    if (idea.feasibility_score !== null) addSection('Scores', `Feasibility: ${idea.feasibility_score}/10\nInnovation: ${idea.innovation_score}/10`);
    doc.save(`${idea.title.replace(/\s+/g, '_')}_prompt.pdf`);
  };

  const handleDelete = async () => {
    if (!idea || !confirm(t('confirmDelete'))) return;
    await supabase.from('ideas').delete().eq('id', idea.id);
    queryClient.invalidateQueries({ queryKey: ['ideas'] });
    toast.success('Idea deleted');
    navigate('/');
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!idea) return <div className="flex justify-center py-20 text-muted-foreground">Idea not found</div>;

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        {isEditing
          ? <span className="font-heading text-sm font-medium text-muted-foreground">{t('editing')}</span>
          : <h1 className="font-heading text-lg font-bold text-foreground flex-1 truncate">{idea.title}</h1>
        }
        <div className="flex gap-1 ml-auto">
          {!isEditing && <Button variant="ghost" size="icon" onClick={() => { setIsEditing(true); setEditTitle(idea.title); setEditDescription(idea.description || ''); }}><Pencil className="w-4 h-4" /></Button>}
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3 mb-4 rounded-xl border border-border bg-card p-4">
          <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder={t('title')} />
          <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder={t('description')} rows={4} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleUpdate} disabled={updating || !editTitle.trim()} className="gap-1.5">
              {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{t('updateIdea')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>{t('cancel')}</Button>
          </div>
        </div>
      ) : (
        idea.description && <p className="text-sm text-muted-foreground mb-4">{idea.description}</p>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {idea.language && <Badge variant="outline">{idea.language.toUpperCase()}</Badge>}
        {idea.version && <Badge variant="secondary">v{idea.version}</Badge>}
        <span className="text-xs text-muted-foreground ml-auto">{new Date(idea.created_at).toLocaleDateString()}</span>
      </div>

      {(idea.feasibility_score !== null || idea.innovation_score !== null) && (
        <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3">
          {idea.feasibility_score !== null && <ScoreBar label={t('feasibility')} score={idea.feasibility_score} />}
          {idea.innovation_score !== null && <ScoreBar label={t('innovation')} score={idea.innovation_score} />}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {idea.ai_summary && <AISection title={t('aiSummary')} content={idea.ai_summary} icon={<Sparkles className="w-4 h-4 text-primary" />} />}
        {idea.ai_suggestions && <AISection title={t('suggestions')} content={idea.ai_suggestions} icon={<Sparkles className="w-4 h-4 text-accent" />} />}
        {idea.ai_features && <AISection title={t('features')} content={idea.ai_features} icon={<Sparkles className="w-4 h-4 text-primary" />} />}
        {idea.ai_evaluation && <AISection title={t('evaluation')} content={idea.ai_evaluation} icon={<Sparkles className="w-4 h-4 text-accent" />} />}
        {idea.ai_market_check && <AISection title={t('marketCheck')} content={idea.ai_market_check} icon={<Sparkles className="w-4 h-4 text-primary" />} />}
        {idea.ai_expanded && <AISection title={t('expandIdea')} content={idea.ai_expanded} icon={<Expand className="w-4 h-4 text-accent" />} />}
      </div>

      {translatedText && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Languages className="w-4 h-4 text-primary" />
            <span className="font-heading text-sm font-semibold text-foreground">{t('translate')}</span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{translatedText}</p>
        </div>
      )}

      {generatedPrompt && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-accent" />
              <span className="font-heading text-sm font-semibold text-foreground">{t('generatePrompt')}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCopyPrompt} className="gap-1 h-7 text-xs">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">{generatedPrompt}</p>
        </div>
      )}

      {idea.generated_image_url && (
        <div className="rounded-xl border border-border overflow-hidden mb-4">
          <img src={idea.generated_image_url} alt={idea.title} className="w-full object-cover" loading="lazy" />
          <div className="p-2 flex justify-end bg-card">
            <a href={idea.generated_image_url} download={`${idea.title.replace(/\s+/g, '_')}.png`}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors">
              <FileDown className="w-3.5 h-3.5" />Save Image
            </a>
          </div>
        </div>
      )}

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isProcessing} className="gap-1.5">
          {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {analyzing ? t('analyzing') : t('analyze')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExpand} disabled={isProcessing} className="gap-1.5">
          {expanding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Expand className="w-3.5 h-3.5" />}
          {t('expandIdea')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleGenerateImage} disabled={isProcessing} className="gap-1.5">
          {generatingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
          {t('generateImage')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowTranslateModal(true)} disabled={isProcessing} className="gap-1.5">
          {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
          {t('translate')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleGeneratePrompt} disabled={isProcessing} className="gap-1.5">
          {generatingPrompt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          {generatingPrompt ? t('generatingPrompt') : t('generatePrompt')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1.5">
          <FileDown className="w-3.5 h-3.5" />{t('downloadPdf')}
        </Button>
      </div>

      <Dialog open={showTranslateModal} onOpenChange={setShowTranslateModal}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{t('translate')}</DialogTitle>
            <DialogDescription>Select target language</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 pt-2">
            {LANGUAGES.map(lang => (
              <Button key={lang.code} variant="outline" className="justify-start gap-2"
                onClick={() => handleTranslate(lang.code)} disabled={lang.code === (idea.language || language)}>
                <span className="font-medium">{lang.nativeLabel}</span>
                <span className="text-muted-foreground text-xs">({lang.label})</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {versions.length > 0 && (
        <div>
          <button onClick={() => setShowVersions(!showVersions)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Clock className="w-4 h-4" />{t('versionHistory')} ({versions.length})
          </button>
          {showVersions && (
            <div className="mt-2 space-y-2">
              {versions.map((v: any) => (
                <div key={v.id} className="rounded-lg border border-border bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">v{v.version} - {v.title}</span>
                    <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</span>
                  </div>
                  {v.description && <p className="text-xs text-muted-foreground mt-1">{v.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
