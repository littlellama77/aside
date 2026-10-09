import React, { useState } from 'react';
import { useMeeting } from '../context/MeetingContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Smartphone,
  Check,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  Globe,
  Radio
} from 'lucide-react';

export function PairingModal({ isOpen, onClose }) {
  const {
    pairingCode,
    isPhonePaired,
    phoneConnectionStatus,
    phoneConnectionType,
    sendTestPingToPhone,
    setSimulatedPhoneStatus
  } = useMeeting();

  const [copied, setCopied] = useState(false);
  const [pingSent, setPingSent] = useState(false);

  if (!isOpen) return null;

  // Local URL for mobile pairing
  const pairingUrl = `${window.location.origin}${window.location.pathname}?view=phone&code=${pairingCode}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(pairingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestPing = () => {
    sendTestPingToPhone();
    setPingSent(true);
    setTimeout(() => setPingSent(false), 2000);
  };

  const openMobileWindow = () => {
    window.open(
      pairingUrl,
      'AsidePhoneCompanion',
      'width=390,height=820,resizable=yes,scrollbars=yes,status=no,toolbar=no'
    );
  };

  const connectionTypeLabel = phoneConnectionType === 'webrtc'
    ? 'Internet P2P (WebRTC) 🌐'
    : phoneConnectionType === 'broadcast'
      ? 'Same-Device Relay ⚡'
      : 'Simulated Cloud Link 🫶';

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="pairing-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pairing-modal-header">
          <div className="pairing-title-group">
            <Smartphone size={20} className="text-accent" />
            <div>
              <h2>Pair Your Phone Display</h2>
              <span className="pairing-subtitle-badge">
                Laptop = Ears + Brain · Phone = Private Display Only
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Core Architectural Principle Alert */}
        <div className="pairing-architecture-card">
          <div className="arch-card-icon">
            <Radio size={16} className="text-accent" />
          </div>
          <div className="arch-card-text">
            <strong>The phone never listens to the meeting.</strong>
            <p>
              Your laptop handles all simulated audio processing, question detection, and turn-taking logic.
              Your phone requires <strong>zero microphone permissions</strong> — it acts solely as your private, glanceable cue card.
            </p>
          </div>
        </div>

        {/* QR Code and Pairing Code */}
        <div className="pairing-qr-card">
          <div className="qr-wrapper">
            <QRCodeSVG
              value={pairingUrl}
              size={160}
              bgColor="transparent"
              fgColor="currentColor"
              className="qr-svg-element"
            />
          </div>
          <div className="pairing-code-display">
            <span className="code-label">Room Pairing Code:</span>
            <span className="code-value">{pairingCode}</span>
            <span className="code-network-note">
              <Globe size={12} />
              <span>Works across different networks (cellular 5G or Wi-Fi)</span>
            </span>
          </div>
        </div>

        {/* Live Connection Status & Testing */}
        <div className="pairing-status-strip">
          <div className="status-indicator-left">
            <span className={`status-dot ${isPhonePaired && phoneConnectionStatus === 'connected' ? 'dot-active' : 'dot-waiting'}`}></span>
            <span className="status-text-main">
              {isPhonePaired && phoneConnectionStatus === 'connected' ? `Status: Connected (${connectionTypeLabel})` : 'Status: Waiting for connection...'}
            </span>
          </div>

          <div className="status-action-btns">
            <button
              type="button"
              className="btn-status-toggle"
              onClick={() => setSimulatedPhoneStatus(!isPhonePaired)}
            >
              {isPhonePaired ? 'Simulate Disconnect' : 'Simulate Connect'}
            </button>
            <button
              type="button"
              className="btn-status-ping"
              onClick={handleTestPing}
              title="Send test state update to phone"
            >
              <Zap size={13} className={pingSent ? 'text-accent' : ''} />
              <span>{pingSent ? 'Ping Beamed!' : 'Ping Phone'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pairing-options-group">
          <button className="btn-secondary-warm w-full" onClick={openMobileWindow}>
            <ExternalLink size={16} />
            <span>Open Standalone Phone Window (Demo Preview)</span>
          </button>

          <button className="btn-secondary-warm w-full" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? "Link copied to clipboard!" : "Copy mobile pairing link"}</span>
          </button>
        </div>

        {/* Screen Sharing Safety Guarantee */}
        <div className="pairing-safety-note">
          <Shield size={16} className="text-sage" />
          <span>
            When you share your screen on Zoom or Google Meet, desktop answers are hidden. Prompts stream exclusively to your phone.
          </span>
        </div>

        <div className="pairing-footer">
          <button className="btn-primary-warm w-full" onClick={onClose}>
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
