import React, { useState, useEffect, useRef } from 'react';
import { useMeeting, isMeetingPromptOrQuestion } from '../context/MeetingContext';
import { cleanSpeechTranscriptText } from '../utils/notesSynthesizer';
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
  RotateCcw,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Square,
  Zap,
  BookOpen,
  Hash
} from 'lucide-react';

export function PhoneCompanion({
  isStandalone = false,
  onOpenNotes,
  onOpenAiSettings,
  onOpenPairing
}) {
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
  const [mobileCustomInput, setMobileCustomInput] = useState('');

  // Local phone microphone listening state (Listening to laptop speakers)
  const [localIsListening, setLocalIsListening] = useState(false);
  const [localTranscript, setLocalTranscript] = useState('');
  const recognitionRef = useRef(null);
  const isListeningActiveRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const turnTranscriptBufferRef = useRef('');

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
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [context?.pairingCode]);

  // Merge remote state with context fallback — prioritize local phone state when active
  const isScreenSharing = (remoteState && remoteState.isScreenSharing) ?? context?.isScreenSharing ?? false;
  const conversationState = (remoteState && remoteState.conversationState) || context?.conversationState || 'LISTENING';
  const activeQuestion = (context && context.activeQuestion) || (remoteState && remoteState.activeQuestion) || null;
  const isQuestionActive = Boolean((context && context.isQuestionActive) || (remoteState && remoteState.isQuestionActive) || activeQuestion);
  const frozenSuggestion = (context && context.frozenSuggestion) || (remoteState && remoteState.frozenSuggestion) || null;
  const cheatSheet = (context && context.cheatSheet) || (remoteState && remoteState.cheatSheet) || {};
  const effectiveStall = localStallPhrase || (context && context.stallingPhrase) || (remoteState && remoteState.stallingPhrase);

  // Manual Question Capture State & Handler (Direct Phone Microphone Operation)
  const isManualCaptureActive = Boolean(context?.isManualCaptureActive || remoteState?.isManualCaptureActive);
  const manualCapturedTranscript = context?.manualCapturedTranscript || remoteState?.manualCapturedTranscript || context?.liveTranscript || '';

  const handleToggleManualCapture = () => {
    // 1. Direct phone control (runs locally in MeetingContext using the phone's microphone)
    if (context?.toggleManualQuestionCapture) {
      context.toggleManualQuestionCapture();
    }
    // 2. Also notify laptop if paired
    companionSync.sendActionToLaptop('TOGGLE_MANUAL_CAPTURE');
  };

  // Microphone status (active if phone mic or laptop mic is active)
  const isMicListeningActive = Boolean(context?.isLiveListening || remoteState?.isLiveListening || isManualCaptureActive);
  const activeTranscript = context?.liveTranscript || remoteState?.liveTranscript || manualCapturedTranscript || '';

  // Process a candidate question locally or via sync
  const handleProcessCandidateQuestion = (text, speaker = "Phone Ears Audio") => {
    if (!text || text.trim().length < 3) return;
    const clean = cleanSpeechTranscriptText(text.trim());

    // 1. Synthesize right on phone via context
    if (context?.askCustomQuestion) {
      context.askCustomQuestion(clean, speaker);
    }

    // 2. Also broadcast to laptop if paired
    companionSync.sendActionToLaptop('ASK_QUESTION', { question: clean });
  };

  // Toggle Microphone Listening (controls local phone mic & broadcasts to laptop)
  const handleToggleListening = () => {
    if (context?.toggleLiveListening) {
      context.toggleLiveListening();
    }
    companionSync.sendActionToLaptop(!isMicListeningActive ? 'START_LISTENING' : 'STOP_LISTENING');
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
    setRemoteState(prev => prev ? { ...prev, isQuestionActive: false, activeQuestion: null } : null);
  };

  const handleMobileSubmit = (e) => {
    e.preventDefault();
    if (!mobileCustomInput.trim()) return;
    handleProcessCandidateQuestion(mobileCustomInput.trim(), "Mobile User");
    setMobileCustomInput('');
  };

  const isYourTurn = conversationState === 'YOUR_TURN';
  const isParticipantSpeaking = conversationState === 'OTHER_PERSON_SPEAKING';
  const isUnknown = activeQuestion?.category === 'unknown' || activeQuestion?.isUnknown;

  const quickSayPhone = isYourTurn && frozenSuggestion
    ? frozenSuggestion
    : (activeQuestion?.quickSay || activeQuestion?.glanceSay || "Addressing the question...");

  const quickBulletsPhone = activeQuestion?.quickBullets || activeQuestion?.glanceBullets || [];
  const detailedSayPhone = activeQuestion?.expandedSay || activeQuestion?.glanceSay || "";
  const isDetailedLoadingPhone = Boolean(activeQuestion?.isDetailedLoading);

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
    : 'Standalone Mode (Local)';

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

      {/* Standalone Architecture Banner */}
      <div className="phone-standalone-banner">
        <div className="standalone-banner-text">
          <span className="standalone-pill">🎧 STANDALONE PHONE EARS</span>
          <span className="standalone-sub">Listens to laptop speakers · 100% private, zero laptop software needed</span>
        </div>
      </div>

      {/* Microphone Listening Toggle Bar */}
      <div className={`phone-mic-control-bar ${isMicListeningActive ? 'mic-bar-active' : 'mic-bar-paused'}`}>
        <div className="phone-mic-left">
          <div className={`phone-mic-icon-circle ${isMicListeningActive ? 'mic-circle-pulse' : ''}`}>
            {isMicListeningActive ? <Mic size={15} className="text-accent" /> : <MicOff size={15} />}
          </div>
          <div className="phone-mic-text">
            <span className="phone-mic-status-label">
              {isMicListeningActive ? "Mic Listening to Laptop Speakers" : "Microphone Paused"}
            </span>
            <span className="phone-mic-sub-text">
              {isMicListeningActive
                ? (activeTranscript || "Listening quietly for questions...")
                : "Tap toggle to listen to laptop audio"}
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

      {/* Instant Start / Stop Question Button for Phone (Direct Control) */}
      <div className="phone-manual-capture-container">
        <button
          type="button"
          className={`phone-instant-capture-btn ${isManualCaptureActive ? 'recording-active' : ''}`}
          onClick={handleToggleManualCapture}
        >
          {isManualCaptureActive ? (
            <>
              <Square size={15} className="fill-white" />
              <div className="btn-capture-text">
                <span className="btn-capture-main">Stop & Answer ASAP ⚡</span>
                <span className="btn-capture-sub">
                  {manualCapturedTranscript ? `"${manualCapturedTranscript.slice(-30)}..."` : "Listening to interviewer..."}
                </span>
              </div>
            </>
          ) : (
            <>
              <Mic size={15} />
              <div className="btn-capture-text">
                <span className="btn-capture-main">Tap to Listen for Question</span>
                <span className="btn-capture-sub">Tap when question starts, tap again when done</span>
              </div>
            </>
          )}
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
          {/* AI Settings Modal button */}
          <button
            className="phone-header-action-btn"
            onClick={onOpenAiSettings}
            title="AI Model & OpenAI API Key"
          >
            <Sparkles size={14} className="text-accent" />
          </button>

          {/* Notes Drawer button */}
          <button
            className="phone-header-action-btn"
            onClick={onOpenNotes}
            title="Notes & Executive Memory Brief"
          >
            <FileText size={14} />
          </button>

          {/* Clear / Back button */}
          {isQuestionActive && (
            <button
              className="phone-clear-btn"
              onClick={handleClearAnswer}
              title="Return to quiet listening standby"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Manual Code Input Overlay / Drawer if toggled */}
      {showCodeInput && (
        <form className="phone-code-input-card animate-fade-in" onSubmit={handleConnectWithCode}>
          <div className="code-input-header">
            <Wifi size={13} className="text-accent" />
            <span>Optional Laptop Pairing Room:</span>
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
            Aside runs 100% standalone on this phone, or can pair with a laptop if desired.
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
        {/* State 1: User is speaking on Laptop -> SUGGESTION FROZEN */}
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
              
              {/* Thinking Opener Chips */}
              <div className="phone-thinking-chips-row">
                {THINKING_INTRO_SENTENCES.slice(0, 4).map((intro, idx) => {
                  const clean = intro.replace(/^[“”"']|[“”"']$/g, '');
                  const isSel = activeThinkingIntro === clean;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`phone-mini-chip ${isSel ? 'mini-chip-selected' : ''}`}
                      onClick={() => setSelectedIntro(clean)}
                    >
                      <span>{clean}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TWO-BOX PROGRESSIVE SYSTEM FOR PHONE */}
            <div className="phone-two-box-container">
              {/* Box 1: Quick & Fast Answer */}
              <div className="phone-two-box-quick">
                <div className="phone-box-header-row">
                  <div className="phone-badge-quick">
                    <Zap size={12} className="text-accent animate-pulse" />
                    <span>1. QUICK ANSWER (Fast Hook)</span>
                  </div>
                  <button
                    type="button"
                    className="phone-copy-mini"
                    onClick={() => handleCopy(quickSayPhone)}
                    title="Copy quick answer"
                  >
                    {copied ? <Check size={11} className="text-accent" /> : <Copy size={11} />}
                  </button>
                </div>

                <p className="phone-spoken-quote">“{quickSayPhone}”</p>

                {/* Verified Numbers & Strategic Bullets */}
                {quickBulletsPhone && quickBulletsPhone.length > 0 && (
                  <div className="phone-bullets-group">
                    {quickBulletsPhone.map((b, i) => (
                      <span key={i} className="phone-bullet-item">{b.replace(/^[•*-]\s*/, '')}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Box 2: Detailed Follow-Up */}
              <div className={`phone-two-box-detailed ${isDetailedLoadingPhone ? 'phone-detailed-loading' : ''}`}>
                <div className="phone-box-header-row">
                  <div className="phone-badge-detailed">
                    <BookOpen size={12} />
                    <span>2. CONTINUATION (Picks up from Box 1)</span>
                  </div>
                  {!isDetailedLoadingPhone && (
                    <button
                      type="button"
                      className="phone-copy-mini"
                      onClick={() => handleCopy(detailedSayPhone)}
                      title="Copy detailed answer"
                    >
                      <Copy size={11} />
                    </button>
                  )}
                </div>

                {isDetailedLoadingPhone ? (
                  <div className="phone-loading-deep-dive animate-fade-in">
                    <Sparkles size={13} className="text-accent animate-pulse" />
                    <span>Deep dive loading in background... Say Box 1 above!</span>
                  </div>
                ) : (
                  <div className="phone-detailed-text animate-fade-in">
                    <p>{detailedSayPhone}</p>
                    {activeQuestion.extraInformation && (
                      <div className="phone-extra-info-snippet">
                        <strong>Context:</strong> {activeQuestion.extraInformation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

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
              {activeTranscript ? `“${activeTranscript}”` : "Analyzing conversation context from laptop speakers..."}
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
                ? (activeTranscript ? `“${activeTranscript}”` : "Listening to laptop speakers. When someone asks you a question, your cue appears here.")
                : "Microphone is paused. Tap the switch above or the circle to start listening."}
            </p>

            {/* Ask or Type Question Bar right on mobile */}
            <form onSubmit={handleMobileSubmit} className="phone-search-box">
              <input
                type="text"
                placeholder="Or type a question directly..."
                value={mobileCustomInput}
                onChange={(e) => setMobileCustomInput(e.target.value)}
                className="phone-search-input"
              />
              <button type="submit" className="phone-search-btn" title="Get Answer">
                <Send size={13} />
              </button>
            </form>

            {/* Key Strategic Pointers */}
            <div className="phone-cheat-peek-strip">
              <span className="peek-label-mini">KEY STRATEGIC POINTERS:</span>
              {(cheatSheet?.thingsToRemember || []).slice(0, 3).map((item, idx) => (
                <div key={idx} className="peek-bullet-mini">• {item}</div>
              ))}
            </div>

            {/* Quick 1-Tap Interview Prompt Chips for Mobile */}
            <div className="phone-quick-test-section">
              <span className="peek-label-mini">INSTANT ONE-TAP INTERVIEW PROMPTS:</span>
              <div className="phone-test-chips-row">
                <button
                  type="button"
                  className="phone-test-chip"
                  onClick={() => handleProcessCandidateQuestion("Can you walk me through your background and why you are interested in Crealytics?")}
                >
                  <span>💬 Walk me through your background & why Crealytics</span>
                </button>
                <button
                  type="button"
                  className="phone-test-chip"
                  onClick={() => handleProcessCandidateQuestion("How do you handle underperforming campaigns or tight client ROAS targets?")}
                >
                  <span>💬 Optimizing ROAS & underperforming campaigns</span>
                </button>
                <button
                  type="button"
                  className="phone-test-chip"
                  onClick={() => handleProcessCandidateQuestion("What is your experience with Retail Media Networks and Amazon/Walmart sponsored ads?")}
                >
                  <span>💬 Retail Media & Sponsored Ads expertise</span>
                </button>
                <button
                  type="button"
                  className="phone-test-chip"
                  onClick={() => handleProcessCandidateQuestion("Can you take me through your CV?")}
                >
                  <span>💬 Take me through your CV</span>
                </button>
                <button
                  type="button"
                  className="phone-test-chip"
                  onClick={() => handleProcessCandidateQuestion("What makes someone a good teammate, and how do you approach collaboration?")}
                >
                  <span>💬 What makes a good teammate?</span>
                </button>
                <button
                  type="button"
                  className="phone-test-chip"
                  onClick={() => handleProcessCandidateQuestion("How do you handle disagreements with colleagues?")}
                >
                  <span>💬 Handling disagreements with colleagues</span>
                </button>
                <button
                  type="button"
                  className="phone-test-chip"
                  onClick={() => handleProcessCandidateQuestion("Tell me something about yourself that isn't on your CV.")}
                >
                  <span>💬 Tell me something not on your CV</span>
                </button>
                <button
                  type="button"
                  className="phone-test-chip"
                  onClick={() => handleProcessCandidateQuestion("What kind of books do you read, and what are your favourites?")}
                >
                  <span>💬 Favourite books & reading</span>
                </button>
                {(context?.demoScenarios || []).slice(0, 3).map((sc, idx) => (
                  <button
                    key={sc.id || idx}
                    type="button"
                    className="phone-test-chip"
                    onClick={() => {
                      if (context?.selectQuestion) context.selectQuestion(sc);
                      companionSync.sendActionToLaptop('SELECT_QUESTION', { questionObj: sc });
                    }}
                  >
                    <span>{sc.question}</span>
                  </button>
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
