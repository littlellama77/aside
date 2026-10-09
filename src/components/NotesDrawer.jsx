import React, { useState, useRef } from 'react';
import { useMeeting } from '../context/MeetingContext';
import {
  FileText,
  X,
  Sparkles,
  Check,
  Upload,
  Hash,
  ShieldCheck,
  Lightbulb,
  Clock,
  Layers,
  BookOpen
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

  const [localNotes, setLocalNotes] = useState(rawNotes);
  const fileInputRef = useRef(null);

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

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setLocalNotes(content);
        parseNotesToCheatSheet(content);
      }
    };
    reader.readAsText(file);
  };

  // Compute live stats for huge notes
  const wordCount = localNotes.split(/\s+/).filter(Boolean).length;
  const charCount = localNotes.length;
  const estimatedSections = cheatSheet?.stats?.sectionCount || Math.max(1, localNotes.split(/\n\n+/).length);
  const metricCount = cheatSheet?.stats?.metricCount || cheatSheet?.importantNumbers?.length || 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

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
              <h3 className="drawer-title">Meeting Knowledge & Notes</h3>
              <p className="drawer-subtitle">
                Paste massive documents, transcripts, or notes. Aside indexes every section.
              </p>
            </div>
          </div>
          <button className="btn-close-drawer" onClick={onClose} title="Close drawer">
            <X size={18} />
          </button>
        </div>

        {/* Live Document Statistics (Huge notes proof) */}
        <div className="notes-doc-stats-bar">
          <div className="doc-stat-item">
            <BookOpen size={13} className="text-accent" />
            <span><strong>{wordCount.toLocaleString()}</strong> words</span>
          </div>
          <div className="doc-stat-item">
            <Layers size={13} className="text-sage" />
            <span><strong>{estimatedSections}</strong> sections</span>
          </div>
          <div className="doc-stat-item">
            <Hash size={13} className="text-freeze" />
            <span><strong>{metricCount}</strong> data points</span>
          </div>
          <div className="doc-stat-item">
            <Clock size={13} className="text-tertiary" />
            <span>~<strong>{readTimeMin}</strong>m read</span>
          </div>
        </div>

        {/* Template & File Upload Actions */}
        <div className="notes-actions-bar">
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

          {/* Hidden File Input + Custom Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.md,.markdown,.csv,.json"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn-upload-file"
            onClick={() => fileInputRef.current?.click()}
            title="Upload a .txt, .md, or .csv document of any size"
          >
            <Upload size={13} />
            <span>Upload File</span>
          </button>
        </div>

        {/* Detected Topics & Sections Strip */}
        {cheatSheet?.topics && cheatSheet.topics.length > 0 && (
          <div className="drawer-topics-container">
            <span className="topics-label">Indexed Topics & Sections:</span>
            <div className="topics-scroll-row">
              {cheatSheet.topics.map((topicName, idx) => (
                <span key={idx} className="topic-chip-tag" title={topicName}>
                  📑 {topicName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Raw Notes Textarea */}
        <div className="notes-editor-box">
          <div className="editor-label-row">
            <label className="editor-label">
              Paste or edit meeting notes (unlimited length):
            </label>
            <span className="notes-char-count">{charCount.toLocaleString()} chars</span>
          </div>
          <textarea
            className="notes-textarea"
            value={localNotes}
            onChange={(e) => {
              setLocalNotes(e.target.value);
              parseNotesToCheatSheet(e.target.value);
            }}
            placeholder="Paste your talking points, 50-page QBR doc, project specs, interview stories, or cheat sheet here..."
            rows={10}
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
                {cheatSheet.importantNumbers.slice(0, 8).map((m, idx) => (
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
            <span>Save & Index for Live Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}
