import { useCallback, useEffect, useRef, useState } from "react";

type SR = any;

function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/**
 * onTranscript is called with the cumulative transcript for the current
 * listening session (final results joined together, plus any in-flight
 * interim text). The consumer should replace — not append — the dictated
 * portion with this value.
 */
export function useSpeechRecognition(onTranscript: (sessionText: string, isFinal: boolean) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recogRef = useRef<SR | null>(null);
  const finalRef = useRef("");
  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;

  useEffect(() => {
    const Ctor = getSpeechRecognition();
    setSupported(!!Ctor);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    const r: SR = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = navigator.language || "en-US";
    finalRef.current = "";
    r.onresult = (event: any) => {
      // Rebuild the full transcript from scratch each event so we never
      // double-count words that the engine re-emits across interim updates
      // (common on Android Chrome).
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const t = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += t;
        else interimText += t;
      }
      finalRef.current = finalText;
      const combined = (finalText + " " + interimText).replace(/\s+/g, " ").trim();
      cbRef.current(combined, !interimText);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}
