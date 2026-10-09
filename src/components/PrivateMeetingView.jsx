import React, { useState } from 'react';
import { useMeeting } from '../context/MeetingContext';
import { PhoneCompanion } from './PhoneCompanion';
import { MiniFloatingAssistant } from './MiniFloatingAssistant';
import {
  Mic,
  Shield,
  ShieldAlert,
  Smartphone,
  Send,
  Monitor,
  ChevronRight,
  Sparkles,
  Radio,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function PrivateMeetingView({ onOpenPairingModal }) {
  const {
    userName,
    meetingConfig,
    isScreenSharing,
    toggleScreenSharing,
    isPhonePaired,
    pairingCode,
    sendTestPingToPhone,
    setSimulatedPhoneStatus,
    viewMode,
    setViewMode,
    wrapUpMeeting,
    conversationState,
    userAudio,
    meetingAudio,
    activeScenarioIndex,
    selectScenarioByIndex,
    demoScenarios,
    triggerParticipantSpeaking,
    triggerQuestionDetected,
    triggerQuestionNotForUser,
    triggerUserSpeaking,
    triggerUserFinished,
    askCustomQuestion,
    triggerImStuck,
    conversationHistory,
    systemNotice,
    targetingInfo
  } = useMeeting();

  const [customInput, setCustomInput] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    askCustomQuestion(customInput, "Meeting Participant");
    setCustomInput('');
  };

  // Determine active speaker from audio streams
  const isSarahSpeaking = meetingAudio.isSpeaking && meetingAudio.speaker.includes('Sarah');
  const isMarcusSpeaking = meetingAudio.isSpeaking && meetingAudio.speaker.includes('Marcus');
  const isAlexSpeaking = meetingAudio.isSpeaking && meetingAudio.speaker.includes('Alex');
  const isUserSpeaking = userAudio.isSpeaking;

  return (
    <div className="private-meeting-container animate-fade-in">
      {/* Top Toolbar */}
      <div className="meeting-top-toolbar glass-panel">
        <div className="meeting-info-group">
          <div className="meeting-live-pulse">
            <span className="live-pulse-dot"></span>
            <span className="live-pulse-text">{meetingConfig.name}</span>
          </div>
          <span className="meeting-sim-pill">Zoom / Meet Simulation</span>
        </div>

        {/* View Mode Switcher */}
        <div className="view-mode-tabs">
          <button
            className={`view-tab-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Desktop Meeting with Floating Aside + Phone Companion"
          >
            <Monitor size={14} />
            <span>Dual Surface (Desktop + Phone)</span>
          </button>
          <button
            className={`view-tab-btn ${viewMode === 'desktop-only' ? 'active' : ''}`}
            onClick={() => setViewMode('desktop-only')}
          >
            <span>Desktop Only</span>
          </button>
          <button
            className={`view-tab-btn ${viewMode === 'phone-only' ? 'active' : ''}`}
            onClick={() => setViewMode('phone-only')}
          >
            <Smartphone size={14} />
            <span>Phone Only (Beside Laptop)</span>
          </button>
        </div>

        {/* Phone Companion Status & Quick Pair Button */}
        <button
          className={`phone-toolbar-pill ${isPhonePaired ? 'paired' : ''}`}
          onClick={onOpenPairingModal}
          title="Laptop is ears + brain · Click to view phone pairing"
        >
          <Smartphone size={14} className={isPhonePaired ? "text-accent" : "text-tertiary"} />
          <span>{isPhonePaired ? `Phone: Ready (${pairingCode})` : "Pair Phone"}</span>
        </button>

        {/* Screen Sharing Toggle */}
        <button
          className={`screen-share-quick-btn ${isScreenSharing ? 'active-share' : ''}`}
          onClick={() => toggleScreenSharing()}
          title="Simulate sharing your computer screen on Zoom/Meet"
        >
          {isScreenSharing ? (
            <>
              <ShieldAlert size={14} className="text-panic" />
              <span>Screen Shared (Active 🔒)</span>
            </>
          ) : (
            <>
              <Shield size={14} />
              <span>I'm sharing my screen</span>
            </>
          )}
        </button>

        {/* Wrap Up Button */}
        <button className="btn-wrapup" onClick={wrapUpMeeting}>
          <span>End Meeting</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* System Toast / Guidance Notice */}
      {systemNotice && (
        <div className="system-notice-banner animate-fade-in">
          <Sparkles size={14} className="text-accent" />
          <span>{systemNotice}</span>
        </div>
      )}

      {/* SCREEN SHARING PRIVACY MODE ACTIVE BANNER */}
      {isScreenSharing && (
        <div className="screen-share-active-alert glass-panel animate-fade-in">
          <div className="share-alert-left">
            <ShieldAlert size={18} className="text-panic" />
            <div>
              <strong>Screen-Sharing Privacy Mode is Active 🔒</strong>
              <p>Your screen is being shared on Zoom/Meet. Desktop hints are hidden for privacy. Prompts are streaming to your paired phone display.</p>
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

      {/* QUICK INTERACTIVE SIMULATOR GUIDE */}
      <div className="meeting-flow-guide-bar glass-panel">
        <div className="flow-guide-header">
          <div className="flow-guide-title-group">
            <span className="flow-guide-icon">💡</span>
            <div>
              <h2 className="flow-guide-heading">How Aside Works (Try it in 3 steps):</h2>
              <p className="flow-guide-desc">
                Aside is quiet during your call until someone asks you something. When you start speaking, it freezes so you never get distracted.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`btn-toggle-diagnostics ${showDiagnostics ? 'active' : ''}`}
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            title="Toggle advanced audio monitors & state machine"
          >
            <Sliders size={13} />
            <span>{showDiagnostics ? "Hide Diagnostics" : "⚙️ Diagnostics & State Machine"}</span>
            {showDiagnostics ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* 3 Clear, Intuitive Action Buttons */}
        <div className="flow-quick-test-row">
          <button
            type="button"
            className="btn-flow-action btn-flow-question"
            onClick={() => triggerQuestionDetected(demoScenarios[0])}
            title="Simulate Sarah asking a question"
          >
            <span className="flow-step-badge">Step 1</span>
            <span>▶ Sarah asks: “Why did campaign underperform?”</span>
          </button>

          <button
            type="button"
            className="btn-flow-action btn-flow-speak"
            onClick={() => triggerUserSpeaking("Yeah, so I think there were two main things. The creative changed mid-week and CPC went up...")}
            title="Simulate you speaking"
          >
            <span className="flow-step-badge">Step 2</span>
            <span>🗣️ You speak (Watch cue freeze)</span>
          </button>

          <button
            type="button"
            className="btn-flow-action btn-flow-finish"
            onClick={triggerUserFinished}
            title="Simulate you finishing speaking"
          >
            <span className="flow-step-badge">Step 3</span>
            <span>✓ You finish (Back to quiet listening)</span>
          </button>
        </div>
      </div>

      {/* OPTIONAL COLLAPSIBLE ADVANCED DIAGNOSTICS */}
      {showDiagnostics && (
        <div className="diagnostics-drawer animate-fade-in">
          {/* SECTION 2: AUDIO ARCHITECTURE DUAL MONITOR */}
          <div className="audio-architecture-bar glass-panel">
            <div className="audio-stream-card">
              <div className="stream-header">
                <div className="stream-title-group">
                  <Radio size={14} className={meetingAudio.isSpeaking ? "text-accent animate-pulse" : "text-tertiary"} />
                  <span className="stream-title">Meeting Audio Stream</span>
                </div>
                <span className={`stream-status ${meetingAudio.isSpeaking ? 'status-active' : 'status-standby'}`}>
                  {meetingAudio.isSpeaking ? `🎙️ ${meetingAudio.speaker} speaking` : "Idle"}
                </span>
              </div>
              <div className="audio-visualizer-track">
                {[20, 45, 80, 55, 30, 65, 90, 40, 25, 60, 85, 35].map((h, i) => (
                  <span
                    key={i}
                    className="audio-wave-bar meeting-bar"
                    style={{
                      height: meetingAudio.isSpeaking ? `${Math.min(100, (h * meetingAudio.level) / 50)}%` : '15%',
                      opacity: meetingAudio.isSpeaking ? 1 : 0.3
                    }}
                  />
                ))}
              </div>
              <span className="stream-desc">Analyzes for participant questions, targeting & continuous context</span>
            </div>

            <div className="stream-divider">⇄</div>

            <div className="audio-stream-card user-stream">
              <div className="stream-header">
                <div className="stream-title-group">
                  <Mic size={14} className={userAudio.isSpeaking ? "text-freeze animate-pulse" : "text-tertiary"} />
                  <span className="stream-title">User Microphone Stream</span>
                </div>
                <span className={`stream-status ${userAudio.isSpeaking ? 'status-freeze' : 'status-standby'}`}>
                  {userAudio.isSpeaking ? "🗣️ USER IS SPEAKING (Frozen)" : "Listening standby"}
                </span>
              </div>
              <div className="audio-visualizer-track">
                {[35, 75, 95, 60, 45, 85, 100, 50, 40, 70, 90, 30].map((h, i) => (
                  <span
                    key={i}
                    className="audio-wave-bar user-bar"
                    style={{
                      height: userAudio.isSpeaking ? `${Math.min(100, (h * userAudio.level) / 50)}%` : '15%',
                      opacity: userAudio.isSpeaking ? 1 : 0.3
                    }}
                  />
                ))}
              </div>
              <span className="stream-desc">When you speak, Aside enters YOUR TURN and freezes — zero regeneration</span>
            </div>
          </div>

          {/* SECTION 3: CONVERSATION STATE MACHINE VISUALIZER */}
          <div className="state-machine-track glass-panel">
            <span className="state-track-label">Conversation State:</span>
            <div className="state-steps-row">
              <div className={`state-step-pill ${conversationState === 'LISTENING' ? 'active-listening' : ''}`}>
                <span className="step-dot">●</span>
                <span>LISTENING</span>
              </div>
              <span className="state-arrow">→</span>

              <div className={`state-step-pill ${conversationState === 'OTHER_PERSON_SPEAKING' ? 'active-participant' : ''}`}>
                <span>OTHER SPEAKING</span>
              </div>
              <span className="state-arrow">→</span>

              <div className={`state-step-pill ${conversationState === 'POSSIBLE_QUESTION' ? 'active-eval' : ''}`}>
                <span>POSSIBLE QUESTION</span>
              </div>
              <span className="state-arrow">→</span>

              <div className={`state-step-pill ${conversationState === 'QUESTION_CONFIRMED' ? 'active-confirmed' : ''}`}>
                <span>QUESTION CONFIRMED</span>
              </div>
              <span className="state-arrow">→</span>

              <div className={`state-step-pill ${conversationState === 'YOUR_TURN' ? 'active-yourturn' : ''}`}>
                <span>YOUR TURN (FROZEN)</span>
              </div>
              <span className="state-arrow">→</span>

              <div className={`state-step-pill ${conversationState === 'RESPONSE_FINISHED' ? 'active-finished' : ''}`}>
                <span>RESPONSE FINISHED</span>
              </div>
            </div>
          </div>

          {/* SECTION 23: DEMO / DEVELOPER CONTROLS BAR */}
          <div className="dev-controls-panel glass-panel">
            <div className="dev-controls-header">
              <span className="dev-tag">Developer / Demo Controls (Section 23)</span>
              <span className="dev-sub">Test turn-taking, targeting checks, speaker states & silence guarantees:</span>
            </div>

            <div className="dev-buttons-grid">
              <button
                type="button"
                className="btn-dev-action"
                onClick={() => triggerParticipantSpeaking("Sarah (VP Marketing)", "Let me frame the Q3 marketing numbers...")}
                title="Simulate participant speaking"
              >
                <span>🎙️ Participant speaking</span>
              </button>

              <button
                type="button"
                className="btn-dev-action highlight-btn"
                onClick={() => triggerQuestionDetected(demoScenarios[0])}
                title="Simulate question detected for user"
              >
                <span>✦ Question detected</span>
              </button>

              <button
                type="button"
                className="btn-dev-action"
                onClick={() => triggerQuestionNotForUser("Marcus (Growth Lead)", "Does anyone want coffee or water?")}
                title="Question not directed at user -> Aside remains silent"
              >
                <span>🚫 Question not for user</span>
              </button>

              <button
                type="button"
                className="btn-dev-action freeze-btn"
                onClick={() => triggerUserSpeaking("Yeah, so I think there were two main things. The creative changed mid-week and CPC went up...")}
                title="Simulate user speaking -> Freezes suggestion without regeneration"
              >
                <span>🗣️ User speaking (Freeze)</span>
              </button>

              <button
                type="button"
                className="btn-dev-action"
                onClick={triggerUserFinished}
                title="User finishes speaking -> Return to quiet listening"
              >
                <span>✓ User finished</span>
              </button>

              <button
                type="button"
                className="btn-dev-action"
                onClick={() => selectScenarioByIndex(1)}
                title="Unexpected question synthesized from earlier Marcus conversation context"
              >
                <span>✨ Unexpected question</span>
              </button>

              <button
                type="button"
                className="btn-dev-action"
                onClick={() => selectScenarioByIndex(8)}
                title="Muffled audio with Replay / Transcript options"
              >
                <span>⚠️ Low-confidence audio</span>
              </button>

              <button
                type="button"
                className="btn-dev-action panic-btn"
                onClick={() => triggerImStuck(true)}
                title="Emergency recovery modal"
              >
                <span>😭 I'm stuck</span>
              </button>

              <button
                type="button"
                className="btn-dev-action"
                onClick={() => toggleScreenSharing()}
                title="Toggle screen sharing privacy mode"
              >
                <span>🔒 Screen sharing</span>
              </button>

              <button
                type="button"
                className="btn-dev-action highlight-btn"
                onClick={sendTestPingToPhone}
                title="Beam live state packet to Phone Companion"
              >
                <span>📱 Beam to Phone</span>
              </button>

              <button
                type="button"
                className="btn-dev-action"
                onClick={() => setSimulatedPhoneStatus(!isPhonePaired)}
                title="Toggle simulated phone connection status"
              >
                <span>{isPhonePaired ? "📱 Disconnect Phone" : "📱 Reconnect Phone"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Surface Grid */}
      <div className={`meeting-layout-grid view-${viewMode}`}>
        {/* Left Column: Simulated Meeting Stage */}
        {(viewMode === 'split' || viewMode === 'desktop-only') && (
          <div className="meeting-stage-panel glass-panel">
            <div className="stage-header">
              <div className="stage-title-group">
                <span className="stage-indicator-badge">Virtual Call Stage (Zoom / Meet)</span>
                <span className="stage-attendees-count">3 Colleagues Active</span>
              </div>
              <div className="targeting-badge-display">
                <span className="targeting-label">Targeting:</span>
                <span className={`targeting-val ${targetingInfo.isTargetedAtUser ? 'text-accent' : 'text-sage'}`}>
                  {targetingInfo.isTargetedAtUser ? "Directly at you" : "Room query (Ignored)"}
                </span>
              </div>
            </div>

            {/* Simulated Zoom Video Tiles */}
            <div className="video-tiles-stage">
              <div className={`video-tile ${isSarahSpeaking ? 'active-speaker' : ''}`}>
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80"
                  alt="Sarah"
                  className="tile-avatar-img"
                />
                <div className="tile-footer">
                  <span className="speaker-name">Sarah (VP Marketing)</span>
                  {isSarahSpeaking && <span className="talking-indicator">Speaking 🎙️</span>}
                </div>
              </div>

              <div className={`video-tile ${isMarcusSpeaking ? 'active-speaker' : ''}`}>
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
                  alt="Marcus"
                  className="tile-avatar-img"
                />
                <div className="tile-footer">
                  <span className="speaker-name">Marcus (Growth Lead)</span>
                  {isMarcusSpeaking && <span className="talking-indicator">Speaking 🎙️</span>}
                </div>
              </div>

              <div className={`video-tile ${isAlexSpeaking ? 'active-speaker' : ''}`}>
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80"
                  alt="Alex"
                  className="tile-avatar-img"
                />
                <div className="tile-footer">
                  <span className="speaker-name">Alex (Finance Lead)</span>
                  {isAlexSpeaking && <span className="talking-indicator">Speaking 🎙️</span>}
                </div>
              </div>

              <div className={`video-tile you-tile ${isUserSpeaking ? 'active-speaker user-speaking-ring' : ''}`}>
                <div className="you-avatar-placeholder">
                  <span className="you-emoji">👤</span>
                </div>
                <div className="tile-footer">
                  <span className="speaker-name">You ({userName})</span>
                  {isUserSpeaking ? (
                    <span className="talking-indicator text-freeze">Speaking (Frozen) 🗣️</span>
                  ) : (
                    <span className="badge-private-companion">Aside Protected 🛡️</span>
                  )}
                </div>
              </div>

              {/* ASIDE DISCREET FLOATING ASSISTANT OVERLAY */}
              <MiniFloatingAssistant />
            </div>

            {/* SECTION 22: 8 DEMO SCENARIO SELECTOR STRIP */}
            <div className="simulate-questions-bar">
              <div className="simulate-bar-header">
                <span className="sim-title">Demo Scenarios (Section 22):</span>
                <span className="sim-hint">Click any scenario to test Aside's turn-taking, context reasoning, and silence:</span>
              </div>

              <div className="scripted-chips-scroll">
                {demoScenarios.map((sc, idx) => (
                  <button
                    key={sc.id || idx}
                    className={`scripted-question-chip ${activeScenarioIndex === idx ? 'current' : ''}`}
                    onClick={() => selectScenarioByIndex(idx)}
                  >
                    <span className="chip-idx">#{sc.scenarioNum || idx + 1}</span>
                    <span className="chip-text">{sc.title}</span>

                    {sc.category === 'expected' && <span className="category-pill pill-opinion">Expected</span>}
                    {sc.category === 'unexpected' && <span className="category-pill pill-unexpected">Context Reasoning</span>}
                    {sc.category === 'opinion' && <span className="category-pill pill-opinion">Opinion</span>}
                    {sc.category === 'jargon' && <span className="category-pill pill-jargon">Jargon Decode</span>}
                    {sc.category === 'unknown' && <span className="category-pill pill-unknown">Safe Answer</span>}
                    {sc.category === 'false-trigger' && <span className="category-pill pill-silent">Silent Room Q</span>}
                    {sc.category === 'user-speaking' && <span className="category-pill pill-freeze">User Speaks</span>}
                    {sc.category === 'follow-up' && <span className="category-pill pill-memory">Chained Follow-up</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Question Input Form */}
            <div className="custom-question-bar">
              <form onSubmit={handleCustomSubmit} className="custom-question-form">
                <input
                  type="text"
                  placeholder="Ask any question — Aside analyzes targeting and synthesizes a leader response from notes..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="custom-question-input"
                />
                <button type="submit" className="btn-send-question" title="Send question">
                  <Send size={15} />
                </button>
              </form>
            </div>

            {/* SECTION 10: ROLLING CONTINUOUS CONVERSATION CONTEXT */}
            <div className="meeting-transcript-box">
              <div className="transcript-box-header">
                <span className="transcript-box-label">Continuous Conversation Memory Stream</span>
                <span className="transcript-memory-hint">Retains statements, facts & decisions for unexpected questions</span>
              </div>
              <div className="transcript-entries">
                {conversationHistory.slice(-4).map((item, idx) => (
                  <div key={idx} className={`transcript-row ${item.isUser ? 'user-entry' : ''}`}>
                    <span className="row-time">{item.timestamp}</span>
                    <strong className="row-speaker">{item.speaker}:</strong>
                    <span className="row-text">“{item.text}”</span>
                    {item.keyFact && (
                      <span className="key-fact-badge">🧠 Remembered: {item.keyFact}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Phone Companion Surface */}
        {(viewMode === 'split' || viewMode === 'phone-only') && (
          <div className="phone-companion-column">
            <div className="phone-column-header">
              <Smartphone size={16} className="text-accent" />
              <span>Aside Phone Companion (Second Screen)</span>
              <span className="badge-sync-live">Live Sync</span>
            </div>
            <PhoneCompanion />
          </div>
        )}
      </div>
    </div>
  );
}
