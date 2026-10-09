import React from 'react';
import { useMeeting } from '../context/MeetingContext';
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  UserCheck,
  GraduationCap,
  Presentation,
  Smile,
  Shield,
  Smartphone,
  CheckCircle2,
  Lock
} from 'lucide-react';

export function SetupScreen({ onOpenPairingModal }) {
  const {
    meetingConfig,
    setMeetingConfig,
    isScreenSharing,
    toggleScreenSharing,
    isPhonePaired,
    startMeeting,
    setCurrentScreen
  } = useMeeting();

  const meetingTypes = [
    { id: "Work", label: "Work Meeting", icon: Briefcase, desc: "Team syncs, 1-on-1s, client reviews" },
    { id: "Interview", label: "Job Interview", icon: UserCheck, desc: "Behavioral, technical, panel chats" },
    { id: "Class", label: "Class / Seminar", icon: GraduationCap, desc: "Oral exams, discussions, thesis" },
    { id: "Presentation", label: "Presentation", icon: Presentation, desc: "Q&A sessions, keynote talks" },
    { id: "Other", label: "Other", icon: Smile, desc: "High-pressure conversation" }
  ];

  const toneOptions = [
    {
      id: "Executive Leader",
      label: "Executive Leader",
      badge: "Recommended",
      desc: "“Yeah, so looking at the broader picture...” Articulate, human, visionary, and grounded in verified data from your notes."
    },
    {
      id: "Casual",
      label: "Casual & Warm",
      badge: "Natural",
      desc: "“Yeah, so the short story is...” Authentic, conversational, and relatable cadence."
    },
    {
      id: "Professional",
      label: "Composed & Direct",
      badge: "Crisp",
      desc: "“The temporary variance was driven by creative fatigue...” Clear, authoritative, and polished."
    }
  ];

  return (
    <div className="setup-screen animate-fade-in">
      <div className="setup-header">
        <div className="section-badge">
          <Sparkles size={14} />
          <span>Step 2 · Configuration</span>
        </div>
        <h1 className="setup-title">How should Aside show up today?</h1>
        <p className="setup-subtitle">
          Configure how your private companion responds so the words feel authentic to you.
        </p>
      </div>

      <div className="setup-form-container glass-panel">
        {/* Meeting Name */}
        <div className="form-group">
          <label className="form-label">Meeting Name</label>
          <input
            type="text"
            className="form-input"
            value={meetingConfig.name}
            onChange={(e) => setMeetingConfig(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Q3 Growth Review, System Design Round..."
          />
        </div>

        {/* Meeting Type Selection */}
        <div className="form-group">
          <label className="form-label">Meeting Type</label>
          <div className="types-grid">
            {meetingTypes.map(t => {
              const IconComp = t.icon;
              const isSelected = meetingConfig.type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`type-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setMeetingConfig(prev => ({ ...prev, type: t.id }))}
                >
                  <div className="type-icon-wrapper">
                    <IconComp size={18} />
                  </div>
                  <div className="type-text">
                    <span className="type-name">{t.label}</span>
                    <span className="type-desc">{t.desc}</span>
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="type-check" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tone Selection */}
        <div className="form-group">
          <label className="form-label">Aside's Voice & Style</label>
          <div className="tones-grid">
            {toneOptions.map(tone => {
              const isSelected = meetingConfig.tone === tone.id;
              return (
                <button
                  key={tone.id}
                  type="button"
                  className={`tone-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setMeetingConfig(prev => ({ ...prev, tone: tone.id }))}
                >
                  <div className="tone-card-top">
                    <span className="tone-name">{tone.label}</span>
                    <span className="tone-badge">{tone.badge}</span>
                  </div>
                  <p className="tone-sample">{tone.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Privacy & Screen Sharing Settings */}
        <div className="setup-privacy-box">
          <div className="privacy-item">
            <div className="privacy-info">
              <div className="privacy-title-group">
                <Shield size={17} className="text-accent" />
                <span className="privacy-title">Screen-Sharing Safety Mode</span>
              </div>
              <p className="privacy-desc">
                If enabled, Aside automatically hides desktop answers whenever your screen is being shared. Cues stream discreetly to your phone.
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isScreenSharing}
                onChange={() => toggleScreenSharing()}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="privacy-item">
            <div className="privacy-info">
              <div className="privacy-title-group">
                <Smartphone size={17} className="text-accent" />
                <span className="privacy-title">Phone Companion Sync</span>
              </div>
              <p className="privacy-desc">
                {isPhonePaired
                  ? "✓ Connected to your second screen. Responses will show simultaneously on mobile."
                  : "Pair your smartphone to keep private answers off your computer screen."}
              </p>
            </div>
            <button
              type="button"
              className="btn-outline-mini"
              onClick={onOpenPairingModal}
            >
              {isPhonePaired ? "View Pairing" : "Pair Phone"}
            </button>
          </div>
        </div>

        {/* Launch Button */}
        <div className="setup-actions">
          <button
            type="button"
            className="btn-secondary-warm"
            onClick={() => setCurrentScreen('prepare')}
          >
            Back to Notes
          </button>
          <button
            type="button"
            className="btn-primary-warm btn-large"
            onClick={startMeeting}
          >
            <span>Start Private Meeting Mode</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
