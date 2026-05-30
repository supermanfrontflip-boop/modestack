import { useCallback, useEffect, useRef, useState } from "react";

type SR = any;
type SpeechSegment = { text: string; isFinal: boolean };

function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

function normalizeSpeechText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function mergeOverlappingSpeechParts(parts: string[]) {
  const mergedWords: string[] = [];

  for (const part of parts) {
    const words = normalizeSpeechText(part).split(" ").filter(Boolean);
    if (words.length === 0) continue;

    if (mergedWords.length === 0) {
      mergedWords.push(...words);
      continue;
    }

    const maxOverlap = Math.min(mergedWords.length, words.length);
    let overlap = 0;

    for (let size = maxOverlap; size > 0; size--) {
      const existingTail = mergedWords.slice(-size).join(" ").toLowerCase();
      const incomingHead = words.slice(0, size).join(" ").toLowerCase();
      if (existingTail === incomingHead) {
        overlap = size;
        break;
      }
    }

    mergedWords.push(...words.slice(overlap));
  }

  return mergedWords.join(" ");
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
  const segmentsRef = useRef<Map<number, SpeechSegment>>(new Map());
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
    segmentsRef.current.clear();
    r.onresult = (event: any) => {
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const text = normalizeSpeechText(res[0]?.transcript ?? "");
        if (text) segmentsRef.current.set(i, { text, isFinal: res.isFinal });
      }

      const segments = [...segmentsRef.current.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, segment]) => segment);
      const combined = mergeOverlappingSpeechParts(segments.map((segment) => segment.text));
      const hasInterim = segments.some((segment) => !segment.isFinal);
      cbRef.current(combined, !hasInterim);
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
