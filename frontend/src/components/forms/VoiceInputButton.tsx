import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Volume2, Globe2, AlertCircle, Check } from 'lucide-react';
import { SPEECH_LOCALE_MAP, SupportedLanguage } from '../../lib/localization.js';

interface VoiceInputButtonProps {
  onTranscriptChange: (transcript: string) => void;
  currentValue?: string;
  className?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscriptChange,
  currentValue = '',
  className = '',
}) => {
  const { i18n } = useTranslation();
  const currentLangCode = (i18n.language || 'en').split('-')[0] as SupportedLanguage;

  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    SPEECH_LOCALE_MAP[currentLangCode] || 'en-IN'
  );
  const [liveInterim, setLiveInterim] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Sync speech recognition language when site language changes
  useEffect(() => {
    if (SPEECH_LOCALE_MAP[currentLangCode]) {
      setSelectedLanguage(SPEECH_LOCALE_MAP[currentLangCode]);
    }
  }, [currentLangCode]);

  const recognitionRef = useRef<any>(null);
  const currentValueRef = useRef(currentValue);
  const onTranscriptChangeRef = useRef(onTranscriptChange);

  useEffect(() => {
    currentValueRef.current = currentValue;
  }, [currentValue]);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage;

    recognition.onresult = (event: any) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
        } else {
          interimText += transcript;
        }
      }

      setLiveInterim(interimText);

      if (finalText.trim()) {
        const cur = currentValueRef.current;
        const newText = cur ? `${cur} ${finalText.trim()}` : finalText.trim();
        onTranscriptChangeRef.current(newText);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setSpeechError('Microphone permission denied. Please allow microphone access.');
      } else if (event.error !== 'no-speech') {
        setSpeechError(`Voice error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setLiveInterim('');
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [selectedLanguage]);

  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    setSpeechError(null);

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = selectedLanguage;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setSpeechError('Could not start microphone. Please check permissions.');
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Toggle Record Button */}
        <button
          type="button"
          onClick={toggleListening}
          aria-label={isListening ? "Stop voice recording" : "Start voice dictation"}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'
          }`}
          title={isListening ? 'Click to stop recording' : 'Click to dictate complaint'}
        >
          {isListening ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Listening... (Stop)</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-orange-600" />
              <span>Voice Dictation</span>
            </>
          )}
        </button>

        {/* Language Selector */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl px-2 py-1 text-[11px] font-medium border border-slate-200 text-slate-700">
          <Globe2 className="w-3 h-3 text-slate-500" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as any)}
            disabled={isListening}
            aria-label="Select voice recognition language"
            className="bg-transparent text-slate-800 text-[11px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 cursor-pointer"
          >
            <option value="en-IN">English (India)</option>
            <option value="ta-IN">தமிழ் (Tamil)</option>
            <option value="hi-IN">हिन्दी (Hindi)</option>
          </select>
        </div>

        {/* Visualizer Wave when recording */}
        {isListening && (
          <div className="flex items-center gap-1 text-[11px] text-red-600 font-semibold animate-pulse">
            <Volume2 className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-1 bg-red-500 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
              <span className="w-1 bg-red-500 rounded-full animate-bounce h-3" style={{ animationDelay: '150ms' }} />
              <span className="w-1 bg-red-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Speak now in your chosen language...</span>
          </div>
        )}
      </div>

      {/* Interim live preview text */}
      {liveInterim && (
        <div className="p-2 rounded-xl bg-orange-50/70 border border-orange-200 text-xs text-orange-950 font-serif italic flex items-center gap-2 animate-fadeIn">
          <Volume2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span>"{liveInterim}"</span>
        </div>
      )}

      {speechError && (
        <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span>{speechError}</span>
        </div>
      )}
    </div>
  );
};
