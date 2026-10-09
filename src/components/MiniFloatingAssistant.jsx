import React, { useState, useRef, useEffect } from 'react';
import { useMeeting } from '../context/MeetingContext';
import {
  ChevronDown,
  Minimize2,
  Volume2,
  Copy,
  Check,
  Clock,
  FileText,
  X,
  Mic,
  Radio,
  RotateCcw
} from 'lucide-react';

export function MiniFloatingAssistant() {
  const {
    activeQuestion,
    isQuestionActive,
    isScreenSharing,
    toggleScreenSharing,
    conversationState,
    frozenSuggestion,
    triggerUserSpeaking,
    triggerUserFinished,
    isMiniWindowCollapsed,
    setIsMiniWindowCollapsed,
    isMiniWindowHidden,
    setIsMiniWindowHidden,
    disclosureLevel,
    setDisclosureLevel,
    triggerImStuck,
    stallingPhrase,
    setStallingPhrase,
    triggerBuyMeASecond,
    speakText,
    speechActive
  } = useMeeting();

  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const posStartRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  // Handle Dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    setIsDragging(true);
    posStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - posStartRef.current.startX;
      const dy = e.clientY - posStartRef.current.startY;
      setPosition({
        x: Math.max(10, posStartRef.current.posX + dx),
        y: Math.max(10, posStartRef.current.posY + dy)
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Hidden Mode (Shortcut Alt+A / Alt+B)
  if (isMiniWindowHidden) {
    return (
      <button
        className="unhide-mini-pill"
        onClick={() => setIsMiniWindowHidden(false)}
        title="Show Aside (Shortcut: Alt+A or Alt+B)"
      >
        <span>💬 aside</span>
        <span className="unhide-shortcut">Alt+A</span>
      </button>
    );
  }

  // 1. SCREEN SHARING STEALTH MODE (Section 19: When screen sharing is active)
  if (isScreenSharing) {
    return (
      <div
        className="mini-floating-window stealth-window glass-panel animate-fade-in"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        <div className="mini-window-header" onMouseDown={handleMouseDown}>
          <div className="header-left-stealth">
            <span className="stealth-shield-icon">🔒</span>
            <span className="stealth-title-text">Private mode → Phone</span>
          </div>
          <div className="mini-window-controls">
            <button
              onClick={() => setIsMiniWindowCollapsed(true)}
              className="win-btn"
              title="Collapse"
            >
              <Minimize2 size={12} />
            </button>
          </div>
        </div>
        <div className="stealth-body-compact">
          <p className="stealth-whisper">
            Screen is shared. Responses stream quietly to your paired phone.
          </p>
          <button
            type="button"
            className="btn-exit-stealth"
            onClick={() => toggleScreenSharing(false)}
          >
            Show Desktop Notes
          </button>
        </div>
      </div>
    );
  }

  // 2. QUIET LISTENING PILL (Section 1 & 3: Quiet when not needed)
  // When in LISTENING state or collapsed, show minimal status pill
  const isQuietState = (conversationState === 'LISTENING' && !isQuestionActive) || isMiniWindowCollapsed;
  if (isQuietState) {
    return (
      <div
        className="mini-collapsed-pill glass-panel animate-fade-in"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        onMouseDown={handleMouseDown}
      >
        <div className="collapsed-inner">
          <span className="drag-grip">⋮⋮</span>
          <span className="pill-listening-text">
            <span className="pulse-green-dot">●</span> listening
          </span>
          <button
            className="pill-expand-btn"
            onClick={() => setIsMiniWindowCollapsed(false)}
            title="Expand Aside"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
    );
  }

  // 3. OTHER PERSON SPEAKING (Section 3: Aside updates context quietly)
  if (conversationState === 'OTHER_PERSON_SPEAKING') {
    return (
      <div
        className="mini-collapsed-pill glass-panel animate-fade-in"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        onMouseDown={handleMouseDown}
      >
        <div className="collapsed-inner">
          <span className="drag-grip">⋮⋮</span>
          <span className="pill-speaking-text text-amber">
            <Radio size={12} className="animate-pulse" /> listening to participant...
          </span>
        </div>
      </div>
    );
  }

  // 4. LOW CONFIDENCE TRANSCRIPTION (Section 9)
  if (activeQuestion?.category === 'low-confidence') {
    return (
      <div
        ref={dragRef}
        className={`mini-floating-window glass-panel animate-fade-in ${isDragging ? 'is-dragging' : ''}`}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        <div className="mini-window-header" onMouseDown={handleMouseDown}>
          <div className="header-left">
            <span className="drag-handle">⋮⋮</span>
            <span className="mini-status-text text-amber">⚠️ unclear audio</span>
          </div>
          <div className="mini-window-controls">
            <button onClick={() => setIsMiniWindowCollapsed(true)} className="win-btn" title="Collapse">
              <Minimize2 size={12} />
            </button>
            <button onClick={() => setIsMiniWindowHidden(true)} className="win-btn" title="Hide">
              <X size={12} />
            </button>
          </div>
        </div>
        <div className="mini-window-body">
          <div className="mini-tag-row">
            <span className="babe-mini-badge badge-unknown">
              I didn't quite catch that 😭
            </span>
          </div>
          <div className="mini-simplest-question">
            <span className="mini-q-sub">I think the topic was: <strong>Budget & Performance Targets</strong></span>
          </div>
          <div className="low-confidence-action-buttons">
            <button className="btn-low-conf" onClick={() => alert("Replaying last 4 seconds of audio...")}>
              <RotateCcw size={12} />
              <span>Replay</span>
            </button>
            <button className="btn-low-conf" onClick={() => alert("Showing recent transcript: '...and what's the target variance?'")}>
              <FileText size={12} />
              <span>Show transcript</span>
            </button>
            <button className="btn-low-conf" onClick={triggerUserFinished}>
              <span>Ignore</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. ACTIVE QUESTION DISPLAY (1–2 Second Glance Format — Section 16)
  const isUnknown = activeQuestion?.category === 'unknown';
  const isOpinion = activeQuestion?.category === 'opinion';
  const isYourTurn = conversationState === 'YOUR_TURN';

  const displayedSay = isYourTurn && frozenSuggestion
    ? frozenSuggestion
    : disclosureLevel === 'expanded'
      ? (activeQuestion?.expandedSay || activeQuestion?.glanceSay)
      : activeQuestion?.glanceSay;

  return (
    <div
      ref={dragRef}
      className={`mini-floating-window glass-panel animate-fade-in ${isDragging ? 'is-dragging' : ''} ${isYourTurn ? 'window-frozen' : ''}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Discreet Header & Drag Bar */}
      <div className="mini-window-header" onMouseDown={handleMouseDown}>
        <div className="header-left">
          <span className="drag-handle" title="Drag to reposition">⋮⋮</span>
          {isYourTurn ? (
            <span className="mini-status-text text-freeze">
              <Mic size={12} className="animate-pulse" /> YOUR TURN · Frozen
            </span>
          ) : conversationState === 'POSSIBLE_QUESTION' ? (
            <span className="mini-status-text text-amber">⏳ evaluating...</span>
          ) : (
            <span className="mini-status-text">
              <span className="live-dot-sage">●</span> Aside · ready
            </span>
          )}
        </div>

        <div className="mini-window-controls">
          <button
            onClick={() => setIsMiniWindowCollapsed(true)}
            className="win-btn"
            title="Collapse to minimal pill"
          >
            <Minimize2 size={12} />
          </button>
          <button
            onClick={() => setIsMiniWindowHidden(true)}
            className="win-btn"
            title="Hide (Shortcut: Alt+A)"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Main Glanceable Body (1-2 second glance design) */}
      <div className="mini-window-body">
        {/* Subtle Tag / Emotion Banner */}
        <div className="mini-tag-row">
          <span className={`babe-mini-badge ${isUnknown ? 'badge-unknown' : isOpinion ? 'badge-opinion' : ''}`}>
            {isYourTurn ? "🗣️ Suggestion Frozen" : (activeQuestion?.babeTag || "babe 👀")}
          </span>

          <div className="mini-header-quick-actions">
            <button
              className="icon-mini-btn"
              onClick={() => speakText(displayedSay)}
              title="Practice listen"
            >
              <Volume2 size={13} className={speechActive ? 'text-accent' : ''} />
            </button>
            <button
              className="icon-mini-btn"
              onClick={() => handleCopy(displayedSay)}
              title="Copy"
            >
              {copied ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        {/* Simplest interpretation of question */}
        <div className="mini-simplest-question">
          <span className="mini-q-sub">{activeQuestion?.simplestQuestion || "They're asking a question."}</span>
        </div>

        {/* Section 14: Starting Phrase if available */}
        {activeQuestion?.startWithPrompt && !isYourTurn && (
          <div className="mini-start-prompt">
            <span>{activeQuestion.startWithPrompt}</span>
          </div>
        )}

        {/* PRIMARY SPOKEN ANSWER (1–2s Glance) */}
        <div className={`mini-say-container ${isYourTurn ? 'say-frozen' : ''}`}>
          <span className="say-lead">{isYourTurn ? "Your Cue (Frozen):" : "Say:"}</span>
          <p className="say-spoken-phrase">“{displayedSay}”</p>
        </div>

        {/* 2-3 Quick Keyword Bullets */}
        {activeQuestion?.glanceBullets && activeQuestion.glanceBullets.length > 0 && (
          <div className="mini-bullets-row">
            {activeQuestion.glanceBullets.map((bullet, idx) => (
              <span key={idx} className="glance-bullet-chip">
                {bullet}
              </span>
            ))}
          </div>
        )}

        {/* Section 7 Turn-taking Action Button */}
        {!isYourTurn ? (
          <button
            type="button"
            className="btn-start-answering"
            onClick={() => triggerUserSpeaking("Yeah, so I think there were two main things...")}
            title="Click when you start speaking to freeze this suggestion"
          >
            <Mic size={13} />
            <span>Start answering (Enter YOUR TURN)</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-done-answering"
            onClick={triggerUserFinished}
            title="Click when you finish speaking to return to listening"
          >
            <Check size={13} />
            <span>Done answering (Return to listening)</span>
          </button>
        )}

        {/* Progressive Disclosure: Expand / Context Toggle */}
        {!isYourTurn && (
          <div className="mini-disclosure-bar">
            {disclosureLevel === 'glance' ? (
              <button
                className="btn-disclosure-text"
                onClick={() => setDisclosureLevel('expanded')}
              >
                <span>+ Full version</span>
              </button>
            ) : (
              <button
                className="btn-disclosure-text active"
                onClick={() => setDisclosureLevel('glance')}
              >
                <span>- Back to short glance</span>
              </button>
            )}

            <button
              className={`btn-disclosure-text ${disclosureLevel === 'context' ? 'active' : ''}`}
              onClick={() => setDisclosureLevel(disclosureLevel === 'context' ? 'glance' : 'context')}
            >
              <span>{disclosureLevel === 'context' ? "- Hide notes" : "+ Context"}</span>
            </button>
          </div>
        )}

        {/* Supporting Context (Continuous Context / Notes) */}
        {disclosureLevel === 'context' && activeQuestion?.supportingContext && (
          <div className="mini-supporting-context animate-fade-in">
            <span className="context-label">Context memory:</span>
            <p className="context-text">{activeQuestion.supportingContext}</p>
          </div>
        )}

        {/* Stalling Phrase Display ("I need a second") */}
        {stallingPhrase && (
          <div className="stalling-phrase-box animate-fade-in">
            <div className="stalling-box-top">
              <span className="stall-label">Say to buy thinking time:</span>
              <button onClick={() => setStallingPhrase(null)} className="stall-close">×</button>
            </div>
            <p className="stall-phrase-text">“{stallingPhrase}”</p>
          </div>
        )}

        {/* Safe Answer Quick Button if Unknown Fact */}
        {isUnknown && (
          <div className="safe-answer-recommendation animate-fade-in">
            <span className="safe-badge-pill">Safe Response (No Hallucination)</span>
            <p className="safe-prompt-text">
              “I'm not sure off the top of my head — let me check and get back to you.”
            </p>
          </div>
        )}

        {/* Bottom Fast Action Bar */}
        <div className="mini-bottom-dock">
          <button
            className="btn-mini-stall"
            onClick={triggerBuyMeASecond}
            title="Get a graceful phrase that buys thinking time"
          >
            <Clock size={12} />
            <span>I need a second</span>
          </button>

          <button
            className="btn-mini-panic"
            onClick={() => triggerImStuck(true)}
            title="My mind went blank — rescue me"
          >
            <span>😭 I'm stuck</span>
          </button>
        </div>
      </div>
    </div>
  );
}
