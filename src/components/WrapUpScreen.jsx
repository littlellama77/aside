import React, { useEffect, useState } from 'react';
import { useMeeting } from '../context/MeetingContext';
import confetti from 'canvas-confetti';
import {
  Heart,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  ListTodo,
  Compass,
  FileCheck,
  Search
} from 'lucide-react';

export function WrapUpScreen() {
  const {
    userName,
    wrapUpSummary,
    meetingLog,
    setCurrentScreen,
    startMeeting
  } = useMeeting();

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#DF6951', '#F98866', '#2E7958', '#FBBF24']
      });
    } catch {
      // Ignore fallback
    }
  }, []);

  const handleCopySummary = () => {
    const text = `Meeting Wrap-Up: ${wrapUpSummary.title}
Date: ${wrapUpSummary.date}

Things Discussed:
${wrapUpSummary.thingsDiscussed.map(d => `• ${d}`).join('\n')}

Decisions:
${wrapUpSummary.decisions.map(d => `• ${d}`).join('\n')}

Follow-ups:
${wrapUpSummary.followUps.map(f => `• ${f}`).join('\n')}

Things You Said You'd Check:
${wrapUpSummary.thingsToCheck.map(c => `• ${c}`).join('\n')}`;

    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="wrapup-screen animate-fade-in">
      <div className="wrapup-header">
        <div className="survived-badge">
          <Heart size={16} className="text-rose" />
          <span>Meeting finished</span>
        </div>

        <h1 className="wrapup-title">You survived. 🫶</h1>
        <p className="wrapup-subtitle">
          Nice job, {userName}. You handled the questions calmly and stayed oriented without breaking a sweat.
        </p>

        <div className="wrapup-stats-strip">
          <div className="stat-box">
            <span className="stat-val">{meetingLog.length > 0 ? meetingLog.length : 10}</span>
            <span className="stat-lbl">Questions navigated</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">100%</span>
            <span className="stat-lbl">Private assistance</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">Calm</span>
            <span className="stat-lbl">Nervous system</span>
          </div>
        </div>
      </div>

      {/* 4 Cards following Section 25 */}
      <div className="wrapup-cards-container">
        {/* Things Discussed */}
        <div className="wrapup-card glass-panel">
          <div className="card-top">
            <div className="card-icon-box bg-peach">
              <Compass size={18} className="text-peach" />
            </div>
            <h2>Things discussed</h2>
          </div>
          <ul className="decisions-list">
            {wrapUpSummary.thingsDiscussed.map((item, idx) => (
              <li key={idx} className="wrapup-list-item">
                <span className="todo-bullet">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Decisions */}
        <div className="wrapup-card glass-panel">
          <div className="card-top">
            <div className="card-icon-box bg-sage">
              <CheckCircle2 size={18} className="text-sage" />
            </div>
            <h2>Decisions</h2>
          </div>
          <ul className="decisions-list">
            {wrapUpSummary.decisions.map((dec, idx) => (
              <li key={idx} className="wrapup-list-item">
                <span className="check-dot">✓</span>
                <span>{dec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Follow-ups */}
        <div className="wrapup-card glass-panel">
          <div className="card-top">
            <div className="card-icon-box bg-amber">
              <FileCheck size={18} className="text-amber" />
            </div>
            <h2>Follow-ups</h2>
          </div>
          <ul className="followups-list">
            {wrapUpSummary.followUps.map((fol, idx) => (
              <li key={idx} className="wrapup-list-item">
                <span className="followup-bullet">📌</span>
                <span>{fol}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Things you said you'd check */}
        <div className="wrapup-card glass-panel">
          <div className="card-top">
            <div className="card-icon-box bg-rose">
              <Search size={18} className="text-rose" />
            </div>
            <h2>Things you said you'd check</h2>
          </div>
          <ul className="actions-list">
            {wrapUpSummary.thingsToCheck.map((chk, idx) => (
              <li key={idx} className="wrapup-list-item">
                <span className="todo-bullet">🔍</span>
                <span>{chk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="wrapup-actions-bar">
        <button className="btn-secondary-warm" onClick={handleCopySummary}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? "Copied!" : "Copy summary"}</span>
        </button>

        <button className="btn-secondary-warm" onClick={() => setCurrentScreen('prepare')}>
          <RotateCcw size={16} />
          <span>Prepare next meeting</span>
        </button>

        <button className="btn-primary-warm" onClick={startMeeting}>
          <span>Restart demo</span>
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
