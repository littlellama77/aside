import React, { useState, useEffect, useRef } from 'react';
import { useMeeting } from '../context/MeetingContext';
import { companionSync } from '../services/companionSync';
import { THINKING_INTRO_SENTENCES, BUY_ME_A_SECOND_PHRASES } from '../constants/mockData';
import {
  Copy,
  Check,
  Clock,
  FileText,
  Wifi,
  Sparkles,
  Lock,
  ArrowRight,
  Radio,
  Mic,
  MicOff,
  RotateCcw
} from 'lucide-react';

export function PhoneCompanion({ isStandalone = false }) {
  const context = useMeeting();

  // URL parameter parsing for standalone phone mode
  const [remoteState, setRemoteState] = useState(null);
  const [syncStatus, setSyncStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected'
  const [syncType, setSyncType] = useState('initiating'); // 'cloud' | 'broadcast' | 'simulated'
  const [pairingCodeInput, setPairingCodeInput] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || context?.pairingCode || 'ASIDE-8492';
  });
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSheetDrawer, setShowSheetDrawer] = useState(false);
  const [localStallPhrase, setLocalStallPhrase] = useState(null);
  const [localDisclosure, setLocalDisclosure] = useState('glance');
  const [selectedIntro, setSelectedIntro] = useState(null);

  // Local phone microphone listening state
  const [localIsListening, setLocalIsListening] = useState(false);
  const [localTranscript, setLocalTranscript] = useState('');
  const recognitionRef = useRef(null);
  const isListeningActiveRef = useRef(false);

  // Initialize phone connection via companionSync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || context?.pairingCode || 'ASIDE-8492';

    companionSync.initPhone(code);

    const unsubStatus = companionSync.onStatusChange((status, type) => {
      setSyncStatus(status);
      setSyncType(type);
    });

    const unsubMsg = companionSync.onMessage((msg) => {
      if (msg.type === 'STATE_UPDATE' && msg.payload) {
        setRemoteState(msg.payload);
      }
    });

    return () => {
      unsubStatus();
      unsubMsg();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [context?.pairingCode]);

  // Merge remote state with context fallback
  const isScreenSharing = remoteState ? remoteState.isScreenSharing : context?.isScreenSharing;
  const conversationState = remoteState ? remoteState.conversationState : context?.conversationState;
  const activeQuestion = remoteState ? remoteState.activeQuestion : context?.activeQuestion;
  const isQuestionActive = remoteState ? remoteState.isQuestionActive : context?.isQuestionActive;
  const frozenSuggestion = remoteState ? remoteState.frozenSuggestion : context?.frozenSuggestion;
  const cheatSheet = remoteState ? remoteState.cheatSheet : context?.cheatSheet || {};
  const effectiveStall = localStallPhrase || (remoteState ? remoteState.stallingPhrase : context?.stallingPhrase);
  
  // Microphone status (active if either phone local mic or laptop mic is active)
  const isRemoteListening = remoteState?.isLiveListening ?? context?.isLiveListening ?? false;
  const isMicListeningActive = localIsListening || isRemoteListening;
  const activeTranscript = localTranscript || remoteState?.liveTranscript || (context?.liveTranscript ?? '');

  // Toggle Microphone Listening (controls both local phone mic and broadcasts to laptop)
  const handleToggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const nextListeningState = !isMicListeningActive;

    // 1. Send sync action to laptop
    companionSync.sendActionToLaptop(nextListeningState ? 'START_LISTENING' : 'STOP_LISTENING');
    if (context?.toggleLiveListening && context.isLiveListening !== nextListeningState) {
      context.toggleLiveListening();
    }

    // 2. Control phone's own local microphone if browser supports Web Speech API
    if (!SpeechRecognition) {
      setLocalIsListening(nextListeningState);
      return;
    }

    if (localIsListening) {
      isListeningActiveRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setLocalIsListening(false);
      setLocalTranscript('');
    } else {
      try {
        isListeningActiveRef.current = true;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setLocalIsListening(true);
          setLocalTranscript('Listening for meeting questions...');
        };

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) final += transcript;
            else interim += transcript;
          }
          const spoken = (final || interim).trim();
          if (spoken) setLocalTranscript(spoken);

          // If speaker finished sentence of 6+ characters, send to laptop to synthesize answer!
          if (final.trim().length >= 6) {
            companionSync.sendActionToLaptop('ASK_QUESTION', { question: final.trim() });
          }
        };

        recognition.onerror = (e) => {
          console.warn("Phone speech recognition notice:", e.error);
        };

        recognition.onend = () => {
          if (isListeningActiveRef.current) {
            setTimeout(() => {
              if (isListeningActiveRef.current) {
                try { recognition.start(); } catch {}
              }
            }, 300);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setLocalIsListening(true);
      } catch (err) {
        console.warn('Could not start local phone microphone:', err);
        setLocalIsListening(nextListeningState);
      }
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerStall = () => {
    const picked = BUY_ME_A_SECOND_PHRASES[Math.floor(Math.random() * BUY_ME_A_SECOND_PHRASES.length)];
    setLocalStallPhrase(picked);
    companionSync.sendActionToLaptop('NEED_A_SECOND');
    if (context?.setStallingPhrase) context.setStallingPhrase(picked);
  };

  const handleTriggerPanic = () => {
    companionSync.sendActionToLaptop('STUCK');
    if (context?.triggerImStuck) context.triggerImStuck(true);
  };

  const handleConnectWithCode = (e) => {
    e.preventDefault();
    if (!pairingCodeInput.trim()) return;
    companionSync.initPhone(pairingCodeInput.trim().toUpperCase());
    setShowCodeInput(false);
  };

  const handleClearAnswer = () => {
    companionSync.sendActionToLaptop('CLEAR_QUESTION');
    if (context?.setIsQuestionActive) {
      context.setIsQuestionActive(false);
      context.setActiveQuestion(null);
    }
  };

  const isYourTurn = conversationState === 'YOUR_TURN';
  const isParticipantSpeaking = conversationState === 'OTHER_PERSON_SPEAKING';
  const isUnknown = activeQuestion?.category === 'unknown' || activeQuestion?.isUnknown;

  const displayedSay = isYourTurn && frozenSuggestion
    ? frozenSuggestion
    : localDisclosure === 'expanded'
      ? (activeQuestion?.expandedSay || activeQuestion?.glanceSay)
      : activeQuestion?.glanceSay;

  // Format connection label
  const connectionLabel = syncStatus === 'connected'
    ? syncType === 'cloud'
      ? 'Live Cloud Sync 🌐'
      : syncType === 'broadcast'
        ? 'Live Relay ⚡'
        : 'Live Sync 🟢'
    : 'Connecting to Laptop...';

  // Thinking opener to display
  const activeThinkingIntro = selectedIntro || (
    activeQuestion?.glanceSay && THINKING_INTRO_SENTENCES.length > 0
      ? THINKING_INTRO_SENTENCES[0].replace(/^[“”"']|[“”"']$/g, '')
      : "Hmm, let me think about how to put this..."
  );

  return (
    <div className={`phone-companion-frame ${isStandalone ? 'standalone-phone-view' : ''}`}>
      {/* Phone Notch Bar */}
      <div className="phone-notch-bar">
        <div className="phone-time">10:42</div>
        <div className="phone-island">
          <div className="island-dot"></div>
          {isQuestionActive && <div className="island-wave-indicator"></div>}
        </div>
        <div className="phone-battery">
          <span>99%</span>
          <div className="battery-icon-mini"></div>
        </div>
      </div>

      {/* NEW: Microphone Listening Toggle Bar (Requested Feature) */}
      <div className={`phone-mic-control-bar ${isMicListeningActive ? 'mic-bar-active' : 'mic-bar-paused'}`}>
        <div className="phone-mic-left">
          <div className={`phone-mic-icon-circle ${isMicListeningActive ? 'mic-circle-pulse' : ''}`}>
            {isMicListeningActive ? <Mic size={15} className="text-accent" /> : <MicOff size={15} />}
          </div>
          <div className="phone-mic-text">
            <span className="phone-mic-status-label">
              {isMicListeningActive ? "Mic Listening Active" : "Microphone Paused"}
            </span>
            <span className="phone-mic-sub-text">
              {isMicListeningActive
                ? (activeTranscript || "Quietly listening for meeting questions...")
                : "Tap switch to listen with mic"}
            </span>
          </div>
        </div>

        {/* Interactive Toggle Switch */}
        <button
          type="button"
          className={`phone-toggle-switch ${isMicListeningActive ? 'toggle-on' : 'toggle-off'}`}
          onClick={handleToggleListening}
          title={isMicListeningActive ? "Click to mute/pause microphone" : "Click to start live microphone listening"}
          aria-label="Toggle microphone listening"
        >
          <div className="toggle-thumb">
            {isMicListeningActive ? <Mic size={12} className="thumb-icon-on" /> : <MicOff size={12} className="thumb-icon-off" />}
          </div>
        </button>
      </div>

      {/* Phone App Header */}
      <div className="phone-app-header">
        <div className="phone-header-left">
          <span className="phone-babe-tag">Aside 💬</span>
          <button
            className={`phone-status-pill ${syncStatus === 'connected' ? 'status-connected' : 'status-waiting'}`}
            onClick={() => setShowCodeInput(!showCodeInput)}
            title="Click to view pairing room code"
          >
            <span className={syncStatus === 'connected' ? "live-dot-green" : "standby-dot-amber"}></span>
            <span>{connectionLabel}</span>
          </button>
        </div>

        <div className="phone-header-actions">
          {isQuestionActive && (
            <button
              className="phone-clear-btn"
              onClick={handleClearAnswer}
              title="Return to quiet listening standby"
            >
              <RotateCcw size={13} />
            </button>
          )}
          <button
            className="phone-cheat-toggle"
            onClick={() => setShowSheetDrawer(!showSheetDrawer)}
            title="Executive memory brief"
          >
            <FileText size={15} />
          </button>
        </div>
      </div>

      {/* Manual Code Input Overlay / Drawer if toggled */}
      {showCodeInput && (
        <form className="phone-code-input-card animate-fade-in" onSubmit={handleConnectWithCode}>
          <div className="code-input-header">
            <Wifi size={13} className="text-accent" />
            <span>Pairing Room Code:</span>
          </div>
          <div className="code-input-row">
            <input
              type="text"
              value={pairingCodeInput}
              onChange={(e) => setPairingCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. ASIDE-8492"
              className="phone-pairing-input"
            />
            <button type="submit" className="btn-code-submit">
              <ArrowRight size={14} />
            </button>
          </div>
          <span className="code-hint-text">
            Pairs over the internet across any network (cellular or Wi-Fi).
          </span>
        </form>
      )}

      {/* Screen Sharing Active Protection Banner */}
      {isScreenSharing && (
        <div className="phone-screen-shared-badge animate-fade-in">
          <div className="shared-badge-icon">
            <Lock size={14} />
          </div>
          <div className="shared-badge-text">
            <strong className="shared-strong">Desktop Screen is Shared 🔒</strong>
            <span>Meeting participants cannot see these cues. Private display active.</span>
          </div>
        </div>
      )}

      {/* Main Glanceable Body */}
      <div className="phone-body-content">
        {/* State 1: User is speaking on Laptop -> SUGGESTION FROZEN (Zero Regeneration) */}
        {isYourTurn && (
          <div className="phone-glance-card phone-frozen animate-fade-in">
            <div className="phone-tag-row">
              <span className="phone-babe-tag-pill tag-frozen">
                🗣️ YOUR TURN · Suggestion Frozen
              </span>
              <span className="zero-regen-pill">Zero Regeneration</span>
            </div>

            <div className="phone-simplest-box">
              <span className="phone-sub-q">{activeQuestion?.simplestQuestion || "Answering in progress..."}</span>
            </div>

            <div className="phone-say-card say-frozen">
              <span className="phone-say-tag text-freeze">Your Cue (Locked):</span>
              <p className="phone-spoken-quote">“{displayedSay}”</p>
            </div>

            {activeQuestion?.glanceBullets && (
              <div className="phone-bullets-group">
                {activeQuestion.glanceBullets.map((b, i) => (
                  <span key={i} className="phone-bullet-item">{b}</span>
                ))}
              </div>
            )}

            <div className="phone-frozen-notice">
              <span>Aside will remain quiet until you finish speaking.</span>
            </div>
          </div>
        )}

        {/* State 2: Question Active -> Glanceable Cue + Thinking Opener */}
        {!isYourTurn && isQuestionActive && activeQuestion && (
          <div className="phone-glance-card animate-fade-in">
            {/* Tag / Micro status */}
            <div className="phone-tag-row">
              <span className={`phone-babe-tag-pill ${isUnknown ? 'tag-unknown' : ''}`}>
                {activeQuestion.babeTag || "babe 👀"}
              </span>

              <div className="phone-quick-actions">
                <button
                  className="btn-phone-icon"
                  onClick={() => handleCopy(displayedSay)}
                  title="Copy"
                >
                  {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Simplest interpretation of the question */}
            <div className="phone-simplest-box">
              <span className="phone-sub-q">{activeQuestion.simplestQuestion || activeQuestion.question}</span>
            </div>

            {/* Thinking Out Loud Opener (Say First) */}
            <div className="phone-thinking-card">
              <div className="phone-thinking-top">
                <span className="thinking-icon">💭</span>
                <span className="thinking-title">Thinking opener (say first):</span>
              </div>
              <p className="phone-thinking-quote">“{activeThinkingIntro}”</p>
            </div>

            {/* Primary Spoken Answer */}
            <div className="phone-say-card">
              <span className="phone-say-tag">Say Aloud:</span>
              <p className="phone-spoken-quote">“{displayedSay}”</p>
            </div>

            {/* Verified Numbers & Strategic Bullets */}
            {activeQuestion.glanceBullets && activeQuestion.glanceBullets.length > 0 && (
              <div className="phone-bullets-group">
                {activeQuestion.glanceBullets.map((b, i) => (
                  <span key={i} className="phone-bullet-item">{b}</span>
                ))}
              </div>
            )}

            {/* Stalling Phrase Display if active */}
            {effectiveStall && (
              <div className="phone-stall-box animate-fade-in">
                <div className="phone-stall-top">
                  <span>Say to buy time:</span>
                  <button onClick={() => setLocalStallPhrase(null)}>×</button>
                </div>
                <p>“{effectiveStall}”</p>
              </div>
            )}

            {/* Progressive Disclosure Toggle */}
            <div className="phone-progressive-btn-row">
              <button
                className="btn-phone-prog"
                onClick={() => setLocalDisclosure(localDisclosure === 'expanded' ? 'glance' : 'expanded')}
              >
                {localDisclosure === 'expanded' ? "- Back to short glance" : "+ Full version"}
              </button>
            </div>
          </div>
        )}

        {/* State 3: Participant Speaking -> Subdued Context Update */}
        {!isYourTurn && !isQuestionActive && isParticipantSpeaking && (
          <div className="phone-idle-listening animate-fade-in">
            <div className="phone-idle-circle circle-active" onClick={handleToggleListening}>
              <Radio size={20} className="text-accent animate-pulse" />
            </div>
            <h3 className="phone-idle-heading">Participant Speaking</h3>
            <p className="phone-idle-sub">
              {activeTranscript ? `“${activeTranscript}”` : "Analyzing conversation context and anticipating questions..."}
            </p>
          </div>
        )}

        {/* State 4: Normal Standby State: Minimal, calm, quiet */}
        {!isYourTurn && !isQuestionActive && !isParticipantSpeaking && (
          <div className="phone-idle-listening animate-fade-in">
            <div
              className={`phone-idle-circle ${isMicListeningActive ? 'circle-active' : 'circle-paused'}`}
              onClick={handleToggleListening}
              title="Tap circle to toggle microphone listening"
              style={{ cursor: 'pointer' }}
            >
              {isMicListeningActive ? (
                <span className="idle-wave">●</span>
              ) : (
                <MicOff size={18} className="text-tertiary" />
              )}
            </div>
            
            <h3 className="phone-idle-heading">
              {isMicListeningActive ? "aside · listening" : "aside · mic paused"}
            </h3>
            
            <p className="phone-idle-sub">
              {isMicListeningActive
                ? (activeTranscript ? `“${activeTranscript}”` : "Quiet standby. When a question is directed at you, your prompt appears here.")
                : "Microphone is paused. Tap the switch above or the circle to start listening."}
            </p>

            {/* Key Strategic Pointers */}
            <div className="phone-cheat-peek-strip">
              <span className="peek-label-mini">KEY STRATEGIC POINTERS:</span>
              {(cheatSheet?.thingsToRemember || []).slice(0, 3).map((item, idx) => (
                <div key={idx} className="peek-bullet-mini">• {item}</div>
              ))}
            </div>

            {/* Quick Test Questions Row on Mobile */}
            <div className="phone-quick-test-section">
              <span className="peek-label-mini">TAP TO TEST SAMPLE QUESTIONS:</span>
              <div className="phone-test-chips-row">
                {(context?.demoScenarios || []).slice(0, 4).map((sc, idx) => (
                  <button
                    key={sc.id || idx}
                    type="button"
                    className="phone-test-chip"
                    onClick={() => {
                      companionSync.sendActionToLaptop('SELECT_QUESTION', { questionObj: sc });
                      if (context?.selectQuestion) context.selectQuestion(sc);
                    }}
                  >
                    <span>{sc.question}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notes Drawer */}
        {showSheetDrawer && (
          <div className="phone-sheet-slideout animate-fade-in">
            <div className="slideout-top">
              <span>Executive Memory Brief</span>
              <button onClick={() => setShowSheetDrawer(false)}>×</button>
            </div>
            <div className="slideout-body">
              <strong>Key strategic pointers:</strong>
              <ul>
                {(cheatSheet?.thingsToRemember || []).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <strong style={{ marginTop: '8px', display: 'block' }}>Verified metrics:</strong>
              <div className="slideout-numbers">
                {(cheatSheet?.importantNumbers || []).map((n, i) => (
                  <span key={i} className="num-badge">{n.label}: {n.value}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Emergency Dock */}
      <div className="phone-dock-actions">
        <button
          className="phone-btn-stall"
          onClick={handleTriggerStall}
          title="Buy thinking time"
        >
          <Clock size={13} />
          <span>I need a second</span>
        </button>

        <button
          className="phone-btn-panic"
          onClick={handleTriggerPanic}
          title="Brain went blank"
        >
          <span>😭 I'm stuck</span>
        </button>
      </div>
    </div>
  );
}
