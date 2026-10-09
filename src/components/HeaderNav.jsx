import React, { useState } from 'react';
import { useMeeting } from '../context/MeetingContext';
import {
  Shield,
  ShieldAlert,
  Smartphone,
  Sun,
  Moon,
  Volume2,
  Check,
  Radio
} from 'lucide-react';

export function HeaderNav({ onOpenPairingModal }) {
  const {
    currentScreen,
    setCurrentScreen,
    theme,
    toggleTheme,
    userName,
    setUserName,
    isScreenSharing,
    toggleScreenSharing,
    isPhonePaired,
    conversationState
  } = useMeeting();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const handleNameSave = (e) => {
    e.preventDefault();
    if (tempName.trim()) {
      setUserName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <header className="header-nav glass-panel">
      <div className="header-inner">
        {/* Logo & Product Brand: Aside */}
        <div className="logo-group" onClick={() => setCurrentScreen('welcome')}>
          <div className="logo-icon-wrapper">
            <span className="logo-emoji">💬</span>
            <div className="status-ping"></div>
          </div>
          <div className="logo-text-group">
            <div className="logo-title">
              <span className="brand-name">aside</span>
              <span className="brand-dot">·</span>
              <span className="brand-tag">conversation companion</span>
            </div>
            <p className="brand-subtitle">a little help staying in the conversation</p>
          </div>
        </div>

        {/* Step Navigation */}
        <nav className="nav-steps">
          <button
            className={`nav-step-btn ${currentScreen === 'welcome' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('welcome')}
          >
            Welcome
          </button>
          <button
            className={`nav-step-btn ${currentScreen === 'prepare' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('prepare')}
          >
            Prepare
          </button>
          <button
            className={`nav-step-btn ${currentScreen === 'setup' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('setup')}
          >
            Setup
          </button>
          <button
            className={`nav-step-btn ${currentScreen === 'meeting' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('meeting')}
          >
            Meeting
          </button>
          <button
            className={`nav-step-btn ${currentScreen === 'wrapup' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('wrapup')}
          >
            Wrap-up
          </button>
        </nav>

        {/* Actions & Live State Monitor */}
        <div className="header-actions">
          {/* Live State Machine Status Pill */}
          <div className={`nav-state-indicator state-${conversationState?.toLowerCase()}`}>
            {conversationState === 'LISTENING' && (
              <span className="state-badge-text">
                <span className="state-dot live-dot-green">●</span> listening
              </span>
            )}
            {conversationState === 'OTHER_PERSON_SPEAKING' && (
              <span className="state-badge-text text-amber">
                🎙️ speaker talking
              </span>
            )}
            {conversationState === 'POSSIBLE_QUESTION' && (
              <span className="state-badge-text text-amber">
                ⏳ evaluating question...
              </span>
            )}
            {conversationState === 'QUESTION_CONFIRMED' && (
              <span className="state-badge-text text-accent">
                ✦ question detected
              </span>
            )}
            {conversationState === 'YOUR_TURN' && (
              <span className="state-badge-text text-freeze">
                🗣️ your turn · frozen
              </span>
            )}
            {conversationState === 'RESPONSE_FINISHED' && (
              <span className="state-badge-text">
                ✓ response finished
              </span>
            )}
          </div>

          {/* Screen Sharing Safety Pill */}
          <button
            className={`safety-toggle-btn ${isScreenSharing ? 'safety-active' : ''}`}
            onClick={() => toggleScreenSharing()}
            title={
              isScreenSharing
                ? "Screen sharing is active: Desktop is disguised! Private cues sent to phone."
                : "Click to simulate screen sharing detection"
            }
          >
            {isScreenSharing ? (
              <>
                <ShieldAlert className="icon-shield pulse-alert" size={16} />
                <span className="safety-text">Screen Shared · Private → Phone 🔒</span>
              </>
            ) : (
              <>
                <Shield className="icon-shield" size={16} />
                <span className="safety-text">Screen Share Safety: Standby</span>
              </>
            )}
          </button>

          {/* Phone Pairing Shortcut */}
          <button
            className="phone-pair-btn"
            onClick={onOpenPairingModal}
            title="Scan QR or enter code on your phone"
          >
            <Smartphone size={16} />
            <span className="pair-badge">{isPhonePaired ? "Phone Paired" : "Pair Phone"}</span>
          </button>

          {/* User Name Edit */}
          <div className="user-profile-badge">
            {isEditingName ? (
              <form onSubmit={handleNameSave} className="name-edit-form">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  autoFocus
                  onBlur={() => setIsEditingName(false)}
                  className="name-edit-input"
                />
              </form>
            ) : (
              <span
                className="user-name-clickable"
                onClick={() => setIsEditingName(true)}
                title="Click to rename"
              >
                👋 {userName}
              </span>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
}
