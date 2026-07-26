"use client";

import { useEffect, useState } from "react";
import { isSupported } from "@/lib/textToSpeech";

// isSupported() checks `window`, which doesn't exist during server
// rendering but does on the client — calling it directly during render
// makes the "Listen" button appear on the client but not in the
// server-rendered HTML, which is a hydration mismatch. This always
// returns false on the first render (matching the server) and updates
// after mount, once hydration is safely done.
export function useSpeechSupported(): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Reading browser-only capability once after mount is the fix described above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(isSupported());
  }, []);

  return supported;
}
