import React, { useEffect, useState } from 'react';
import { useMeeting } from '../context/MeetingContext';
import { MEETING_WRAPUP_SUMMARY } from '../constants/mockData';
import confetti from 'canvas-confetti';
import {
  Heart,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  Compass,
  FileCheck,
  Search
} from 'lucide-react';

export function WrapUpScreen() {
  const {
    userName = "Roo",
    meetingConfig,
    cheatSheet,
    questionsFeed,
    wrapUpSummary = MEETING_WRAPUP_SUMMARY,
    conversationHistory = [],
    setCurrentScreen,
    startMeeting
  } = useMeeting();

  const [copied, setCopied] = useState(false);

  // Dynamically assemble wrap-up summary based on actual meeting notes & questions asked
  const dynamicTitle = meetingConfig?.name || cheatSheet?.topics?.[0]?.name || wrapUpSummary?.title || "Meeting Wrap-Up";
  
  const discussedItems = (questionsFeed && questionsFeed.length > 0)
    ? questionsFeed.slice(0, 5).map(q => q.topic ? `${q.topic} (“${q.question}”)` : q.question)
    : (wrapUpSummary?.thingsDiscussed || []);

  const decisionItems = (cheatSheet?.guardrails && cheatSheet.guardrails.length > 0)
    ? cheatSheet.guardrails.slice(0, 4)
    : (wrapUpSummary?.decisions || []);

  const followUpItems = (cheatSheet?.thingsToRemember && cheatSheet.thingsToRemember.length > 0)
    ? cheatSheet.thingsToRemember.slice(0, 4)
    : (wrapUpSummary?.followUps || []);

  const checkItems = (cheatSheet?.thingsToAsk && cheatSheet.thingsToAsk.length > 0)
    ? cheatSheet.thingsToAsk.slice(0, 4)
    : (wrapUpSummary?.thingsToCheck || []);

  const summary = {
    title: dynamicTitle,
    date: wrapUpSummary?.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    thingsDiscussed: discussedItems,
    decisions: decisionItems,
    followUps: followUpItems,
    thingsToCheck: checkItems
  };

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
    const text = `Meeting Wrap-Up: ${summary.title}
Date: ${summary.date}

Things Discussed:
${(summary.thingsDiscussed || []).map(d => `• ${d}`).join('\n')}

Decisions & Guidelines:
${(summary.decisions || []).map(d => `• ${d}`).join('\n')}

Follow-ups & Key Priorities:
${(summary.followUps || []).map(f => `• ${f}`).join('\n')}

Action Items to Check:
${(summary.thingsToCheck || []).map(c => `• ${c}`).join('\n')}`;

    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const questionsCount = (questionsFeed?.length) || (conversationHistory?.filter(c => c.type === 'question')?.length) || 6;

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
            <span className="stat-val">{questionsCount}</span>
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

      {/* 4 Summary Cards */}
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
            {(summary.thingsDiscussed || []).map((item, idx) => (
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
            {(summary.decisions || []).map((dec, idx) => (
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
            {(summary.followUps || []).map((fol, idx) => (
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
            {(summary.thingsToCheck || []).map((chk, idx) => (
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
