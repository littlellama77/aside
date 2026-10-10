import React, { useState } from 'react';
import { useMeeting } from '../context/MeetingContext';
import {
  Sparkles,
  Key,
  Shield,
  Check,
  X,
  Zap,
  Cpu,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';

export function AiSettingsModal({ isOpen, onClose }) {
  const {
    openaiApiKey,
    setOpenaiApiKey,
    openaiModel,
    setOpenaiModel
  } = useMeeting();

  const [inputKey, setInputKey] = useState(openaiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setOpenaiApiKey(inputKey.trim());
    localStorage.setItem('aside_openai_api_key', inputKey.trim());
    onClose();
  };

  const handleClear = () => {
    setInputKey('');
    setOpenaiApiKey('');
    localStorage.removeItem('aside_openai_api_key');
  };

  const isKeyActive = Boolean(inputKey && inputKey.startsWith('sk-'));

  return (
    <div className="ai-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="ai-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-modal-header">
          <div className="ai-modal-title-group">
            <div className="ai-icon-circle">
              <Sparkles size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="ai-modal-title">OpenAI GPT-4o Settings</h3>
              <p className="ai-modal-sub">Real-time LLM intelligence for live meeting answers</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Status Badge */}
        <div className="ai-status-row">
          <div className={`ai-active-badge ${isKeyActive ? 'status-connected' : 'status-fallback'}`}>
            <span className="ai-pulse-dot"></span>
            <span>{isKeyActive ? `Connected to OpenAI (${openaiModel})` : "Using Built-in Local Engine"}</span>
          </div>
          <span className="ai-security-tag">
            <Shield size={12} /> Stored 100% in local browser
          </span>
        </div>

        {/* API Key Input */}
        <div className="ai-input-section">
          <label className="ai-input-label">
            <span>OpenAI API Key:</span>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="ai-api-link"
            >
              Get Key <ExternalLink size={11} />
            </a>
          </label>

          <div className="key-input-wrapper">
            <Key size={15} className="key-icon-lead" />
            <input
              type={showKey ? "text" : "password"}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="sk-proj-..."
              className="key-text-input"
            />
            <button
              type="button"
              className="btn-toggle-eye"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="key-hint">
            Your key is used strictly for real-time question answering during meetings. It never touches any external database.
          </p>
        </div>

        {/* Model Selection */}
        <div className="ai-model-selection">
          <label className="ai-input-label">Choose GPT Model:</label>
          <div className="model-cards-grid">
            <div
              className={`model-card ${openaiModel === 'gpt-4o-mini' ? 'selected' : ''}`}
              onClick={() => setOpenaiModel('gpt-4o-mini')}
            >
              <div className="model-card-top">
                <Zap size={14} className="text-accent" />
                <strong>GPT-4o Mini</strong>
                <span className="model-chip-rec">Recommended</span>
              </div>
              <p className="model-card-desc">
                Ultra-fast (~300ms latency). Ideal for live meetings where speed is everything. Fractions of a cent per answer.
              </p>
            </div>

            <div
              className={`model-card ${openaiModel === 'gpt-4o' ? 'selected' : ''}`}
              onClick={() => setOpenaiModel('gpt-4o')}
            >
              <div className="model-card-top">
                <Cpu size={14} className="text-freeze" />
                <strong>GPT-4o</strong>
                <span className="model-chip-deep">Deep Reasoning</span>
              </div>
              <p className="model-card-desc">
                Maximum executive nuance and synthesis for high-stakes leadership debates and multi-layered questions.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="ai-modal-footer">
          {inputKey && (
            <button type="button" className="btn-clear-key" onClick={handleClear}>
              <Trash2 size={14} />
              <span>Clear Key</span>
            </button>
          )}

          <div className="footer-right-buttons">
            <button type="button" className="btn-secondary-warm" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary-warm" onClick={handleSave}>
              <Check size={16} />
              <span>Save & Connect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
