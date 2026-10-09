import React, { useState } from 'react';
import { useMeeting } from '../context/MeetingContext';
import { PRESET_NOTE_TEMPLATES } from '../constants/mockData';
import {
  Sparkles,
  ArrowRight,
  FileText,
  Upload,
  Trash2,
  CheckCircle,
  HelpCircle,
  Hash,
  Smile,
  ShieldCheck,
  ShieldAlert,
  MessageSquareQuote
} from 'lucide-react';

export function PrepareScreen() {
  const {
    rawNotes,
    setRawNotes,
    cheatSheet,
    setCheatSheet,
    parseNotesToCheatSheet,
    regenerateQuestionsFromNotes,
    questionsList,
    selectedTemplateId,
    loadTemplate,
    speakingStyle,
    setSpeakingStyle,
    setCurrentScreen
  } = useMeeting();

  const [fileSimulated, setFileSimulated] = useState(null);
  const [newRemember, setNewRemember] = useState('');
  const [newAsk, setNewAsk] = useState('');
  const [syncedAlert, setSyncedAlert] = useState(null);

  const toneOptions = [
    "Executive Leader",
    "Warm Director",
    "Casual Lead",
    "Crisp Strategic",
    "Direct"
  ];

  const depthOptions = [
    { id: "detailed", label: "Executive Depth (Longer & Detailed)" },
    { id: "standard", label: "Standard Leadership" },
    { id: "glance", label: "Quick Glance" }
  ];

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setRawNotes(val);
    parseNotesToCheatSheet(val);
  };

  const handleSynthesizeClick = () => {
    regenerateQuestionsFromNotes(rawNotes);
    setSyncedAlert("Questions and executive answers synthesized from your notes!");
    setTimeout(() => setSyncedAlert(null), 3500);
  };

  const handleAddRemember = (e) => {
    e.preventDefault();
    if (!newRemember.trim()) return;
    setCheatSheet(prev => ({
      ...prev,
      thingsToRemember: [...(prev.thingsToRemember || []), newRemember.trim()]
    }));
    setNewRemember('');
  };

  const handleRemoveRemember = (idx) => {
    setCheatSheet(prev => ({
      ...prev,
      thingsToRemember: prev.thingsToRemember.filter((_, i) => i !== idx)
    }));
  };

  const handleAddAsk = (e) => {
    e.preventDefault();
    if (!newAsk.trim()) return;
    setCheatSheet(prev => ({
      ...prev,
      thingsToAsk: [...(prev.thingsToAsk || []), newAsk.trim()]
    }));
    setNewAsk('');
  };

  const handleRemoveAsk = (idx) => {
    setCheatSheet(prev => ({
      ...prev,
      thingsToAsk: prev.thingsToAsk.filter((_, i) => i !== idx)
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileSimulated(file.name);
      const updated = `${rawNotes}\n\n[Attached reference: ${file.name}] - Scanned key facts and numbers.`;
      setRawNotes(updated);
      parseNotesToCheatSheet(updated);
      regenerateQuestionsFromNotes(updated);
      setSyncedAlert(`File attached & executive scenarios refreshed from ${file.name}!`);
      setTimeout(() => setSyncedAlert(null), 3500);
    }
  };

  return (
    <div className="prepare-screen animate-fade-in">
      <div className="prepare-header">
        <div className="section-badge">
          <Sparkles size={14} />
          <span>Prepare · Pre-Meeting Context & Executive Depth</span>
        </div>
        <h1 className="prepare-title">Let's give your brain high-level executive backup.</h1>
        <p className="prepare-subtitle">
          Messy brain dumps are welcome. Paste rough notes, numbers, agendas, or things you're worried you'll forget. Aside synthesizes articulate, human, leader-grade answers ready when you need them.
        </p>
      </div>

      {/* Preset Starters */}
      <div className="template-pills-bar">
        <span className="template-label">Quick template:</span>
        {PRESET_NOTE_TEMPLATES.map(t => (
          <button
            key={t.id}
            className={`template-pill ${selectedTemplateId === t.id ? 'active' : ''}`}
            onClick={() => {
              loadTemplate(t.id);
              setSyncedAlert(`Loaded ${t.title} with executive scenarios!`);
              setTimeout(() => setSyncedAlert(null), 3000);
            }}
          >
            {t.title}
          </button>
        ))}
      </div>

      {syncedAlert && (
        <div className="alert-toast-banner animate-fade-in">
          <Sparkles size={15} className="text-accent" />
          <span>{syncedAlert}</span>
        </div>
      )}

      <div className="prepare-grid">
        {/* Left Column: Brain Dump & Speaking Style */}
        <div className="prepare-card glass-panel">
          <div className="card-header-clean">
            <div className="card-title-group">
              <FileText size={18} className="text-accent" />
              <h2>What should Aside know before the meeting?</h2>
            </div>
            <label className="file-attach-label" title="Attach text or notes file">
              <Upload size={14} />
              <span>{fileSimulated ? fileSimulated : "Add file"}</span>
              <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} accept=".txt,.md,.pdf,.doc,.docx" />
            </label>
          </div>

          <textarea
            className="freeform-notes-area"
            value={rawNotes}
            onChange={handleNotesChange}
            placeholder="Type freely... e.g. We are discussing our Q3 initiative. Search score is 78 with +12% volume. Creative was delayed 3 days because design needed legal sign-off. Hold off on scaling budget until Tuesday's test confirms efficiency..."
            rows={10}
          />

          {/* Quick Action: Synthesize Questions from Notes */}
          <div className="synthesize-action-row">
            <button
              type="button"
              className="btn-synthesize-gradient"
              onClick={handleSynthesizeClick}
              title="Generate tailored meeting questions and leader answers from these notes"
            >
              <Sparkles size={15} />
              <span>✨ Synthesize Questions & Leader Answers from My Notes</span>
            </button>
          </div>

          {/* Speaking Style & Detail Level */}
          <div className="speaking-style-section">
            <div className="speaking-style-header">
              <Smile size={16} className="text-accent" />
              <h3>How should Babe sound like you?</h3>
            </div>

            <div className="tone-selector-pills">
              {toneOptions.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`tone-pill-btn ${speakingStyle.tone === t ? 'active' : ''}`}
                  onClick={() => setSpeakingStyle(prev => ({ ...prev, tone: t }))}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Answer Depth Selector */}
            <div className="depth-selector-container">
              <span className="depth-label">Answer Detail & Length:</span>
              <div className="depth-pills">
                {depthOptions.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    className={`depth-pill-btn ${(speakingStyle.depthId || 'detailed') === d.id ? 'active' : ''}`}
                    onClick={() => setSpeakingStyle(prev => ({ ...prev, depthId: d.id, depth: d.label }))}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="quirks-input-box">
              <label className="quirks-label">Anything about how you talk that Aside should know?</label>
              <input
                type="text"
                className="quirks-input"
                value={speakingStyle.userQuirks}
                onChange={(e) => setSpeakingStyle(prev => ({ ...prev, userQuirks: e.target.value }))}
                placeholder="e.g. Articulate, human, and visionary. I lead with strategic context and keep things conversational."
              />
              <span className="quirks-hint">Aside uses this to shape natural, authentic cues that match how you speak.</span>
            </div>
          </div>

          <div className="prepare-actions">
            <button
              className="btn-primary-warm w-full"
              onClick={() => setCurrentScreen('meeting')}
            >
              <span>Start Private Meeting Mode</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>

        {/* Right Column: Clean Preview (Executive Memory Brief) */}
        <div className="cheat-sheet-card glass-panel">
          <div className="cheat-sheet-header">
            <div>
              <span className="cheat-sheet-tag">Structured by Aside</span>
              <h2 className="cheat-sheet-title">EXECUTIVE PRE-MEETING BRIEF</h2>
            </div>
            <span className="badge-ready">✓ Ready</span>
          </div>

          <p className="cheat-sheet-desc">
            Synthesized intelligently with executive depth. Grounding you with articulate talking points:
          </p>

          {/* Section: Core Narrative */}
          {cheatSheet.coreNarrative && (
            <div className="brief-narrative-box">
              <span className="narrative-tag">Strategic Core</span>
              <p className="narrative-text">{cheatSheet.coreNarrative}</p>
            </div>
          )}

          {/* Section: Things to Remember */}
          <div className="sheet-section">
            <div className="sheet-section-title">
              <CheckCircle size={15} className="text-accent" />
              <span>KEY STRATEGIC POINTS</span>
            </div>
            <ul className="sheet-list">
              {(cheatSheet.thingsToRemember || cheatSheet.thingsToMention || []).map((item, idx) => (
                <li key={idx} className="sheet-list-item">
                  <span>• {item}</span>
                  <button
                    className="delete-item-btn"
                    onClick={() => handleRemoveRemember(idx)}
                    title="Remove item"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={handleAddRemember} className="add-item-form">
              <input
                type="text"
                placeholder="+ Add strategic point..."
                value={newRemember}
                onChange={(e) => setNewRemember(e.target.value)}
                className="add-item-input"
              />
            </form>
          </div>

          {/* Section: Guardrails if present */}
          {cheatSheet.guardrails && cheatSheet.guardrails.length > 0 && (
            <div className="sheet-section">
              <div className="sheet-section-title">
                <ShieldAlert size={15} className="text-amber" />
                <span>OPERATIONAL GUARDRAILS & DON'TS</span>
              </div>
              <ul className="sheet-list">
                {cheatSheet.guardrails.map((g, idx) => (
                  <li key={idx} className="sheet-list-item guardrail-item">
                    <span>⚠️ {g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section: Ask */}
          <div className="sheet-section">
            <div className="sheet-section-title">
              <HelpCircle size={15} className="text-accent" />
              <span>STRATEGIC QUESTIONS TO ASK</span>
            </div>
            <ul className="sheet-list">
              {(cheatSheet.thingsToAsk || cheatSheet.questionsToAsk || []).map((item, idx) => (
                <li key={idx} className="sheet-list-item">
                  <span>? {item}</span>
                  <button
                    className="delete-item-btn"
                    onClick={() => handleRemoveAsk(idx)}
                    title="Remove item"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={handleAddAsk} className="add-item-form">
              <input
                type="text"
                placeholder="+ Add question to ask..."
                value={newAsk}
                onChange={(e) => setNewAsk(e.target.value)}
                className="add-item-input"
              />
            </form>
          </div>

          {/* Section: Important Numbers */}
          <div className="sheet-section">
            <div className="sheet-section-title">
              <Hash size={15} className="text-accent" />
              <span>VERIFIED METRICS & BENCHMARKS</span>
            </div>
            <div className="numbers-chips-grid">
              {cheatSheet.importantNumbers?.map((num, idx) => (
                <div key={idx} className="number-chip">
                  <span className="num-label">{num.label}:</span>
                  <span className="num-val">{num.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grounding Reassurance */}
          <div className="grounding-reminder-box">
            <ShieldCheck size={16} className="text-sage" />
            <span>
              “You have the domain mastery. Lead with calm confidence and let the verified data do the heavy lifting.”
            </span>
          </div>
        </div>
      </div>

      {/* Synthesized Meeting Scenarios Preview */}
      <div className="synthesized-preview-section glass-panel">
        <div className="preview-section-header">
          <div className="preview-title-group">
            <MessageSquareQuote size={18} className="text-accent" />
            <h3>Generated Meeting Scenarios from Your Notes ({questionsList.length} Questions Ready)</h3>
          </div>
          <span className="badge-live-intel">✨ Leader Answers Active</span>
        </div>
        <p className="preview-section-subtitle">
          Babe automatically extracted these realistic questions from your notes and drafted articulate, multi-sentence executive answers:
        </p>

        <div className="preview-scenarios-grid">
          {questionsList.slice(0, 3).map((q, idx) => (
            <div key={q.id || idx} className="scenario-preview-card">
              <div className="scenario-card-header">
                <span className="scenario-idx">#{idx + 1}</span>
                <span className="scenario-speaker">{q.speaker}</span>
                <span className="scenario-cat-tag">{q.category}</span>
              </div>
              <h4 className="scenario-question-text">“{q.question}”</h4>
              <div className="scenario-say-preview">
                <span className="scenario-say-label">Babe Leader Response:</span>
                <p className="scenario-say-text">“{q.glanceSay}”</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
