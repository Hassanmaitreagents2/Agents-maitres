/* ============================================================
   AGENTS MAÎTRES — Voice Interaction Module (v3.0)
   STT (Speech-to-Text) & TTS (Text-to-Speech)
   ============================================================ */

/**
 * Speech Recognition (STT) Utility
 */
export class VoiceRecognition {
  constructor(onResult, onStatusChange) {
    this.recognition = null;
    this.isListening = false;
    this.onResult = onResult;
    this.onStatusChange = onStatusChange;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'fr-FR';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStatusChange(true);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onStatusChange(false);
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.onResult(transcript);
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        this.onStatusChange(false);
      };
    }
  }

  toggle() {
    if (!this.recognition) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }
}

/**
 * Speech Synthesis (TTS) Utility
 */
export class VoiceSynthesis {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
  }

  speak(text) {
    if (!this.synth) return;
    this.stop();

    // Clean text (remove markdown symbols)
    const cleanText = text.replace(/[#*`_~]/g, '').slice(0, 32000);

    this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance.lang = 'fr-FR';
    
    // Find a nice French voice if available
    const voices = this.synth.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith('fr') && (v.name.includes('Thomas') || v.name.includes('Google') || v.name.includes('Premium')));
    if (frVoice) this.currentUtterance.voice = frVoice;

    this.synth.speak(this.currentUtterance);
  }

  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
  }

  get isSpeaking() {
    return this.synth.speaking;
  }
}
