import React, { useState } from 'react';
import { useMeeting } from '../context/MeetingContext';
import { NotesDrawer } from './NotesDrawer';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  Copy,
  Check,
  Clock,
  Sparkles,
  Send,
  ShieldAlert,
  Shield,
  Smartphone,
  ChevronRight,
  FileText,
  Minimize2,
  Maximize2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Hash,
  Monitor
} from 'lucide-react';

export function PrivateMeetingView({ onOpenPairingModal }) {
  const {
    meetingConfig,
    activeQuestion,
    isQuestionActive,
    conversationState,
    frozenSuggestion,
    triggerUserSpeaking,
    triggerUserFinished,
    triggerBuyMeASecond,
    stallingPhrase,
    setStallingPhrase,
    triggerImStuck,
    speakText,
    speechActive,
    isScreenSharing,
    toggleScreenSharing,
    isPhonePaired,
    pairingCode,
    wrapUpMeeting,
    questionsFeed,
    selectQuestion,
    askCustomQuestion,
    disclosureLevel,
    setDisclosureLevel,
    isLiveListening,
    toggleLiveListening,
    liveTranscript,
    isTabAudioCapturing,
    startTabAudioCapture,
    isCompactMode,
    setIsCompactMode,
    isNotesDrawerOpen,
    setIsNotesDrawerOpen,
    cheatSheet,
    demoScenarios
  } = useMeeting();

  const [customInput, setCustomInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    askCustomQuestion(customInput.trim(), "Meeting Participant");
    setCustomInput('');
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isYourTurn = conversationState === 'YOUR_TURN';
  const displayedSay = isYourTurn && frozenSuggestion
    ? frozenSuggestion
    : disclosureLevel === 'expanded'
      ? (activeQuestion?.expandedSay || activeQuestion?.glanceSay)
      : activeQuestion?.glanceSay;

  const isUnknown = activeQuestion?.category === 'unknown';

  return (
    <div className={`clean-copilot-container animate-fade-in ${isCompactMode ? 'compact-copilot-mode' : ''}`}>
      {/* 1. TOP HEADER & UNIVERSAL MEETING STATUS */}
      <div className="copilot-top-bar glass-panel">
        <div className="top-bar-left">
          <div className="meeting-badge-group">
            <span className="live-status-dot pulse-green"></span>
            <span className="copilot-meeting-title">{meetingConfig.name || "Live Meeting"}</span>
          </div>

          <div className="platform-compatibility-tag" title="Works alongside any meeting application on your computer">
            <span className="platform-tag-label">Active For:</span>
            <span className="platform-pill">MS Teams</span>
            <span className="platform-pill">Google Meet</span>
            <span className="platform-pill">Zoom</span>
          </div>
        </div>

        <div className="top-bar-right">
          {/* Live Mic Listening Toggle (Web Speech API) */}
          <button
            type="button"
            className={`btn-audio-listen ${isLiveListening ? 'listening-active' : ''}`}
            onClick={toggleLiveListening}
            title={isLiveListening ? "Click to pause microphone listening" : "Start live listening for questions from your meeting speakers"}
          >
            {isLiveListening ? (
              <>
                <Radio size={14} className="animate-pulse text-accent" />
                <span>Listening to Call...</span>
              </>
            ) : (
              <>
                <Mic size={14} />
                <span>Listen with Mic</span>
              </>
            )}
          </button>

          {/* Tab Audio Sharing (DisplayMedia API) */}
          <button
            type="button"
            className={`btn-tab-audio ${isTabAudioCapturing ? 'tab-capturing' : ''}`}
            onClick={startTabAudioCapture}
            title="Capture meeting tab audio directly (useful if you are wearing headphones)"
          >
            <Monitor size={14} />
            <span>{isTabAudioCapturing ? "Tab Audio Active" : "Capture Tab Audio"}</span>
          </button>

          {/* Notes & Context Drawer Button */}
          <button
            type="button"
            className="btn-open-notes"
            onClick={() => setIsNotesDrawerOpen(true)}
            title="View or paste your meeting notes"
          >
            <FileText size={14} className="text-accent" />
            <span>My Notes ({cheatSheet?.importantNumbers?.length || 4} metrics)</span>
          </button>

          {/* Compact Side-by-Side Mode Toggle */}
          <button
            type="button"
            className="btn-dock-mode"
            onClick={() => setIsCompactMode(!isCompactMode)}
            title="Toggle compact side-by-side mode to dock Beside Zoom/Teams"
          >
            {isCompactMode ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            <span>{isCompactMode ? "Expand" : "Dock Side-by-Side"}</span>
          </button>

          {/* Wrap Up / End Meeting */}
          <button type="button" className="btn-wrapup-pill" onClick={wrapUpMeeting}>
            <span>Wrap-up</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Live Audio Transcript Ticker (when mic or tab audio is active) */}
      {(isLiveListening || liveTranscript) && (
        <div className="live-transcript-ticker glass-panel animate-fade-in">
          <span className="transcript-live-pill">
            <span className="live-dot-green">●</span> Live Meeting Audio:
          </span>
          <span className="transcript-live-text">
            {liveTranscript || "Listening for questions from your colleagues on Microsoft Teams / Zoom / Meet..."}
          </span>
        </div>
      )}

      {/* Screen Sharing Alert Banner if Active */}
      {isScreenSharing && (
        <div className="screen-share-active-alert glass-panel animate-fade-in">
          <div className="share-alert-left">
            <ShieldAlert size={18} className="text-panic" />
            <div>
              <strong>Screen-Sharing Privacy Mode is Active 🔒</strong>
              <p>Your screen is being shared on Zoom/Meet. Hints are streaming safely to your phone.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-turn-off-share"
            onClick={() => toggleScreenSharing(false)}
          >
            Turn Off Screen Share (Show Desktop Hints)
          </button>
        </div>
      )}

      {/* 2. THE HERO ANSWER CARD (FRONT AND CENTER) */}
      <div className="copilot-main-answer-card glass-panel animate-fade-in">
        {/* Question Header */}
        <div className="answer-card-header">
          <div className="header-speaker-tag">
            <span className="speaker-avatar-circle">💬</span>
            <div>
              <span className="speaker-name-badge">
                {activeQuestion?.speaker || "Meeting Participant"} asked:
              </span>
              <h2 className="main-question-text">
                “{activeQuestion?.question || "Why did campaign performance drop last week?"}”
              </h2>
            </div>
          </div>

          <div className="header-status-indicator">
            {isYourTurn ? (
              <span className="turn-frozen-pill">
                <Mic size={13} className="animate-pulse" />
                <span>You are speaking (Frozen)</span>
              </span>
            ) : (
              <span className="ready-status-pill">
                <Sparkles size={13} className="text-accent" />
                <span>Grounded in your notes</span>
              </span>
            )}
          </div>
        </div>

        {/* Primary Answer Section: WHAT TO SAY ALOUD */}
        <div className={`answer-spoken-box ${isYourTurn ? 'spoken-box-frozen' : ''}`}>
          <div className="spoken-box-top">
            <span className="spoken-label">
              {isYourTurn ? "Your Cue (Frozen during speech):" : "Say This Aloud:"}
            </span>

            <div className="spoken-quick-actions">
              <button
                type="button"
                className="action-icon-pill"
                onClick={() => speakText(displayedSay)}
                title="Listen to spoken response quietly"
              >
                <Volume2 size={13} className={speechActive ? 'text-accent' : ''} />
                <span>Listen</span>
              </button>

              <button
                type="button"
                className="action-icon-pill"
                onClick={() => handleCopy(displayedSay)}
                title="Copy answer to clipboard"
              >
                {copied ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <p className="spoken-phrase-content">
            “{displayedSay}”
          </p>

          {/* Turn-Taking Button: Freeze / Done Speaking */}
          <div className="spoken-turn-controls">
            {!isYourTurn ? (
              <button
                type="button"
                className="btn-turn-start"
                onClick={() => triggerUserSpeaking("Yeah, happy to address that. The primary driver...")}
                title="Click when you start speaking to freeze this answer"
              >
                <Mic size={14} />
                <span>I'm speaking (Freeze answer)</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-turn-done"
                onClick={triggerUserFinished}
                title="Click when you finish speaking to return to listening"
              >
                <Check size={14} />
                <span>Done speaking (Return to quiet listening)</span>
              </button>
            )}

            {/* Disclosure: Short Glance vs Full Version */}
            {!isYourTurn && (
              <button
                type="button"
                className="btn-toggle-disclosure"
                onClick={() => setDisclosureLevel(disclosureLevel === 'expanded' ? 'glance' : 'expanded')}
              >
                {disclosureLevel === 'expanded' ? "Show shorter answer" : "+ Full executive version"}
              </button>
            )}
          </div>
        </div>

        {/* Key Talking Points & Numbers from Notes */}
        {activeQuestion?.glanceBullets && activeQuestion.glanceBullets.length > 0 && (
          <div className="answer-key-points-section">
            <span className="key-points-label">
              <Hash size={13} /> Key Points & Metrics (from your notes):
            </span>
            <div className="key-points-chips">
              {activeQuestion.glanceBullets.map((bullet, idx) => (
                <span key={idx} className="point-chip">
                  {bullet}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Extra Information & Strategic Deep Dive */}
        <div className="answer-extra-info-box">
          <div className="extra-info-header">
            <Lightbulb size={14} className="text-accent" />
            <strong>Extra Information & Context (If they drill deeper):</strong>
          </div>
          <p className="extra-info-text">
            {activeQuestion?.supportingContext ||
             activeQuestion?.extraInformation ||
             "Background from your notes: Baseline demand remains healthy on Search (+12% volume lift). Tuesday's test will validate stabilization before scaling budget."}
          </p>
        </div>

        {/* Stalling Phrase Display (If user clicked "I need a second") */}
        {stallingPhrase && (
          <div className="stalling-alert-box animate-fade-in">
            <div className="stall-top">
              <span className="stall-label">Say to buy thinking time:</span>
              <button className="stall-close-btn" onClick={() => setStallingPhrase(null)}>×</button>
            </div>
            <p className="stall-text">“{stallingPhrase}”</p>
          </div>
        )}

        {/* Safe Response Recommendation if question is unknown/not in notes */}
        {isUnknown && (
          <div className="safe-answer-box animate-fade-in">
            <div className="safe-badge-tag">
              <AlertCircle size={13} />
              <span>Safe Answer (Preserve Credibility — Not in notes)</span>
            </div>
            <p className="safe-text">
              “I want to be precise and verify the exact audited figure rather than give you an off-the-cuff number. Let me pull that report post-meeting and follow up directly.”
            </p>
          </div>
        )}

        {/* Emergency Rescue Dock */}
        <div className="answer-card-rescue-bar">
          <button
            type="button"
            className="btn-rescue-stall"
            onClick={triggerBuyMeASecond}
            title="Get a natural phrase to buy thinking time"
          >
            <Clock size={13} />
            <span>I need a second</span>
          </button>

          <button
            type="button"
            className="btn-rescue-panic"
            onClick={() => triggerImStuck(true)}
            title="My mind went completely blank — rescue me"
          >
            <span>😭 I'm stuck</span>
          </button>

          <span className="quiet-guarantee-note">
            Aside is quiet until needed · Answers freeze when you speak
          </span>
        </div>
      </div>

      {/* 3. ASK OR HEAR A QUESTION INPUT BAR */}
      <div className="copilot-ask-section glass-panel">
        <form onSubmit={handleCustomSubmit} className="copilot-search-form">
          <div className="search-input-group">
            <Mic size={16} className={isLiveListening ? "text-accent animate-pulse" : "text-tertiary"} />
            <input
              type="text"
              placeholder="Ask anything or paste what someone just asked in Teams, Zoom, or Meet..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="copilot-ask-input"
            />
          </div>
          <button type="submit" className="btn-submit-question">
            <span>Get Answer</span>
            <Send size={14} />
          </button>
        </form>

        {/* Quick Question Chips from Notes */}
        <div className="quick-test-questions-row">
          <span className="quick-label">Or test sample questions:</span>
          <div className="quick-chips-scroll">
            {demoScenarios.slice(0, 7).map((sc, idx) => (
              <button
                key={sc.id || idx}
                type="button"
                className={`quick-q-chip ${activeQuestion?.question === sc.question ? 'active' : ''}`}
                onClick={() => selectQuestion(sc)}
              >
                <span>{sc.question}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. QUESTIONS HISTORY TIMELINE */}
      {questionsFeed && questionsFeed.length > 0 && (
        <div className="copilot-history-panel glass-panel">
          <div className="history-panel-header">
            <h3 className="history-heading">Meeting Questions History</h3>
            <span className="history-count">{questionsFeed.length} questions logged</span>
          </div>

          <div className="history-items-list">
            {questionsFeed.map((q, idx) => (
              <div
                key={q.id || idx}
                className={`history-item-row ${activeQuestion?.question === q.question ? 'current-active-row' : ''}`}
                onClick={() => selectQuestion(q)}
              >
                <div className="history-row-meta">
                  <span className="history-speaker">{q.speaker || "Meeting Attendee"}</span>
                  <span className="history-question-title">“{q.question}”</span>
                </div>
                <div className="history-row-right">
                  <span className="history-preview-snippet">
                    {q.glanceSay?.slice(0, 65)}...
                  </span>
                  <ChevronRight size={14} className="history-arrow" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slide-out Notes Drawer */}
      <NotesDrawer
        isOpen={isNotesDrawerOpen}
        onClose={() => setIsNotesDrawerOpen(false)}
      />
    </div>
  );
}
