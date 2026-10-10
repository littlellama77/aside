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
  EyeOff,
  AlertTriangle
} from 'lucide-react';

export function AiSettingsModal({ isOpen, onClose }) {
  const {
    openaiApiKey,
    setOpenaiApiKey,
    openaiModel,
    setOpenaiModel,
    speechLocale,
    setSpeechLocale
  } = useMeeting();

  const [inputKey, setInputKey] = useState(openaiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!inputKey || !inputKey.trim()) {
      setTestStatus({ type: 'error', msg: 'Please enter an OpenAI API key starting with sk-' });
      return;
    }
    setTestStatus({ type: 'testing', msg: 'Testing connection to OpenAI...' });
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${inputKey.trim()}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say hello in 3 words' }],
          max_tokens: 10
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.code === 'credit_balance_exhausted' || data.error?.type === 'insufficient_quota') {
          setTestStatus({
            type: 'quota',
            msg: 'Key is authenticated! However, your OpenAI credit balance is currently $0. Add $5 prepaid credits in OpenAI Billing to enable live GPT calls. Aside will use its built-in engine until funded.'
          });
        } else {
          setTestStatus({
            type: 'error',
            msg: data.error?.message || `OpenAI returned status ${res.status}`
          });
        }
      } else {
        setTestStatus({
          type: 'success',
          msg: `Connected successfully! Live meeting cues will run on ${openaiModel}.`
        });
      }
    } catch (err) {
      setTestStatus({
        type: 'error',
        msg: `Connection test failed: ${err.message}`
      });
    }
  };

  const handleSave = () => {
    setOpenaiApiKey(inputKey.trim());
    localStorage.setItem('aside_openai_api_key', inputKey.trim());
    onClose();
  };

  const handleClear = () => {
    setInputKey('');
    setOpenaiApiKey('');
    localStorage.removeItem('aside_openai_api_key');
    setTestStatus(null);
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
              onChange={(e) => {
                setInputKey(e.target.value);
                setTestStatus(null);
              }}
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

          <div className="key-actions-row">
            <button
              type="button"
              className="btn-test-connection"
              onClick={handleTestConnection}
              disabled={testStatus?.type === 'testing'}
            >
              <Zap size={13} />
              <span>{testStatus?.type === 'testing' ? 'Verifying with OpenAI...' : 'Test Key Connection'}</span>
            </button>
            <a
              href="https://platform.openai.com/settings/organization/billing/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="billing-check-link"
            >
              OpenAI Billing ($5 Credits) <ExternalLink size={11} />
            </a>
          </div>

          {testStatus && (
            <div className={`ai-test-result-banner animate-fade-in ${testStatus.type}`}>
              {testStatus.type === 'success' && <Check size={14} className="text-sage" />}
              {testStatus.type === 'quota' && <AlertTriangle size={14} className="text-amber" />}
              {testStatus.type === 'error' && <X size={14} className="text-panic" />}
              <div className="test-result-text">
                <p>{testStatus.msg}</p>
                {testStatus.type === 'quota' && (
                  <a
                    href="https://platform.openai.com/settings/organization/billing/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="quota-billing-action"
                  >
                    Add $5 prepaid balance on OpenAI →
                  </a>
                )}
              </div>
            </div>
          )}

          <p className="key-hint">
            Your key stays in your local browser and connects directly to OpenAI. If your OpenAI account is unbilled or offline, Aside automatically falls back to its built-in local engine.
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

        {/* Accent & Speech Recognition Region Tuning */}
        <div className="ai-accent-section">
          <div className="ai-accent-label-row">
            <label className="ai-input-label">Accent & Speech Recognition Tuning:</label>
            <span className="accent-rec-pill">Deciphers accents & muddled audio</span>
          </div>
          <div className="accent-dropdown-container">
            <select
              value={speechLocale || 'en-US'}
              onChange={(e) => setSpeechLocale(e.target.value)}
              className="accent-dropdown-select"
            >
              <option value="en-US">English — US / American & Global</option>
              <option value="en-GB">English — UK / British & European</option>
              <option value="en-IN">English — India & South Asia</option>
              <option value="en-AU">English — Australia & New Zealand</option>
              <option value="en-CA">English — Canada</option>
              <option value="en-IE">English — Ireland & Scotland</option>
              <option value="en-SG">English — Singapore & SE Asia</option>
            </select>
          </div>
          <p className="key-hint">
            Tuned acoustic recognition and GPT phonetic awareness decode heavy regional accents, fast mumbles, and garbled phrases (e.g. "see ay see" → CAC).
          </p>
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
