import { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface VoiceInputProps {
  onResult: (text: string) => void;
}

// Languages supported by Web Speech API
const SUPPORTED_LANGS: Record<string, string> = {
  en: 'en-US',
};

const UNSUPPORTED_MSG = 'The system is still under development and will add this language soon.';

export default function VoiceInput({ onResult }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { t, language } = useLanguage();

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }

    // Check if language is supported
    if (language !== 'en' && !SUPPORTED_LANGS[language]) {
      toast.info(UNSUPPORTED_MSG);
      // Fall back to English recognition
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    // Use English as fallback for unsupported languages
    recognition.lang = SUPPORTED_LANGS[language] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: any) => {
      setIsProcessing(true);
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsProcessing(false);
      if (language !== 'en' && !SUPPORTED_LANGS[language]) {
        toast.info(UNSUPPORTED_MSG);
      }
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      setIsProcessing(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone access.');
      } else if (event.error === 'no-speech') {
        toast.error('No speech detected. Please try again.');
      }
    };

    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={startRecording}
      disabled={isRecording || isProcessing}
      className="relative"
      title={t('voiceInput')}
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isRecording ? (
        <>
          <MicOff className="w-4 h-4 text-destructive" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
        </>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
}
