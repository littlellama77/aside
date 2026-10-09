import React from 'react';
import { useMeeting } from '../context/MeetingContext';
import {
  Sparkles,
  ArrowRight,
  Play,
  Heart,
  Brain,
  Shield,
  Smartphone,
  CheckCircle2,
  Lock,
  VolumeX,
  Mic,
  Eye,
  Radio
} from 'lucide-react';

export function WelcomeScreen() {
  const { userName, startMeeting, startDemo, setCurrentScreen } = useMeeting();

  return (
    <div className="welcome-screen animate-fade-in">
      {/* Hero Section */}
      <div className="welcome-hero">
        <div className="welcome-badge">
          <span className="badge-sparkle">💬</span>
          <span>Aside · Real-Time Conversation Companion</span>
        </div>

        <h1 className="welcome-title">
          A little help staying in the conversation.
        </h1>

        <p className="welcome-subtitle">
          Aside is a discreet conversation companion for meetings, interviews, presentations, and classes. Not an AI that speaks for you — a quiet presence that helps you formulate your own thoughts when you temporarily struggle to retrieve them.
        </p>

        {/* Action Buttons */}
        <div className="welcome-cta-group">
          <button className="btn-primary-warm" onClick={startMeeting}>
            <span>Start live meeting mode</span>
            <ArrowRight size={18} />
          </button>

          <button className="btn-secondary-warm" onClick={startDemo}>
            <Play size={17} className="btn-play-icon" />
            <span>Try interactive scenario demo</span>
          </button>
        </div>

        <p className="demo-hint-text">
          Zero setup or API keys needed. Works immediately in your browser with dual audio simulation.
        </p>
      </div>

      {/* The Core Idea Callout Box */}
      <div className="aside-core-idea-card glass-panel">
        <div className="core-idea-header">
          <span className="core-idea-tag">The Core Idea</span>
        </div>
        <blockquote className="core-idea-quote">
          <p>Someone asks you something.</p>
          <p>Your brain goes blank.</p>
          <p className="quote-highlight">Aside quietly gives you enough context to get moving again.</p>
        </blockquote>
      </div>

      {/* The Dialogue Flow Simulation */}
      <div className="experience-card glass-panel">
        <div className="experience-header">
          <span className="experience-tag">How it feels in a live meeting</span>
        </div>

        <div className="conversation-flow-simulation">
          <div className="dialogue-bubble user-bubble">
            <span className="dialogue-who">Sarah (VP Marketing):</span>
            <p className="dialogue-text">“Why did campaign performance drop last week?”</p>
          </div>

          <div className="dialogue-bubble babe-bubble">
            <div className="babe-bubble-meta">
              <span className="babe-avatar-mini">💬</span>
              <span className="babe-label">Aside (internal cue):</span>
            </div>
            <div className="dialogue-cue-body">
              <span className="dialogue-decode">babe 👀 They're asking why performance dropped.</span>
              <p className="dialogue-say">
                <strong>Say:</strong> “Mostly the creative change and higher CPC.”
              </p>
              <div className="dialogue-bullets">
                <span>• creative changed</span>
                <span>• CPC ↑</span>
                <span>• Search score 78</span>
              </div>
            </div>
          </div>

          <div className="dialogue-bubble user-speaking-bubble">
            <span className="dialogue-who">You (speaking):</span>
            <p className="dialogue-text">“Yeah, so I think there were two main things. The creative changed mid-week...”</p>
            <span className="bubble-freeze-notice">🗣️ Aside enters YOUR TURN and freezes — zero regeneration while you speak</span>
          </div>
        </div>

        <div className="experience-footer">
          <div className="core-promise-item">
            <CheckCircle2 size={16} className="text-accent" />
            <span>Quiet when not needed — knows when to listen and when to shut up</span>
          </div>
          <div className="core-promise-item">
            <Lock size={16} className="text-accent" />
            <span>100% private — meeting attendees never see or hear it</span>
          </div>
        </div>
      </div>

      {/* How Aside Works: 3 Architectural Pillars */}
      <div className="pillars-grid">
        <div className="pillar-card">
          <div className="pillar-icon bg-peach">
            <VolumeX size={22} className="text-peach" />
          </div>
          <h3>Never regenerates during your speech</h3>
          <p>
            When you speak, Aside enters <strong>YOUR TURN</strong> and freezes the current suggestion. Your microphone audio never triggers new AI answers or disruptive re-evaluations.
          </p>
        </div>

        <div className="pillar-card">
          <div className="pillar-icon bg-rose">
            <Eye size={22} className="text-rose" />
          </div>
          <h3>1–2 second glanceable format</h3>
          <p>
            No dense paragraphs to read while someone waits for an answer. Glance down for one second, catch the thought, look back at the person, and speak in your authentic voice.
          </p>
        </div>

        <div className="pillar-card">
          <div className="pillar-icon bg-amber">
            <Shield size={22} className="text-amber" />
          </div>
          <h3>Screen-sharing safety</h3>
          <p>
            Sharing your computer screen on Zoom or Meet? Aside seamlessly disguises the desktop panel and streams private cues exclusively to your paired smartphone.
          </p>
        </div>
      </div>
    </div>
  );
}
