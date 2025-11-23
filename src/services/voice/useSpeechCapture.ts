
// src/services/voice/useSpeechCapture.ts
// Robust speech capture hook that imports the central parser (./parser)
// - Stable single recognizer instance
// - Auto-restart with backoff (unless fatal error)
// - Works with Chrome; Brave needs Shields relaxed (we surface clear errors)
// - No parser duplication (uses parsePhrase from ./parser)

import { useCallback, useEffect, useRef, useState } from 'react';
import { parsePhrase } from './parser'; // <-- adjust path if your parser is elsewhere

// Local minimal event/recognizer types (avoid DOM typing inconsistencies)
type SRAlt = { transcript: string; confidence?: number };
type SRResult = { isFinal: boolean; length: number; [index: number]: SRAlt };
type SRResultList = { length: number; [index: number]: SRResult };
type SRResultEvent = Event & { resultIndex: number; results: SRResultList };

interface ISpeechRecognition {
  start(): void;
  stop(): void;
  abort?(): void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart?: () => void;
  onresult?: (ev: SRResultEvent) => void;
  onerror?: (ev: any) => void;
  onend?: () => void;
}
interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

// Public typed event we expose to the UI
export type VoiceEvent = {
  ts: number;
  raw: string;
  parsed: ReturnType<typeof parsePhrase>;
};

export function useSpeechCapture(lang: string = 'en-GB') {
  // Resolve platform constructor (webkit on Safari/iOS)
  const SRClass: SpeechRecognitionConstructor | undefined =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const recRef = useRef<ISpeechRecognition | null>(null);
  const keepAliveRef = useRef(false);
  const startingRef = useRef(false);
  const backoffRef = useRef(250);
  const lastStartRef = useRef(0);
  const failCountRef = useRef(0);

  const [listening, setListening] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<VoiceEvent[]>([]);

  const ensureRecognizer = useCallback(() => {
    if (!SRClass) {
      setError('SpeechRecognition not supported by this browser.');
      return null;
    }
    if (!recRef.current) {
      const rec = new SRClass();
      rec.lang = lang;
      rec.continuous = true;       // stream results while possible
      rec.interimResults = false;  // only final results
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        backoffRef.current = 250;
        setListening(true);
        setError(null);
        lastStartRef.current = Date.now();
      };

      rec.onresult = (e: SRResultEvent) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) {
            const raw = (res[0]?.transcript || '').trim();
            const parsed = parsePhrase(raw); // <-- use the shared parser
            setEvents(prev => [...prev, { ts: Date.now(), raw, parsed }]);
          }
        }
      };

      rec.onerror = (e: any) => {
        const code = e?.error || 'unknown';
        // Treat these as fatal (stop auto-restart)
        if (code === 'network' || code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture') {
          keepAliveRef.current = false;
          setActive(false);
          setListening(false);
          setError(
            code === 'network'
              ? 'Speech service unreachable (network). In Brave, relax Shields; ensure https or localhost.'
              : code === 'not-allowed'
              ? 'Microphone permission denied.'
              : code === 'service-not-allowed'
              ? 'Speech service not allowed on this origin. Use https (or localhost) and Chrome/Edge.'
              : 'No microphone detected or it’s in use by another app.'
          );
          try { rec.abort?.(); } catch {}
        } else {
          // Non-fatal: show but allow onend to handle restart
          setError(code);
        }
      };

      rec.onend = () => {
        setListening(false);
        const msAlive = Date.now() - lastStartRef.current;
        const quick = msAlive < 1000; // ended too fast

        if (keepAliveRef.current) {
          if (quick) {
            failCountRef.current += 1;
            if (failCountRef.current >= 3) {
              // Give up to avoid flicker loops
              keepAliveRef.current = false;
              setActive(false);
              setError('Recognition keeps stopping quickly. Check mic permissions and blockers.');
              return;
            }
          } else {
            failCountRef.current = 0;
          }
          const wait = Math.min(backoffRef.current, 4000);
          backoffRef.current *= 2;
          window.setTimeout(() => { tryStart(); }, wait);
        }
      };

      recRef.current = rec;
    }
    return recRef.current;
  }, [SRClass, lang]);

  async function askPermission() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      setError('Microphone permission denied.');
      return false;
    }
  }

  const tryStart = useCallback(async () => {
    if (startingRef.current) return;
    const rec = ensureRecognizer();
    if (!rec) return;
    if (!(await askPermission())) return;

    try {
      startingRef.current = true;
      setError(null);
      lastStartRef.current = Date.now();
      rec.start();
      setActive(true);
    } catch (e: any) {
      if (e?.name !== 'InvalidStateError') {
        setError(e?.message || 'Failed to start recognition');
      }
    } finally {
      startingRef.current = false;
    }
  }, [ensureRecognizer]);

  const start = useCallback(() => {
    failCountRef.current = 0;
    backoffRef.current = 250;
    keepAliveRef.current = true;
    tryStart();
  }, [tryStart]);

  const stop = useCallback(() => {
    keepAliveRef.current = false;
    backoffRef.current = 250;
    const rec = recRef.current;
    if (rec) {
      try { rec.abort?.(); } catch {}
      try { rec.stop(); } catch {}
    }
    setListening(false);
    setActive(false);
  }, []);

  const clear = useCallback(() => setEvents([]), []);

  // Pause in background to avoid browser killing the session
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        if (listening) stop();
      } else {
        if (keepAliveRef.current && !listening) start();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [listening, start, stop]);

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { active, listening, events, error, start, stop, clear };
}
