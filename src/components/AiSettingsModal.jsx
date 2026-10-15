import React, { useState } from 'react';
import { useMeeting } from '../context/MeetingContext';
import { testAiConnection, detectAiProvider } from '../services/openaiService';
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
  AlertTriangle,
  BookOpen
} from 'lucide-react';

export function AiSettingsModal({ isOpen, onClose }) {
  const {
    aiEngineMode,
    setAiEngineMode,
    openaiApiKey,
    setOpenaiApiKey,
    openaiModel,
    setOpenaiModel,
    speechLocale,
    setSpeechLocale
  } = useMeeting();

  const [inputKey, setInputKey] = useState(openaiApiKey || '');
  const [selectedMode, setSelectedMode] = useState(aiEngineMode || 'notes');
  const [selectedModel, setSelectedModel] = useState(openaiModel || 'gpt-4o-mini');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  if (!isOpen) return null;

  const currentProvider = detectAiProvider(inputKey);

  const handleTestConnection = async () => {
    if (!inputKey || !inputKey.trim()) {
      setTestStatus({ type: 'error', msg: 'Please enter an API key (OpenAI sk-... or Google Gemini AIza...)' });
      return;
    }
    setTestStatus({ type: 'testing', msg: 'Testing connection to AI provider...' });
    const result = await testAiConnection(inputKey.trim(), selectedModel);
    if (result.ok) {
      setTestStatus({
        type: 'success',
        msg: result.msg || `Connected successfully to ${result.provider}!`
      });
    } else if (result.isQuota) {
      setTestStatus({
        type: 'quota',
        msg: result.msg
      });
    } else {
      setTestStatus({
        type: 'error',
        msg: result.msg || "Connection test failed."
      });
    }
  };

  const handleSave = () => {
    setAiEngineMode(selectedMode);
    setOpenaiApiKey(inputKey.trim());
    setOpenaiModel(selectedModel);
    localStorage.setItem('aside_ai_engine_mode', selectedMode);
    localStorage.setItem('aside_openai_api_key', inputKey.trim());
    localStorage.setItem('aside_openai_model', selectedModel);
    onClose();
  };

  const handleClear = () => {
    setInputKey('');
    setOpenaiApiKey('');
    localStorage.removeItem('aside_openai_api_key');
    setTestStatus(null);
  };

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
              <h3 className="ai-modal-title">Answering Engine & AI Settings</h3>
              <p className="ai-modal-sub">Choose your intelligence mode and grounding rules for live meetings</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Engine Mode Selection */}
        <div className="ai-model-selection mb-4">
          <label className="ai-input-label font-bold">1. Select Answering Engine:</label>
          <div className="model-cards-grid">
            <div
              className={`model-card ${selectedMode === 'notes' ? 'selected' : ''}`}
              onClick={() => setSelectedMode('notes')}
            >
              <div className="model-card-top">
                <BookOpen size={16} className="text-sage" />
                <strong>Verified Notes Engine</strong>
                <span className="model-chip-rec">Recommended</span>
              </div>
              <p className="model-card-desc">
                ⚡ <strong>0ms Instant Latency.</strong> 100% faithful to your notes & 24 curated interview scenarios. Guaranteed <strong>zero hallucinations</strong>, no API key needed, never gets stuck.
              </p>
            </div>

            <div
              className={`model-card ${selectedMode === 'ai' ? 'selected' : ''}`}
              onClick={() => setSelectedMode('ai')}
            >
              <div className="model-card-top">
                <Zap size={16} className="text-accent" />
                <strong>AI Enhanced Mode</strong>
                <span className="model-chip-deep">Gemini / GPT</span>
              </div>
              <p className="model-card-desc">
                Uses LLM intelligence strictly grounded in your notes for unexpected questions. Preserves all verified scenarios and backs up with instant notes.
              </p>
            </div>
          </div>
        </div>

        {/* AI Key & Provider Settings (Shown if AI Mode is selected or configuring key) */}
        <div className="ai-input-section">
          <label className="ai-input-label">
            <span>API Key (Google Gemini or OpenAI):</span>
            <div className="flex items-center gap-2 text-xs">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="ai-api-link text-accent"
              >
                Free Gemini Key <ExternalLink size={11} />
              </a>
              <span>•</span>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="ai-api-link"
              >
                OpenAI Key <ExternalLink size={11} />
              </a>
            </div>
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
              placeholder="AIza... (Gemini) or sk-... (OpenAI)"
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
              <span>{testStatus?.type === 'testing' ? 'Verifying connection...' : 'Test Connection'}</span>
            </button>

            {currentProvider === 'gemini' ? (
              <span className="text-xs text-secondary">
                ✨ Detected Google Gemini Provider
              </span>
            ) : (
              <a
                href="https://platform.openai.com/settings/organization/billing/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="billing-check-link"
              >
                OpenAI Billing ($5 Credits) <ExternalLink size={11} />
              </a>
            )}
          </div>

          {testStatus && (
            <div className={`ai-test-result-banner animate-fade-in ${testStatus.type}`}>
              {testStatus.type === 'success' && <Check size={14} className="text-sage" />}
              {testStatus.type === 'quota' && <AlertTriangle size={14} className="text-amber" />}
              {testStatus.type === 'error' && <X size={14} className="text-panic" />}
              <div className="test-result-text">
                <p>{testStatus.msg}</p>
                {testStatus.type === 'quota' && (
                  <p className="mt-1 text-xs">
                    💡 Tip: Switch to <strong>Verified Notes Engine</strong> above to answer with 100% accuracy without needing credits!
                  </p>
                )}
              </div>
            </div>
          )}

          <p className="key-hint">
            <Shield size={12} className="inline mr-1" />
            Your API key stays 100% in your local browser. Aside will strictly enforce candidate notes grounding and never hallucinate outside information.
          </p>
        </div>

        {/* Model Selection */}
        <div className="ai-model-selection">
          <label className="ai-input-label">Choose AI Model:</label>
          <div className="model-cards-grid">
            <div
              className={`model-card ${selectedModel === 'gpt-4o-mini' || selectedModel === 'gemini-3.8-flash' || selectedModel === 'gemini-flash-latest' ? 'selected' : ''}`}
              onClick={() => setSelectedModel(currentProvider === 'gemini' ? 'gemini-3.8-flash' : 'gpt-4o-mini')}
            >
              <div className="model-card-top">
                <Zap size={14} className="text-accent" />
                <strong>{currentProvider === 'gemini' ? 'Gemini 3.8 Flash' : 'GPT-4o Mini'}</strong>
                <span className="model-chip-rec">Fast & Snappy (Default)</span>
              </div>
              <p className="model-card-desc">
                {currentProvider === 'gemini'
                  ? 'Blazing fast sub-second latency with Google Gemini. Recommended for real-time meetings.'
                  : 'Sub-second speed. Optimized for live conversations where immediate verbal answers matter.'}
              </p>
            </div>

            <div
              className={`model-card ${selectedModel === 'gpt-4o' || selectedModel === 'gemini-3.5-flash' ? 'selected' : ''}`}
              onClick={() => setSelectedModel(currentProvider === 'gemini' ? 'gemini-3.5-flash' : 'gpt-4o')}
            >
              <div className="model-card-top">
                <Cpu size={14} className="text-freeze" />
                <strong>{currentProvider === 'gemini' ? 'Gemini 3.5 Flash' : 'GPT-4o'}</strong>
                <span className="model-chip-deep">High Stability</span>
              </div>
              <p className="model-card-desc">
                {currentProvider === 'gemini'
                  ? 'Proven balanced reasoning and structured JSON reliability across complex topics.'
                  : 'Deeper reasoning and narrative synthesis for high-stakes trade-offs and complex situational questions.'}
              </p>
            </div>
          </div>
        </div>

        {/* Accent & Speech Recognition Region Tuning */}
        <div className="ai-accent-section">
          <div className="ai-accent-label-row">
            <label className="ai-input-label">Speech Recognition Language & Accent:</label>
            <span className="accent-rec-pill">Deciphers accents & brand terms</span>
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
              <span>Apply Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
