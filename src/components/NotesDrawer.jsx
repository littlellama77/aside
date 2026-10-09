import React, { useState } from 'react';
import { useMeeting } from '../context/MeetingContext';
import {
  FileText,
  X,
  Sparkles,
  Check,
  RotateCcw,
  Plus,
  Hash,
  ShieldCheck,
  Lightbulb
} from 'lucide-react';
import { PRESET_NOTE_TEMPLATES } from '../constants/mockData';

export function NotesDrawer({ isOpen, onClose }) {
  const {
    rawNotes,
    setRawNotes,
    cheatSheet,
    parseNotesToCheatSheet,
    selectedTemplateId,
    loadTemplate,
    regenerateQuestionsFromNotes
  } = useMeeting();

  const [copied, setCopied] = useState(false);
  const [localNotes, setLocalNotes] = useState(rawNotes);

  if (!isOpen) return null;

  const handleApplyNotes = () => {
    setRawNotes(localNotes);
    parseNotesToCheatSheet(localNotes);
    regenerateQuestionsFromNotes(localNotes);
    onClose();
  };

  const handleTemplateSelect = (templateId) => {
    loadTemplate(templateId);
    const tmpl = PRESET_NOTE_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setLocalNotes(tmpl.rawNotes);
    }
  };

  return (
    <div className="notes-drawer-overlay animate-fade-in" onClick={onClose}>
      <div className="notes-drawer-panel glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="notes-drawer-header">
          <div className="drawer-title-group">
            <div className="drawer-icon-circle">
              <FileText size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="drawer-title">My Meeting Notes & Context</h3>
              <p className="drawer-subtitle">Aside extracts facts, metrics, and guardrails for real-time answers</p>
            </div>
          </div>
          <button className="btn-close-drawer" onClick={onClose} title="Close drawer">
            <X size={18} />
          </button>
        </div>

        {/* Template Switcher */}
        <div className="notes-template-pills">
          <span className="template-pills-label">Presets:</span>
          {PRESET_NOTE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              className={`tmpl-pill ${selectedTemplateId === tmpl.id ? 'active' : ''}`}
              onClick={() => handleTemplateSelect(tmpl.id)}
            >
              {tmpl.title}
            </button>
          ))}
        </div>

        {/* Raw Notes Textarea */}
        <div className="notes-editor-box">
          <label className="editor-label">
            <span>Paste or edit your notes for this meeting:</span>
            <span className="notes-char-count">{localNotes.length} characters</span>
          </label>
          <textarea
            className="notes-textarea"
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            placeholder="Paste your talking points, project updates, key numbers, or cheat sheet here..."
            rows={9}
          />
        </div>

        {/* AI Extracted Memory Summary */}
        <div className="extracted-brief-card">
          <div className="brief-card-header">
            <Sparkles size={14} className="text-accent" />
            <strong>AI Context Extracted from Notes:</strong>
          </div>

          {/* Numbers / Metrics */}
          {cheatSheet?.importantNumbers && cheatSheet.importantNumbers.length > 0 && (
            <div className="extracted-section">
              <span className="section-label"><Hash size={12} /> Key Numbers:</span>
              <div className="metric-chips-row">
                {cheatSheet.importantNumbers.map((m, idx) => (
                  <span key={idx} className="metric-chip-pill">
                    <strong>{m.label}:</strong> {m.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Facts to Remember */}
          {cheatSheet?.thingsToRemember && cheatSheet.thingsToRemember.length > 0 && (
            <div className="extracted-section">
              <span className="section-label"><Lightbulb size={12} /> Key Talking Points:</span>
              <ul className="points-list">
                {cheatSheet.thingsToRemember.slice(0, 3).map((pt, idx) => (
                  <li key={idx} className="point-item">{pt}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Guardrails / What NOT to say */}
          {cheatSheet?.guardrails && cheatSheet.guardrails.length > 0 && (
            <div className="extracted-section">
              <span className="section-label"><ShieldCheck size={12} /> Guardrails (Do Not Promise):</span>
              <div className="guardrail-pill">
                🔒 {cheatSheet.guardrails[0]}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="notes-drawer-footer">
          <button className="btn-secondary-warm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary-warm" onClick={handleApplyNotes}>
            <Check size={16} />
            <span>Save & Update Copilot Context</span>
          </button>
        </div>
      </div>
    </div>
  );
}
