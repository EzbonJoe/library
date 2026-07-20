// Thin wrapper around the browser's built-in Web Speech API (speechSynthesis) —
// free, no backend, no audio files to generate or store. window.speechSynthesis
// is a single shared resource per page, so speaking a new utterance always
// cancels whatever was playing before (there's only ever one "player").

export function isSupported(){
  return 'speechSynthesis' in window;
}

// Tracks the currently-running speakSequence() call, if any, so stopSpeaking()
// can tell its chain to stop rather than mistaking the cancellation for the
// current item finishing naturally and advancing to the next one.
let activeSequenceToken = null;

export function stopSpeaking(){
  if(activeSequenceToken) activeSequenceToken.cancelled = true;
  if(isSupported()) window.speechSynthesis.cancel();
}

export function isSpeaking(){
  return isSupported() && window.speechSynthesis.speaking;
}

function makeUtterance(text){
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  return utterance;
}

// Reads a single piece of text aloud. Calling this again (or stopSpeaking())
// while one is already playing interrupts it, since there's only one voice.
export function speakOne(text, { onEnd } = {}){
  if(!isSupported()) return;

  stopSpeaking();
  const utterance = makeUtterance(text);
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

// Reads a list of texts aloud back-to-back, in order, advancing to the next
// one automatically as each finishes. Call stopSpeaking() to cancel early.
export function speakSequence(texts, { onItemStart, onItemEnd, onDone } = {}){
  if(!isSupported() || texts.length === 0) return;

  stopSpeaking();
  const token = { cancelled: false };
  activeSequenceToken = token;
  let index = 0;

  function playNext(){
    if(token.cancelled) return;

    if(index >= texts.length){
      if(activeSequenceToken === token) activeSequenceToken = null;
      onDone?.();
      return;
    }

    const currentIndex = index;
    onItemStart?.(currentIndex);

    const utterance = makeUtterance(texts[currentIndex]);
    utterance.onend = () => {
      onItemEnd?.(currentIndex);
      if(token.cancelled) return;
      index += 1;
      playNext();
    };
    utterance.onerror = () => {
      onItemEnd?.(currentIndex);
      if(token.cancelled) return;
      index += 1;
      playNext();
    };

    window.speechSynthesis.speak(utterance);
  }

  playNext();
}
