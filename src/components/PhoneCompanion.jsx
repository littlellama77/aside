import React, { useState, useEffect } from 'react';
import { useMeeting } from '../context/MeetingContext';
import { companionSync } from '../services/companionSync';
import {
  Copy,
  Check,
  Clock,
  FileText,
  Wifi,
  Sparkles,
  Lock,
  ArrowRight,
  Radio
} from 'lucide-react';

export function PhoneCompanion({ isStandalone = false }) {
  const context = useMeeting();

  // Local URL parameter parsing for standalone phone mode
  const [remoteState, setRemoteState] = useState(null);
  const [syncStatus, setSyncStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected'
  const [syncType, setSyncType] = useState('initiating'); // 'webrtc' | 'broadcast' | 'simulated'
  const [pairingCodeInput, setPairingCodeInput] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || context?.pairingCode || 'ASIDE-8492';
  });
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSheetDrawer, setShowSheetDrawer] = useState(false);
  const [localStallPhrase, setLocalStallPhrase] = useState(null);
  const [localDisclosure, setLocalDisclosure] = useState('glance');

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

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerStall = () => {
    const stallPhrases = [
      "Give me one second — I want to make sure I explain that properly.",
      "Let me think about that for a second.",
      "I want to check the exact number before I answer."
    ];
    const picked = stallPhrases[Math.floor(Math.random() * stallPhrases.length)];
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

  const isYourTurn = conversationState === 'YOUR_TURN';
  const isParticipantSpeaking = conversationState === 'OTHER_PERSON_SPEAKING';
  const isUnknown = activeQuestion?.category === 'unknown';
  const isOpinion = activeQuestion?.category === 'opinion';

  const displayedSay = isYourTurn && frozenSuggestion
    ? frozenSuggestion
    : localDisclosure === 'expanded'
      ? (activeQuestion?.expandedSay || activeQuestion?.glanceSay)
      : activeQuestion?.glanceSay;

  // Format connection label
  const connectionLabel = syncStatus === 'connected'
    ? syncType === 'webrtc'
      ? 'Internet P2P (WebRTC) 🌐'
      : syncType === 'broadcast'
        ? 'Live Relay (Same Device) ⚡'
        : 'Live Sync 🫶'
    : 'Connecting to Laptop...';

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

      {/* Role Declaration Banner (Section 2 & Laptop-First Architecture) */}
      <div className="phone-role-banner">
        <div className="role-banner-content">
          <div className="role-tag-line">
            <span className="role-pill-accent">PRIVATE DISPLAY ONLY</span>
            <span className="role-sub-pill">Laptop is ears + brain</span>
          </div>
          <span className="role-quiet-note">Zero microphone access needed · No meeting listening</span>
        </div>
      </div>

      {/* Phone App Header */}
      <div className="phone-app-header">
        <div className="phone-header-left">
          <span className="phone-babe-tag">Aside 💬</span>
          <button
            className={`phone-status-pill ${syncStatus === 'connected' ? 'status-connected' : 'status-waiting'}`}
            onClick={() => setShowCodeInput(!showCodeInput)}
            title="Click to change pairing room"
          >
            <span className="live-dot-green"></span>
            <span>{connectionLabel}</span>
          </button>
        </div>

        <div className="phone-header-actions">
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

        {/* State 2: Question Confirmed -> 1-2 Second Glance Cue */}
        {!isYourTurn && isQuestionActive && activeQuestion && (
          <div className="phone-glance-card animate-fade-in">
            {/* Tag / Micro status */}
            <div className="phone-tag-row">
              <span className={`phone-babe-tag-pill ${isUnknown ? 'tag-unknown' : isOpinion ? 'tag-opinion' : ''}`}>
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
              <span className="phone-sub-q">{activeQuestion.simplestQuestion}</span>
            </div>

            {/* Start with prompt if Jargon or Complex question (Section 14) */}
            {activeQuestion.startWithPrompt && (
              <div className="phone-start-with-box">
                <Sparkles size={12} className="text-accent" />
                <span>{activeQuestion.startWithPrompt}</span>
              </div>
            )}

            {/* ONE SHORT CONVERSATIONAL ANSWER (Glanceable 1-2s reading) */}
            <div className="phone-say-card">
              <span className="phone-say-tag">Say:</span>
              <p className="phone-spoken-quote">“{displayedSay}”</p>
            </div>

            {/* 2-3 KEY WORDS OR BULLETS */}
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

            {/* Progressive Disclosure Button */}
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
            <div className="phone-idle-circle circle-active">
              <Radio size={20} className="text-accent animate-pulse" />
            </div>
            <h3 className="phone-idle-heading">Participant Speaking</h3>
            <p className="phone-idle-sub">
              Laptop is analyzing conversation context and anticipating questions...
            </p>
          </div>
        )}

        {/* State 4: Normal Listening State: Minimal, calm, quiet */}
        {!isYourTurn && !isQuestionActive && !isParticipantSpeaking && (
          <div className="phone-idle-listening animate-fade-in">
            <div className="phone-idle-circle">
              <span className="idle-wave">●</span>
            </div>
            <h3 className="phone-idle-heading">aside · listening</h3>
            <p className="phone-idle-sub">
              Quiet standby. When a question is directed at you, your prompt appears here in 1 second.
            </p>

            <div className="phone-cheat-peek-strip">
              <span className="peek-label-mini">Key strategic pointers:</span>
              {(cheatSheet?.thingsToRemember || []).slice(0, 3).map((item, idx) => (
                <div key={idx} className="peek-bullet-mini">• {item}</div>
              ))}
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
