import { useState, useRef, useEffect, useCallback } from "react";

export function useCopyFeedback(
  copyFn: () => Promise<boolean | void> | boolean | void,
  timeoutMs = 2000,
) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerCopy = useCallback(async () => {
    try {
      const result = await copyFn();
      if (result !== false) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        setCopied(true);
        timerRef.current = setTimeout(() => {
          setCopied(false);
        }, timeoutMs);
      }
    } catch {
      // Do not indicate success if the operation fails
    }
  }, [copyFn, timeoutMs]);

  return { copied, triggerCopy };
}
