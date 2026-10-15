import React, { useState, useEffect } from 'react';
import { useMeeting } from '../context/MeetingContext';
import { NotesDrawer } from './NotesDrawer';
import { AiSettingsModal } from './AiSettingsModal';
import { NATURAL_HUMAN_FILLERS, THINKING_INTRO_SENTENCES } from '../constants/mockData';
import {
  Mic,
  MicOff,
  Radio,
  Copy,
  Check,
  Clock,
  Sparkles,
  Zap,
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
  RotateCcw,
  BookOpen,
  Square
} from 'lucide-react';

export function PrivateMeetingView({ onOpenPairingModal }) {
  const {
    meetingConfig,
    activeQuestion,
    setActiveQuestion,
    isQuestionActive,
    setIsQuestionActive,
    conversationState,
    frozenSuggestion,
    triggerUserSpeaking,
    triggerUserFinished,
    triggerBuyMeASecond,
    stallingPhrase,
    setStallingPhrase,
    triggerImStuck,
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
    micVolumeLevel,
    isCompactMode,
    setIsCompactMode,
    isNotesDrawerOpen,
    setIsNotesDrawerOpen,
    aiEngineMode,
    setAiEngineMode,
    clearActiveQuestion,
    openaiApiKey,
    openaiModel,
    isAiSettingsOpen,
    setIsAiSettingsOpen,
    isGeneratingWithAi,
    cheatSheet,
    demoScenarios,
    selectScenarioByIndex,
    isManualCaptureActive,
    manualCapturedTranscript,
    toggleManualQuestionCapture,
    lastEmptyCaptureNotice,
    setLastEmptyCaptureNotice
  } = useMeeting();

  const [customInput, setCustomInput] = useState('');
  const [copiedQuick, setCopiedQuick] = useState(false);
  const [copiedDetailed, setCopiedDetailed] = useState(false);
  const [copiedFiller, setCopiedFiller] = useState(null);
  const [selectedIntro, setSelectedIntro] = useState(null);

  useEffect(() => {
    setSelectedIntro(null);
    if (activeQuestion) {
      const timer = setTimeout(() => {
        const el = document.getElementById('active-answer-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [activeQuestion?.id]);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    askCustomQuestion(customInput.trim(), "Meeting Participant");
    setCustomInput('');
  };

  const handleCopyQuick = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedQuick(true);
    setTimeout(() => setCopiedQuick(false), 2000);
  };

  const handleCopyDetailed = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedDetailed(true);
    setTimeout(() => setCopiedDetailed(false), 2000);
  };

  const handleCopyFiller = (fillerText) => {
    const clean = fillerText.replace(/^[“”"']|[“”"']$/g, '');
    navigator.clipboard?.writeText(clean);
    setCopiedFiller(clean);
    setTimeout(() => setCopiedFiller(null), 2200);
  };

  const isYourTurn = conversationState === 'YOUR_TURN';
  const quickSayText = isYourTurn && frozenSuggestion
    ? frozenSuggestion
    : selectedIntro && (isGeneratingWithAi || activeQuestion?.isDetailedLoading || activeQuestion?.isSynthesizing)
      ? selectedIntro
      : (activeQuestion?.quickSay || activeQuestion?.glanceSay || "That's a really great question — let me break down how I look at that...");

  const quickBullets = activeQuestion?.quickBullets || activeQuestion?.glanceBullets || [];
  const detailedSayText = activeQuestion?.expandedSay || activeQuestion?.glanceSay || "";
  const extraInfoText = activeQuestion?.supportingContext || activeQuestion?.extraInformation || "";
  const isDetailedLoading = Boolean(activeQuestion?.isDetailedLoading);

  const isUnknown = activeQuestion?.category === 'unknown';
  const displayedSay = quickSayText;

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
          {/* Manual Start / Stop Question Trigger (One Click to Start, One Click to Answer ASAP) */}
          <button
            type="button"
            className={`btn-manual-capture-bar ${isManualCaptureActive ? 'recording-active' : ''}`}
            onClick={toggleManualQuestionCapture}
            title={isManualCaptureActive ? "Interviewer speaking... Click to stop and get answer immediately! (or tap Space)" : "Click to listen for question or interruption (or tap Space)"}
          >
            {isManualCaptureActive ? (
              <>
                <Square size={13} className="fill-white" />
                <span className="btn-manual-title">Stop & Answer ASAP ⚡</span>
                <span className="btn-key-tag">Space</span>
              </>
            ) : (
              <>
                <Mic size={14} className="text-accent" />
                <span className="btn-manual-title">Listen for Question</span>
                <span className="btn-key-tag">Space</span>
              </>
            )}
          </button>

          {/* Live Mic Listening Toggle (Web Speech API) */}
          <button
            type="button"
            className={`btn-audio-listen ${isLiveListening ? 'listening-active' : ''}`}
            onClick={toggleLiveListening}
            title={isLiveListening ? "Microphone listening is active. Click to pause." : "Click to start live microphone listening for meeting questions."}
          >
            {isLiveListening ? (
              <>
                <Radio size={14} className="animate-pulse text-accent" />
                <span>● Listening Active</span>
              </>
            ) : (
              <>
                <Mic size={14} />
                <span>Start Mic Listening</span>
              </>
            )}
          </button>

          {/* Live Mic Volume Level Meter Pill */}
          {isLiveListening && (
            <div className="mic-volume-indicator" title={`Live microphone input: ${micVolumeLevel}%`}>
              <span className={`volume-dot ${micVolumeLevel > 5 ? 'dot-active pulse-green' : ''}`}>●</span>
              <span className="volume-text">MIC {micVolumeLevel > 0 ? `${micVolumeLevel}%` : 'READY'}</span>
              <div className="volume-meter-track">
                <div className="volume-meter-fill" style={{ width: `${Math.max(8, micVolumeLevel)}%` }} />
              </div>
            </div>
          )}

          {/* Notes & Context Drawer Button */}
          <button
            type="button"
            className="btn-open-notes"
            onClick={() => setIsNotesDrawerOpen(true)}
            title="View or paste your meeting notes"
          >
            <FileText size={14} className="text-accent" />
            <span>My Notes ({cheatSheet?.importantNumbers?.length || 0} metrics)</span>
          </button>

          {/* Real-Time Engine & Settings */}
          <button
            type="button"
            className={`btn-ai-engine ${aiEngineMode === 'ai' ? 'ai-connected' : 'ai-offline'}`}
            onClick={() => setIsAiSettingsOpen(true)}
            title="Configure Answering Engine (Verified Notes vs AI Enhanced)"
          >
            {aiEngineMode === 'ai' ? (
              <>
                <Zap size={14} className="text-accent fill-accent" />
                <span>⚡ AI Enhanced</span>
              </>
            ) : (
              <>
                <Check size={14} className="text-sage" />
                <span>✓ Verified Notes Engine</span>
              </>
            )}
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

      {/* Live AI Generating Indicator */}
      {isGeneratingWithAi && (
        <div className="ai-live-generating-pill glass-panel animate-fade-in">
          <Zap size={14} className="text-accent animate-pulse" />
          <span>Synthesizing live answer with {openaiModel} using your notes...</span>
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

      {/* 2. THE HERO ANSWER CARD OR QUIET STANDBY HUB */}
      {!activeQuestion ? (
        <div className="copilot-standby-card glass-panel animate-fade-in">
          <div className="standby-radar-wrapper">
            <div className={`standby-pulse-circle ${isLiveListening ? 'pulse-active' : 'pulse-paused'}`}>
              {isLiveListening ? (
                <Radio size={36} className="radar-icon text-accent animate-pulse" />
              ) : (
                <Mic size={36} className="radar-icon text-secondary" />
              )}
            </div>
          </div>

          <div className="standby-content-box">
            <div className="standby-badge-row">
              <span className={`standby-status-badge ${isLiveListening ? 'status-listening-live' : 'status-listening-off'}`}>
                <span className={`standby-dot ${isLiveListening ? 'live-dot-green' : 'standby-dot-amber'}`}></span>
                {isLiveListening ? "Active Listening Mode" : "Microphone Paused"}
              </span>
              <span className="standby-notes-count">
                {cheatSheet?.importantNumbers?.length
                  ? `📋 Grounded in your notes (${cheatSheet.importantNumbers.length} metrics loaded)`
                  : "📋 No notes loaded yet (Ready for your new meeting)"}
              </span>
            </div>

            <h2 className="standby-main-title">
              {isLiveListening ? "Aside is quietly listening in the background..." : "Ready to listen to your meeting"}
            </h2>

            <p className="standby-description">
              {isLiveListening
                ? "Aside stays completely quiet while others speak. When someone directs a question to you in Microsoft Teams, Zoom, or Google Meet, instant talking points and verified figures from your notes will appear right here."
                : "Turn on your microphone so Aside can hear questions asked in your meeting. You can also paste or type questions below at any time."}
            </p>

            {/* Standby Actions */}
            <div className="standby-action-bar">
              <button
                type="button"
                className={`btn-standby-listen ${isLiveListening ? 'btn-listening-on' : 'btn-listening-start'}`}
                onClick={toggleLiveListening}
              >
                {isLiveListening ? (
                  <>
                    <Radio size={16} className="animate-pulse" />
                    <span>● Listening to Meeting (Click to Pause)</span>
                  </>
                ) : (
                  <>
                    <Mic size={16} />
                    <span>Turn On Microphone Listening</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-standby-demo"
                onClick={() => selectScenarioByIndex(0)}
                title="Preview what a live answer card looks like"
              >
                <Sparkles size={14} className="text-accent" />
                <span>Test Sample Question</span>
              </button>
            </div>

            {/* Live speech feedback ticker */}
            <div className="standby-live-hearing-bar">
              <span className="hearing-label">Hearing Now:</span>
              <span className="hearing-text">
                {liveTranscript ? (
                  `“${liveTranscript}”`
                ) : micVolumeLevel > 6 ? (
                  <span className="text-accent font-semibold">🎙️ Voice detected ({micVolumeLevel}%) — speech recognition is listening...</span>
                ) : isLiveListening ? (
                  "Listening quietly... waiting for a question to be asked"
                ) : (
                  "Microphone is off (click above to start)"
                )}
              </span>
              {liveTranscript && (
                <button
                  type="button"
                  className="btn-hearing-instant-ask"
                  onClick={() => askCustomQuestion(liveTranscript, "Meeting Participant")}
                  title="Generate answer for what was just heard right now"
                >
                  <Zap size={12} className="text-accent" />
                  <span>Get Answer</span>
                </button>
              )}
            </div>

            {/* Standby Live Mic Meter */}
            {isLiveListening && (
              <div className="standby-mic-meter-box">
                <div className="standby-meter-header">
                  <span className="meter-label">
                    <Mic size={13} className={micVolumeLevel > 6 ? "text-accent animate-pulse" : "text-secondary"} />
                    <span>Microphone Input Level:</span>
                  </span>
                  <span className="meter-val-badge">
                    {micVolumeLevel > 0 ? `${micVolumeLevel}%` : 'Ready'}
                  </span>
                </div>
                <div className="standby-meter-track">
                  <div
                    className="standby-meter-fill"
                    style={{
                      width: `${Math.max(4, micVolumeLevel)}%`,
                      backgroundColor: micVolumeLevel > 15 ? '#10b981' : micVolumeLevel > 5 ? '#eab308' : 'rgba(255,255,255,0.2)'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Empty Speech Capture Fallback Card (Shows if Space/Stop was clicked but mic didn't catch speech) */}
            {lastEmptyCaptureNotice && (
              <div className="empty-capture-fallback-card glass-panel animate-fade-in">
                <div className="fallback-header">
                  <AlertCircle size={18} className="text-amber" />
                  <div>
                    <strong>Didn't catch audio from microphone?</strong>
                    <p>Select what was asked below or type it to generate your talking points immediately:</p>
                  </div>
                  <button
                    type="button"
                    className="btn-close-fallback"
                    onClick={() => setLastEmptyCaptureNotice(false)}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
                <div className="fallback-chips-grid">
                  <button
                    type="button"
                    className="fallback-chip-btn"
                    onClick={() => {
                      setLastEmptyCaptureNotice(false);
                      askCustomQuestion("Can you walk me through your background and why you are interested in Crealytics?", "Interviewer");
                    }}
                  >
                    💬 Walk me through your background & why Crealytics
                  </button>
                  <button
                    type="button"
                    className="fallback-chip-btn"
                    onClick={() => {
                      setLastEmptyCaptureNotice(false);
                      askCustomQuestion("How do you handle underperforming campaigns or tight client ROAS targets?", "Interviewer");
                    }}
                  >
                    💬 Optimizing ROAS & underperforming campaigns
                  </button>
                  <button
                    type="button"
                    className="fallback-chip-btn"
                    onClick={() => {
                      setLastEmptyCaptureNotice(false);
                      askCustomQuestion("What is your experience with Retail Media Networks and Amazon/Walmart sponsored ads?", "Interviewer");
                    }}
                  >
                    💬 Retail Media & Sponsored Ads expertise
                  </button>
                  <button
                    type="button"
                    className="fallback-chip-btn"
                    onClick={() => {
                      setLastEmptyCaptureNotice(false);
                      askCustomQuestion("Tell me about a time you handled conflict with a colleague or stakeholder.", "Interviewer");
                    }}
                  >
                    💬 Handling conflict with colleagues / stakeholders
                  </button>
                  <button
                    type="button"
                    className="fallback-chip-btn"
                    onClick={() => {
                      setLastEmptyCaptureNotice(false);
                      askCustomQuestion("What makes someone a good teammate, and how do you approach collaboration?", "Interviewer");
                    }}
                  >
                    💬 What makes someone a good teammate?
                  </button>
                  <button
                    type="button"
                    className="fallback-chip-btn"
                    onClick={() => {
                      setLastEmptyCaptureNotice(false);
                      askCustomQuestion("How do you handle disagreements with colleagues?", "Interviewer");
                    }}
                  >
                    💬 Handling disagreements with colleagues
                  </button>
                  <button
                    type="button"
                    className="fallback-chip-btn"
                    onClick={() => {
                      setLastEmptyCaptureNotice(false);
                      askCustomQuestion("Tell me something about yourself that isn't on your CV.", "Interviewer");
                    }}
                  >
                    💬 Tell me something not on your CV
                  </button>
                  <button
                    type="button"
                    className="fallback-chip-btn"
                    onClick={() => {
                      setLastEmptyCaptureNotice(false);
                      askCustomQuestion("What kind of books do you read, and what are your favourites?", "Interviewer");
                    }}
                  >
                    💬 Favourite books & reading
                  </button>
                </div>
              </div>
            )}

            {/* How Aside Hears Attendees Audio Tip */}
            <div className="standby-audio-tip-banner">
              <span className="tip-icon">💡</span>
              <div className="tip-text">
                <strong>How Aside hears other attendees:</strong> Meeting audio should play through your laptop/monitor speakers (or set meeting audio output to speakers) so your laptop microphone picks it up. You can also type or paste any question in the input bar below!
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div id="active-answer-section" className="copilot-main-answer-card glass-panel animate-fade-in">
          {/* Question Header */}
          <div className="answer-card-header">
            <div className="header-speaker-tag">
              <span className="speaker-avatar-circle">💬</span>
              <div>
                <span className="speaker-name-badge">
                  {activeQuestion?.speaker || "Meeting Participant"} asked:
                </span>
                <h2 className="main-question-text">
                  “{activeQuestion?.question}”
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

              {/* Listen for Next Question Button */}
              <button
                type="button"
                className={`btn-listen-next ${isManualCaptureActive ? 'recording-active' : ''}`}
                onClick={toggleManualQuestionCapture}
                title="Click or press Space to listen for next question or interruption"
              >
                <Mic size={13} className={isManualCaptureActive ? "fill-white" : "text-accent"} />
                <span>{isManualCaptureActive ? "Stop & Answer ⚡" : "Listen for Next (Space)"}</span>
              </button>

              {/* Dismiss / Return to Standby Button */}
              <button
                type="button"
                className="btn-dismiss-answer"
                onClick={() => {
                  if (clearActiveQuestion) {
                    clearActiveQuestion();
                  } else {
                    setActiveQuestion(null);
                    setIsQuestionActive(false);
                  }
                  if (!isLiveListening) {
                    toggleLiveListening();
                  }
                }}
                title="Clear this answer and return to quiet listening standby"
              >
                <RotateCcw size={13} />
                <span>Back to Standby</span>
              </button>
            </div>
          </div>

          {/* Answer Status / Thinking Bar */}
          {isGeneratingWithAi || activeQuestion?.isSynthesizing ? (
            <div className="thinking-intro-bar thinking-synthesizing-active">
              <div className="thinking-intro-top-row">
                <div className="thinking-intro-left">
                  <span className="thinking-badge-icon">💭</span>
                  <span className="thinking-intro-title">
                    Say this right now while your answer synthesizes:
                  </span>
                </div>
                <div className="synthesizing-status-tag">
                  <span className="pulse-dot-coral"></span>
                  <span>Synthesizing answer from your notes...</span>
                </div>
              </div>

              <div className="thinking-intro-chips">
                {THINKING_INTRO_SENTENCES.map((intro, idx) => {
                  const clean = intro.replace(/^[“”"']|[“”"']$/g, '');
                  const isSelected = selectedIntro === clean || (!selectedIntro && quickSayText === clean);
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`thinking-intro-chip ${isSelected ? 'intro-chip-selected' : ''}`}
                      onClick={() => {
                        setSelectedIntro(clean);
                        handleCopyFiller(clean);
                      }}
                      title="Click to use this natural opener right now"
                    >
                      <span className="chip-quote">“</span>
                      <span>{clean}</span>
                      <span className="chip-quote">”</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="answer-status-banner-ready">
              <div className="status-ready-left">
                <span className="ready-check-icon">✓</span>
                <span className="ready-text-bold">Complete Answer Ready to Speak</span>
                <span className="ready-text-sub">• Read Box 1 below immediately</span>
              </div>
              <div className="compact-openers-row">
                <span className="openers-hint-text">Natural opener (optional):</span>
                {THINKING_INTRO_SENTENCES.slice(0, 3).map((intro, idx) => {
                  const clean = intro.replace(/^[“”"']|[“”"']$/g, '');
                  return (
                    <button
                      key={idx}
                      type="button"
                      className="compact-opener-chip"
                      onClick={() => {
                        setSelectedIntro(clean);
                        handleCopyFiller(clean);
                      }}
                      title="Click to copy this opener"
                    >
                      “{clean}”
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* DUAL-BOX PROGRESSIVE ANSWER ARCHITECTURE */}
          <div className="two-box-architecture-wrapper">

            {/* BOX 1: QUICK & FAST ANSWER (Immediate Simple Hook) */}
            <div className={`two-box-quick-card ${isYourTurn ? 'spoken-box-frozen' : ''}`}>
              <div className="box-card-top-row">
                <div className="box-badge-quick">
                  <Zap size={14} className="badge-icon-zap animate-pulse" />
                  <span className="box-badge-title">1. QUICK ANSWER</span>
                  <span className="box-badge-pill">
                    {activeQuestion?.fastModelName ? `Fast API (${activeQuestion.fastModelName})` : "Instant • Say Right Away"}
                  </span>
                </div>

                <div className="box-card-actions">
                  <button
                    type="button"
                    className="action-icon-pill"
                    onClick={() => handleCopyQuick(quickSayText)}
                    title="Copy quick answer"
                  >
                    {copiedQuick ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
                    <span>{copiedQuick ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Spoken Quote */}
              <p className="box-quick-quote">
                “{quickSayText}”
              </p>

              {/* Fast Metric Bullets & Talking Points */}
              {quickBullets && quickBullets.length > 0 && (
                <div className="box-quick-bullets-row">
                  {quickBullets.map((bullet, idx) => (
                    <span key={idx} className="box-quick-pill">
                      <Hash size={11} className="pill-hash-icon" />
                      <span>{bullet.replace(/^[•*-]\s*/, '')}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Turn Controls for Quick Answer */}
              <div className="box-quick-turn-row">
                {!isYourTurn ? (
                  <button
                    type="button"
                    className="btn-turn-start"
                    onClick={() => triggerUserSpeaking(quickSayText)}
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
              </div>
            </div>

            {/* Natural Human Fillers & Transition Bridges */}
            <div className="natural-fillers-bar">
              <div className="fillers-top-row">
                <span className="fillers-label">
                  <Sparkles size={12} className="text-accent" /> Natural conversational bridges:
                </span>
                <span className="fillers-hint">
                  {copiedFiller ? `✓ Copied: "${copiedFiller}"` : "Click any filler to copy"}
                </span>
              </div>
              <div className="fillers-chips">
                {NATURAL_HUMAN_FILLERS.map((filler, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`filler-chip ${copiedFiller === filler.replace(/^[“”"']|[“”"']$/g, '') ? 'filler-copied' : ''}`}
                    onClick={() => handleCopyFiller(filler)}
                    title="Click to copy or say this natural transition aloud"
                  >
                    {filler}
                  </button>
                ))}
              </div>
            </div>

            {/* BOX 2: DETAILED FOLLOW-UP (Seamless In-Depth Deep Dive) */}
            <div className={`two-box-detailed-card ${isDetailedLoading ? 'box-detailed-loading' : ''}`}>
              <div className="box-card-top-row">
                <div className="box-badge-detailed">
                  <BookOpen size={14} className="badge-icon-book" />
                  <span className="box-badge-title">2. CONTINUATION (DEEP DIVE)</span>
                  <span className="box-badge-pill pill-detailed">
                    {isDetailedLoading
                      ? `⚡ Deep Dive Generating (${openaiModel || 'AI'})...`
                      : activeQuestion?.detailedModelName
                        ? `Continues from Box 1 (${activeQuestion.detailedModelName})`
                        : "Seamless Flow • Continues from Box 1"}
                  </span>
                </div>

                {!isDetailedLoading && (
                  <div className="box-card-actions">
                    <button
                      type="button"
                      className="action-icon-pill"
                      onClick={() => handleCopyDetailed(detailedSayText)}
                      title="Copy detailed answer"
                    >
                      {copiedDetailed ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
                      <span>{copiedDetailed ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                )}
              </div>

              {isDetailedLoading && !detailedSayText ? (
                <div className="detailed-loading-box animate-fade-in">
                  <div className="loading-headline-row">
                    <Sparkles size={14} className="text-accent animate-pulse" />
                    <strong>Deep-dive follow-up is generating in the background...</strong>
                  </div>
                  <p className="loading-helper-text">
                    Start answering using <strong>Box 1</strong> above right now! The in-depth breakdown and strategic context will populate right here seamlessly.
                  </p>
                  <div className="skeleton-bar-wrapper">
                    <div className="skeleton-bar bar-long"></div>
                    <div className="skeleton-bar bar-medium"></div>
                    <div className="skeleton-bar bar-short"></div>
                  </div>
                </div>
              ) : (
                <div className="detailed-body-content animate-fade-in">
                  {isDetailedLoading && (
                    <div className="detailed-polishing-pill-banner">
                      <Sparkles size={12} className="text-accent animate-pulse" />
                      <span>Verified notes loaded below. AI refining follow-up in background...</span>
                    </div>
                  )}
                  <div className="detailed-paragraphs">
                    {detailedSayText ? (
                      detailedSayText.split('\n\n').map((paragraph, pIdx) => (
                        <p key={pIdx} className="detailed-p-text">
                          {paragraph}
                        </p>
                      ))
                    ) : (
                      <p className="detailed-p-text">
                        {activeQuestion?.glanceSay || "Detailed breakdown ready in notes."}
                      </p>
                    )}
                  </div>

                  {extraInfoText && (
                    <div className="detailed-extra-context-box">
                      <div className="extra-context-title">
                        <Lightbulb size={13} className="text-accent" />
                        <span>Strategic Context & Rationale (If they drill deeper):</span>
                      </div>
                      <p className="extra-context-body">
                        {extraInfoText}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

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
      )}

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
          <button
            type="button"
            className={`btn-search-manual-capture ${isManualCaptureActive ? 'recording-active' : ''}`}
            onClick={toggleManualQuestionCapture}
            title={isManualCaptureActive ? "Stop listening & get answer immediately (Space)" : "Click to listen for question or interruption (Space)"}
          >
            {isManualCaptureActive ? (
              <>
                <Square size={13} className="fill-white" />
                <span>Stop & Answer ⚡</span>
              </>
            ) : (
              <>
                <Mic size={14} />
                <span>Listen Question</span>
              </>
            )}
          </button>
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

      {/* OpenAI GPT Settings Modal */}
      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
      />
    </div>
  );
}
