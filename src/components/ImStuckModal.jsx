import React, { useState, useEffect } from 'react';
import { useMeeting } from '../context/MeetingContext';
import {
  X,
  Volume2,
  Copy,
  Check,
  Clock,
  Sparkles,
  FileText,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

export function ImStuckModal() {
  const {
    isStuckModalOpen,
    triggerImStuck,
    activeQuestion,
    cheatSheet,
    speakText,
    speechActive
  } = useMeeting();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('easy'); // 'easy' | 'shorter' | 'detail' | 'explain' | 'notes' | 'stall'
  const [breathPhase, setBreathPhase] = useState('Inhale'); // Inhale -> Hold -> Exhale

  // 4-7-8 calming cycle
  useEffect(() => {
    if (!isStuckModalOpen) return;

    const interval = setInterval(() => {
      setBreathPhase(prev => {
        if (prev === 'Inhale') return 'Hold';
        if (prev === 'Hold') return 'Exhale';
        return 'Inhale';
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isStuckModalOpen]);

  if (!isStuckModalOpen || !activeQuestion) return null;

  const recovery = activeQuestion.stuckRecovery || {
    breatheMsg: "okay babe, breathe.",
    questionSummary: "Why did performance drop?",
    points: ["creative changed", "CPC increased", "performance dipped"],
    easySay: "I think it was mainly the creative change and higher CPC.",
    stallSay: "Give me one second — I want to make sure I explain that properly."
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSpokenText = () => {
    if (activeTab === 'shorter') return recovery.points.slice(0, 2).join(', ');
    if (activeTab === 'detail') return activeQuestion.expandedSay || recovery.easySay;
    if (activeTab === 'stall') return recovery.stallSay;
    return recovery.easySay;
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={() => triggerImStuck(false)}>
      <div className="stuck-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="stuck-modal-header">
          <div className="stuck-title-group">
            <div className="breathe-orb-mini">
              <span>🫶</span>
            </div>
            <div>
              <h2 className="stuck-title">{recovery.breatheMsg}</h2>
              <p className="stuck-subtitle">You know this. Your brain just needs a second to retrieve it.</p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={() => triggerImStuck(false)}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Breathing Grounding Bar */}
        <div className="breathing-grounding-bar">
          <div className="breathing-circle-pulse">
            <span className="breath-phase-text">{breathPhase}</span>
          </div>
          <div className="grounding-text">
            <span className="grounding-question-label">They're basically asking:</span>
            <p className="grounding-question-text">“{recovery.questionSummary}”</p>
          </div>
        </div>

        {/* From Your Notes Points */}
        <div className="stuck-notes-recap">
          <span className="recap-header-label">From your notes:</span>
          <div className="recap-bullets-list">
            {recovery.points.map((pt, i) => (
              <span key={i} className="recap-bullet-chip">• {pt}</span>
            ))}
          </div>
        </div>

        {/* Spoken Answer Card */}
        <div className="stuck-answer-card">
          <div className="answer-card-header">
            <span className="easy-answer-tag">Say out loud:</span>
            <div className="answer-header-actions">
              <button
                className="btn-icon-subtle"
                onClick={() => speakText(getSpokenText())}
                title="Practice listen"
              >
                <Volume2 size={15} className={speechActive ? 'text-accent' : ''} />
              </button>
              <button
                className="btn-icon-subtle"
                onClick={() => handleCopy(getSpokenText())}
                title="Copy"
              >
                {copied ? <Check size={15} className="text-accent" /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          <p className="easy-spoken-quote">
            “{getSpokenText()}”
          </p>
        </div>

        {/* Section 12 Action Buttons: [Shorter] [More detail] [Explain the question] [Show my notes] */}
        <div className="stuck-action-chips">
          <button
            className={`stuck-chip ${activeTab === 'easy' ? 'active' : ''}`}
            onClick={() => setActiveTab('easy')}
          >
            <span>Easy answer</span>
          </button>
          <button
            className={`stuck-chip ${activeTab === 'shorter' ? 'active' : ''}`}
            onClick={() => setActiveTab('shorter')}
          >
            <span>Shorter</span>
          </button>
          <button
            className={`stuck-chip ${activeTab === 'detail' ? 'active' : ''}`}
            onClick={() => setActiveTab('detail')}
          >
            <span>More detail</span>
          </button>
          <button
            className={`stuck-chip ${activeTab === 'explain' ? 'active' : ''}`}
            onClick={() => setActiveTab('explain')}
          >
            <HelpCircle size={13} />
            <span>Explain the question</span>
          </button>
          <button
            className={`stuck-chip ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            <FileText size={13} />
            <span>Show my notes</span>
          </button>
          <button
            className={`stuck-chip ${activeTab === 'stall' ? 'active' : ''}`}
            onClick={() => setActiveTab('stall')}
          >
            <Clock size={13} />
            <span>Buy 5 seconds to think</span>
          </button>
        </div>

        {/* Explain the Question Drawer */}
        {activeTab === 'explain' && (
          <div className="stuck-explain-drawer animate-fade-in">
            <span className="drawer-title">What they really mean:</span>
            <p className="drawer-text">
              {activeQuestion.simplestQuestion}. They're not looking for a defense, just the primary reason so they know what to report.
            </p>
          </div>
        )}

        {/* Show My Notes Drawer */}
        {activeTab === 'notes' && (
          <div className="stuck-quick-notes-drawer animate-fade-in">
            <span className="drawer-title">Quick Glance Numbers:</span>
            <div className="quick-numbers-row">
              {cheatSheet.importantNumbers?.map((n, i) => (
                <span key={i} className="drawer-num-pill">{n.label}: <strong>{n.value}</strong></span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="stuck-modal-footer">
          <span className="footer-whisper">“I know this. My brain just needed a second.”</span>
          <button className="btn-primary-warm btn-sm" onClick={() => triggerImStuck(false)}>
            <span>I'm ready to answer</span>
            <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
