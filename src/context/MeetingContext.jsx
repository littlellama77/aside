import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  ASIDE_PRODUCT_NAME,
  ASIDE_TAGLINE,
  ASIDE_DESCRIPTION,
  DEFAULT_USER,
  CONVERSATION_STATES,
  BUY_ME_A_SECOND_PHRASES,
  PRESET_NOTE_TEMPLATES,
  DEMO_SCENARIOS,
  INITIAL_CONVERSATION_HISTORY,
  MEETING_WRAPUP_SUMMARY
} from '../constants/mockData';
import {
  parseNotesToExecutiveBrief,
  generateQuestionsFromNotes,
  synthesizeLeaderAnswerForCustomQuestion
} from '../utils/notesSynthesizer';
import { companionSync } from '../services/companionSync';

const MeetingContext = createContext(null);

export function MeetingProvider({ children }) {
  // Navigation & Theme
  const [currentScreen, setCurrentScreen] = useState('welcome'); // 'welcome' | 'prepare' | 'setup' | 'meeting' | 'wrapup'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aside_theme') || 'light';
  });

  // User Profile
  const [userName, setUserName] = useState(DEFAULT_USER);
  const [speakingStyle, setSpeakingStyle] = useState({
    tone: "Executive Leader",
    depthId: "detailed",
    depth: "Executive Depth (Longer & Detailed)",
    userQuirks: "Articulate, human, and visionary. I lead with strategic context and stay conversational."
  });

  // Pre-Meeting Notes & Executive Memory Brief
  const [selectedTemplateId, setSelectedTemplateId] = useState('marketing-q3');
  const [rawNotes, setRawNotes] = useState(PRESET_NOTE_TEMPLATES[0].rawNotes);
  const [cheatSheet, setCheatSheet] = useState(PRESET_NOTE_TEMPLATES[0].cheatSheet);

  // Meeting Configuration
  const [meetingConfig, setMeetingConfig] = useState({
    name: "Q3 Acquisition & Performance Review",
    type: "Work",
    topic: "Marketing campaign performance",
    tone: "Executive Leader"
  });

  // Screen Sharing Safety & Phone Sync (Laptop is "Ears + Brain", Phone is "Private Display Only")
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isPhonePaired, setIsPhonePaired] = useState(true);
  const [phoneConnectionStatus, setPhoneConnectionStatus] = useState('connected'); // 'connected' | 'connecting' | 'disconnected'
  const [phoneConnectionType, setPhoneConnectionType] = useState('simulated'); // 'webrtc' | 'broadcast' | 'simulated'
  const [pairingCode] = useState("ASIDE-8492");
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'desktop-only' | 'phone-only'

  // ============================================================================
  // CONVERSATION STATE MACHINE (Section 3)
  // LISTENING | OTHER_PERSON_SPEAKING | POSSIBLE_QUESTION | QUESTION_CONFIRMED | YOUR_TURN | RESPONSE_FINISHED
  // ============================================================================
  const [conversationState, setConversationState] = useState(CONVERSATION_STATES.LISTENING);
  const [stateTransitionLog, setStateTransitionLog] = useState([]);

  // ============================================================================
  // DUAL AUDIO ARCHITECTURE (Section 2)
  // userAudio (User Microphone) vs meetingAudio (Meeting Participants Stream)
  // ============================================================================
  const [userAudio, setUserAudio] = useState({ isSpeaking: false, level: 0 });
  const [meetingAudio, setMeetingAudio] = useState({ isSpeaking: false, speaker: "Sarah (VP Marketing)", level: 0 });

  // Rolling continuous conversation context (Section 10)
  const [conversationHistory, setConversationHistory] = useState(INITIAL_CONVERSATION_HISTORY);

  // Active question & frozen suggestion (Section 4: User speech never regenerates!)
  const [activeQuestion, setActiveQuestion] = useState(DEMO_SCENARIOS[0]);
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [frozenSuggestion, setFrozenSuggestion] = useState(null);
  const [isQuestionActive, setIsQuestionActive] = useState(true);

  // Targeting & Confidence metadata (Section 6 & 9)
  const [targetingInfo, setTargetingInfo] = useState({
    isTargetedAtUser: true,
    confidence: "high",
    reason: "Directly addressed to user regarding prepared domain."
  });

  // Emergency & Utility Controls
  const [isStuckModalOpen, setIsStuckModalOpen] = useState(false);
  const [stallingPhrase, setStallingPhrase] = useState(null);
  const [disclosureLevel, setDisclosureLevel] = useState('glance'); // 'glance' | 'expanded' | 'context'
  const [speechActive, setSpeechActive] = useState(false);

  // Mini Floating Assistant Controls
  const [isMiniWindowCollapsed, setIsMiniWindowCollapsed] = useState(false);
  const [isMiniWindowHidden, setIsMiniWindowHidden] = useState(false);

  // Live Speech Recognition for Microsoft Teams, Zoom, Google Meet
  const [isLiveListening, setIsLiveListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speechSupport, setSpeechSupport] = useState(true);
  const recognitionRef = useRef(null);

  // Tab Audio Capture (DisplayMedia API)
  const [isTabAudioCapturing, setIsTabAudioCapturing] = useState(false);
  const tabStreamRef = useRef(null);

  // Compact Dock Mode (for placing right beside Zoom / Teams / Meet)
  const [isCompactMode, setIsCompactMode] = useState(false);

  // Notes Drawer Open/Close
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);

  // Meeting Questions Feed (Chronological list of all questions & answers)
  const [questionsFeed, setQuestionsFeed] = useState(() => DEMO_SCENARIOS.slice(0, 5));

  // Live notification banner (for state machine triggers & targeting alerts)
  const [systemNotice, setSystemNotice] = useState(null);
  const noticeTimerRef = useRef(null);

  const showSystemNotice = useCallback((text, durationMs = 3500) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setSystemNotice(text);
    noticeTimerRef.current = setTimeout(() => {
      setSystemNotice(null);
    }, durationMs);
  }, []);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aside_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Keyboard shortcut listener: Alt+A or Alt+B to toggle mini assistant
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.altKey || e.ctrlKey) && (e.key === 'a' || e.key === 'A' || e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsMiniWindowHidden(prev => !prev);
      }
      if (e.key === 'Escape' && isStuckModalOpen) {
        setIsStuckModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStuckModalOpen]);

  // Companion Sync Engine: Laptop is "Ears + Brain", Phone is "Private Display Only"
  useEffect(() => {
    const isUrlPhoneMode = window.location.search.includes('view=phone');
    if (isUrlPhoneMode) return;

    // Initialize Laptop Host
    companionSync.initLaptop(pairingCode);

    const unsubStatus = companionSync.onStatusChange((status, type) => {
      setPhoneConnectionStatus(status);
      setPhoneConnectionType(type);
      setIsPhonePaired(status === 'connected');
    });

    const unsubMsg = companionSync.onMessage((msg) => {
      if (msg.type === 'PHONE_ACTION') {
        if (msg.action === 'STUCK') {
          setIsStuckModalOpen(true);
          showSystemNotice("🚨 Emergency recovery activated from Phone Companion");
        } else if (msg.action === 'NEED_A_SECOND') {
          const phrase = BUY_ME_A_SECOND_PHRASES[Math.floor(Math.random() * BUY_ME_A_SECOND_PHRASES.length)];
          setStallingPhrase(phrase);
          showSystemNotice("⏱️ Stalling phrase requested from Phone Companion");
        } else if (msg.action === 'PHONE_CONNECTED') {
          showSystemNotice("📱 Phone Companion paired over the internet (WebRTC)");
        }
      }
    });

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }, [pairingCode, showSystemNotice]);

  // Broadcast state to phone whenever active question, state, or flags change
  useEffect(() => {
    const isUrlPhoneMode = window.location.search.includes('view=phone');
    if (isUrlPhoneMode) return;

    companionSync.broadcastStateToPhone({
      conversationState,
      activeQuestion,
      isQuestionActive,
      frozenSuggestion,
      isScreenSharing,
      stallingPhrase,
      disclosureLevel,
      targetingInfo,
      cheatSheet,
      timestamp: Date.now()
    });
  }, [
    conversationState,
    activeQuestion,
    isQuestionActive,
    frozenSuggestion,
    isScreenSharing,
    stallingPhrase,
    disclosureLevel,
    targetingInfo,
    cheatSheet
  ]);

  const sendTestPingToPhone = useCallback(() => {
    companionSync.broadcastStateToPhone({
      conversationState,
      activeQuestion,
      isQuestionActive: true,
      frozenSuggestion,
      isScreenSharing,
      stallingPhrase,
      disclosureLevel,
      targetingInfo,
      cheatSheet,
      timestamp: Date.now()
    });
    showSystemNotice("⚡ State packet beamed to Phone Companion");
  }, [
    conversationState,
    activeQuestion,
    frozenSuggestion,
    isScreenSharing,
    stallingPhrase,
    disclosureLevel,
    targetingInfo,
    cheatSheet,
    showSystemNotice
  ]);

  const setSimulatedPhoneStatus = useCallback((connected) => {
    companionSync.setSimulatedStatus(connected);
    setPhoneConnectionStatus(connected ? 'connected' : 'disconnected');
    setPhoneConnectionType('simulated');
    setIsPhonePaired(connected);
    showSystemNotice(connected ? "📱 Phone Companion connected (Simulated)" : "📱 Phone Companion disconnected");
  }, [showSystemNotice]);

  // Log state machine transitions
  const transitionToState = useCallback((nextState, reason = "") => {
    setConversationState(nextState);
    setStateTransitionLog(prev => [
      ...prev.slice(-15),
      {
        from: conversationState,
        to: nextState,
        reason,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    ]);
  }, [conversationState]);

  // ============================================================================
  // STATE MACHINE ACTIONS (Matching Section 3, 4, 7, 8, 23)
  // ============================================================================

  /**
   * Action 1: Participant speaking in Meeting Audio
   */
  const triggerParticipantSpeaking = useCallback((speakerName = "Sarah (VP Marketing)", text = "Let's review the campaign metrics...") => {
    // 1. Audio stream update
    setMeetingAudio({ isSpeaking: true, speaker: speakerName, level: 75 });
    setUserAudio({ isSpeaking: false, level: 0 });

    // 2. State transition
    transitionToState(CONVERSATION_STATES.OTHER_PERSON_SPEAKING, `${speakerName} is speaking`);
    showSystemNotice(`🎙️ Meeting Audio: ${speakerName} is speaking...`);

    // 3. Anticipatory processing (Section 13)
    // Add to rolling context silently without triggering popups
    setConversationHistory(prev => [
      ...prev,
      {
        id: `stmt-${Date.now()}`,
        speaker: speakerName,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: false,
        type: "statement"
      }
    ]);

    // End audio pulse after 2.5s
    setTimeout(() => {
      setMeetingAudio(prev => ({ ...prev, isSpeaking: false, level: 15 }));
    }, 2500);
  }, [transitionToState, showSystemNotice]);

  /**
   * Action 2: Question detected and confirmed for user
   */
  const triggerQuestionDetected = useCallback((scenarioObj = null) => {
    const q = scenarioObj || DEMO_SCENARIOS[0];
    setActiveQuestion(q);
    setStallingPhrase(null);
    setIsStuckModalOpen(false);
    setDisclosureLevel('glance');

    // Step 1: Meeting Audio active
    setMeetingAudio({ isSpeaking: true, speaker: q.speaker, level: 85 });
    setUserAudio({ isSpeaking: false, level: 0 });

    // Step 2: POSSIBLE QUESTION (evaluating signals)
    transitionToState(CONVERSATION_STATES.POSSIBLE_QUESTION, "Evaluating question structure & targeting...");

    setTimeout(() => {
      // Step 3: QUESTION CONFIRMED (directed at user)
      setTargetingInfo({
        isTargetedAtUser: true,
        confidence: q.confidence || "high",
        reason: "Directed to user; context matches prepared briefing."
      });

      transitionToState(CONVERSATION_STATES.QUESTION_CONFIRMED, "Question confirmed for user. Response ready.");
      setIsQuestionActive(true);
      showSystemNotice(`✦ Question detected from ${q.speaker}`);

      // Add to rolling conversation log
      setConversationHistory(prev => {
        if (!prev.some(item => item.id === q.id)) {
          return [
            ...prev,
            {
              id: q.id,
              speaker: q.speaker,
              text: q.question,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isUser: false,
              type: "question"
            }
          ];
        }
        return prev;
      });

      // Add to questions feed for meeting timeline
      setQuestionsFeed(prev => {
        if (!prev.some(item => item.id === q.id || item.question === q.question)) {
          return [q, ...prev];
        }
        return prev;
      });

      setTimeout(() => {
        setMeetingAudio(prev => ({ ...prev, isSpeaking: false, level: 10 }));
      }, 1000);
    }, 450);
  }, [transitionToState, showSystemNotice]);

  /**
   * Action 3: Question NOT for user (Section 8: Question Misdetection / False Trigger)
   */
  const triggerQuestionNotForUser = useCallback((speakerName = "Marcus (Growth Lead)", questionText = "Does anyone want coffee or water?") => {
    setMeetingAudio({ isSpeaking: true, speaker: speakerName, level: 75 });
    setUserAudio({ isSpeaking: false, level: 0 });

    // Step 1: Possible question
    transitionToState(CONVERSATION_STATES.POSSIBLE_QUESTION, "Evaluating targeting...");

    setTimeout(() => {
      // Targeting check failed: room-wide or answered by someone else
      setTargetingInfo({
        isTargetedAtUser: false,
        confidence: "none",
        reason: "General room query with no user targeting cues."
      });

      // Stays / returns to LISTENING quietly
      transitionToState(CONVERSATION_STATES.LISTENING, "Not directed at user. Aside remains quiet.");
      setIsQuestionActive(false);
      showSystemNotice(`● Ignored room question: "${questionText}" — Aside stays quiet.`);

      setMeetingAudio({ isSpeaking: false, level: 10 });
    }, 500);
  }, [transitionToState, showSystemNotice]);

  /**
   * Action 4: User begins speaking (Section 3 & 4: YOUR TURN — FREEZE SUGGESTION!)
   */
  const triggerUserSpeaking = useCallback((userSpeechSnippet = null) => {
    // 1. Audio stream: User mic activated
    setUserAudio({ isSpeaking: true, level: 85 });
    setMeetingAudio({ isSpeaking: false, speaker: "None", level: 5 });

    // 2. CRITICAL RULE (Section 4): Freeze current suggestion intact
    const currentSay = activeQuestion?.glanceSay || "Mostly the creative change and higher CPC.";
    setFrozenSuggestion(currentSay);

    // 3. State transition: YOUR_TURN
    transitionToState(CONVERSATION_STATES.YOUR_TURN, "User speaking detected on microphone. Suggestion frozen.");
    showSystemNotice("🗣️ YOUR TURN — Suggestion frozen. User speech never triggers regeneration.");

    // Append user speech snippet to rolling context
    if (userSpeechSnippet) {
      setConversationHistory(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          speaker: `You (${userName})`,
          text: userSpeechSnippet,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isUser: true,
          type: "answer"
        }
      ]);
    }
  }, [activeQuestion, userName, transitionToState, showSystemNotice]);

  /**
   * Action 5: User finishes speaking (Section 3: Short natural pause -> LISTENING)
   */
  const triggerUserFinished = useCallback(() => {
    // 1. Audio stream: User mic stops
    setUserAudio({ isSpeaking: false, level: 5 });

    // 2. State transition: RESPONSE_FINISHED
    transitionToState(CONVERSATION_STATES.RESPONSE_FINISHED, "User speech ended. Pausing...");
    showSystemNotice("✓ Response finished. Returning to quiet listening...");

    // Short natural pause (1.2s) -> Return to LISTENING
    setTimeout(() => {
      transitionToState(CONVERSATION_STATES.LISTENING, "Natural pause elapsed. Aside is quietly listening.");
      setIsQuestionActive(false);
    }, 1200);
  }, [transitionToState, showSystemNotice]);

  /**
   * Action 6: Load and run any specific Demo Scenario (1 through 8)
   */
  const selectScenarioByIndex = useCallback((index) => {
    if (index >= 0 && index < DEMO_SCENARIOS.length) {
      setActiveScenarioIndex(index);
      const sc = DEMO_SCENARIOS[index];

      if (sc.category === "false-trigger") {
        triggerQuestionNotForUser(sc.speaker, sc.question);
      } else if (sc.category === "user-speaking") {
        triggerUserSpeaking(sc.question);
      } else {
        triggerQuestionDetected(sc);
      }
    }
  }, [triggerQuestionNotForUser, triggerUserSpeaking, triggerQuestionDetected]);

  /**
   * Custom Question Input / Voice Answering (Section 11: Unexpected Question Workflow)
   */
  const askCustomQuestion = useCallback((customText, speakerName = "Meeting Attendee") => {
    if (!customText.trim()) return;

    // Check targeting cues
    const isDirected = !customText.toLowerCase().includes("does anyone want") &&
                       !customText.toLowerCase().includes("anyone need a bio break");

    if (!isDirected) {
      triggerQuestionNotForUser(speakerName, customText);
      return;
    }

    const synthesizedQ = synthesizeLeaderAnswerForCustomQuestion(
      customText,
      rawNotes,
      cheatSheet,
      speakingStyle
    );

    synthesizedQ.speaker = speakerName;
    triggerQuestionDetected(synthesizedQ);
  }, [rawNotes, cheatSheet, speakingStyle, triggerQuestionNotForUser, triggerQuestionDetected]);

  // Load a preset template
  const loadTemplate = useCallback((templateId) => {
    const t = PRESET_NOTE_TEMPLATES.find(item => item.id === templateId) || PRESET_NOTE_TEMPLATES[0];
    setSelectedTemplateId(t.id);
    setRawNotes(t.rawNotes);
    const brief = parseNotesToExecutiveBrief(t.rawNotes);
    setCheatSheet(brief);
    setMeetingConfig(prev => ({
      ...prev,
      name: t.title,
      type: t.type,
      topic: t.topic
    }));
    setActiveScenarioIndex(0);
    selectScenarioByIndex(0);
  }, [selectScenarioByIndex]);

  // Parse notes to executive memory brief
  const parseNotesToCheatSheet = useCallback((text) => {
    const brief = parseNotesToExecutiveBrief(text);
    setCheatSheet(brief);
  }, []);

  // Regenerate questions dynamically from notes
  const regenerateQuestionsFromNotes = useCallback((notesToUse = rawNotes) => {
    const newQuestions = generateQuestionsFromNotes(notesToUse, 'custom');
    if (newQuestions.length > 0) {
      setActiveQuestion(newQuestions[0]);
      triggerQuestionDetected(newQuestions[0]);
    }
    return newQuestions;
  }, [rawNotes, triggerQuestionDetected]);

  // Screen sharing toggle (Section 19: Desktop hides, phone becomes private display)
  const toggleScreenSharing = useCallback((val) => {
    const newVal = typeof val === 'boolean' ? val : !isScreenSharing;
    setIsScreenSharing(newVal);
    companionSync.broadcastStateToPhone({ isScreenSharing: newVal });
    showSystemNotice(newVal ? "🔒 Screen sharing detected: Desktop hidden. Pointers sent to phone." : "Screen share safety: Standby");
  }, [isScreenSharing, showSystemNotice]);

  // "I'm stuck" toggle (Section 20)
  const triggerImStuck = useCallback((open = true) => {
    setIsStuckModalOpen(open);
    companionSync.broadcastStateToPhone({ isStuckModalOpen: open });
  }, []);

  // "I need a second" stalling phrase (Section 21)
  const triggerBuyMeASecond = useCallback(() => {
    const rand = BUY_ME_A_SECOND_PHRASES[Math.floor(Math.random() * BUY_ME_A_SECOND_PHRASES.length)];
    setStallingPhrase(rand);
    companionSync.broadcastStateToPhone({ stallingPhrase: rand });
  }, []);

  // Text-To-Speech helper for practice listening
  const speakText = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (speechActive) {
      setSpeechActive(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.onend = () => setSpeechActive(false);
    utterance.onerror = () => setSpeechActive(false);
    setSpeechActive(true);
    window.speechSynthesis.speak(utterance);
  }, [speechActive]);

  // Select a question directly from history
  const selectQuestion = useCallback((q) => {
    setActiveQuestion(q);
    setIsQuestionActive(true);
    setFrozenSuggestion(null);
    transitionToState(CONVERSATION_STATES.QUESTION_CONFIRMED, `Loaded question from ${q.speaker}`);
  }, [transitionToState]);

  // Live Microphone Listening (Web Speech API for Zoom / Teams / GMeet)
  const toggleLiveListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupport(false);
      showSystemNotice("Speech recognition isn't supported in this browser. Please use Chrome/Edge or type your question below.");
      return;
    }

    if (isLiveListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsLiveListening(false);
      setLiveTranscript('');
      showSystemNotice("Microphone listening paused.");
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsLiveListening(true);
          setLiveTranscript('Listening for meeting questions...');
          showSystemNotice("🎙️ Listening to meeting audio! Speak or let coworkers speak on your speakers.");
        };

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }
          const text = (final || interim).trim();
          setLiveTranscript(text);

          // If a phrase is finalized and contains question patterns, ask it
          if (final.trim().length > 10) {
            const lower = final.toLowerCase();
            const isQuestion = lower.includes('?') ||
              lower.startsWith('why') || lower.startsWith('how') || lower.startsWith('what') ||
              lower.startsWith('can you') || lower.startsWith('could you') || lower.startsWith('should we') ||
              lower.startsWith('do you') || lower.startsWith('is there') || lower.startsWith('what do you');

            if (isQuestion) {
              askCustomQuestion(final.trim(), "Meeting Participant (Transcribed)");
            } else {
              setConversationHistory(prev => [
                ...prev,
                {
                  id: `transcribed-${Date.now()}`,
                  speaker: "Meeting Participant",
                  text: final.trim(),
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isUser: false,
                  type: "statement"
                }
              ]);
            }
          }
        };

        recognition.onerror = (event) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === 'not-allowed') {
            showSystemNotice("Microphone permission denied. Enable microphone in browser settings to transcribe meeting audio.");
            setIsLiveListening(false);
          }
        };

        recognition.onend = () => {
          if (isLiveListening) {
            try { recognition.start(); } catch (e) {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsLiveListening(false);
      }
    }
  }, [isLiveListening, askCustomQuestion, showSystemNotice]);

  // Tab Audio Capture (DisplayMedia API)
  const startTabAudioCapture = useCallback(async () => {
    try {
      if (isTabAudioCapturing) {
        if (tabStreamRef.current) {
          tabStreamRef.current.getTracks().forEach(t => t.stop());
        }
        setIsTabAudioCapturing(false);
        showSystemNotice("Meeting tab audio capture stopped.");
        return;
      }

      if (!navigator.mediaDevices?.getDisplayMedia) {
        showSystemNotice("Tab audio sharing not supported on this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      tabStreamRef.current = stream;
      setIsTabAudioCapturing(true);
      showSystemNotice("🖥️ Meeting audio connected! Aside is listening to your meeting tab.");

      stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          setIsTabAudioCapturing(false);
        };
      });
    } catch (err) {
      console.warn("DisplayMedia cancelled or denied:", err);
    }
  }, [isTabAudioCapturing, showSystemNotice]);

  // Start Meeting & Wrap up
  const startMeeting = useCallback(() => {
    setCurrentScreen('meeting');
    selectScenarioByIndex(0);
    companionSync.broadcastStateToPhone({ currentScreen: 'meeting' });
  }, [selectScenarioByIndex]);

  const wrapUpMeeting = useCallback(() => {
    setCurrentScreen('wrapup');
    setIsQuestionActive(false);
    setIsStuckModalOpen(false);
    setConversationState(CONVERSATION_STATES.LISTENING);
    companionSync.broadcastStateToPhone({ currentScreen: 'wrapup', isQuestionActive: false });
  }, []);

  const value = {
    // Branding
    productName: ASIDE_PRODUCT_NAME,
    tagline: ASIDE_TAGLINE,
    description: ASIDE_DESCRIPTION,

    // Navigation & Theme
    currentScreen,
    setCurrentScreen,
    theme,
    toggleTheme,
    userName,
    setUserName,
    speakingStyle,
    setSpeakingStyle,

    // Pre-Meeting Notes
    selectedTemplateId,
    loadTemplate,
    rawNotes,
    setRawNotes,
    cheatSheet,
    setCheatSheet,
    executiveBrief: cheatSheet,
    parseNotesToCheatSheet,
    regenerateQuestionsFromNotes,

    // Meeting Configuration & Screens
    meetingConfig,
    setMeetingConfig,
    isScreenSharing,
    toggleScreenSharing,
    isPhonePaired,
    setIsPhonePaired,
    phoneConnectionStatus,
    phoneConnectionType,
    sendTestPingToPhone,
    setSimulatedPhoneStatus,
    pairingCode,
    viewMode,
    setViewMode,

    // CONVERSATION STATE MACHINE
    conversationState,
    setConversationState,
    transitionToState,
    stateTransitionLog,

    // DUAL AUDIO ARCHITECTURE
    userAudio,
    setUserAudio,
    meetingAudio,
    setMeetingAudio,

    // QUESTION & SUGGESTION
    activeQuestion,
    setActiveQuestion,
    activeScenarioIndex,
    frozenSuggestion,
    isQuestionActive,
    setIsQuestionActive,
    targetingInfo,

    // CONTINUOUS CONTEXT
    conversationHistory,
    setConversationHistory,

    // DEMO CONTROLS (Section 23)
    triggerParticipantSpeaking,
    triggerQuestionDetected,
    triggerQuestionNotForUser,
    triggerUserSpeaking,
    triggerUserFinished,
    selectScenarioByIndex,
    askCustomQuestion,
    selectQuestion,

    // REAL MEETING INTEGRATION (Teams, Zoom, Meet)
    isLiveListening,
    toggleLiveListening,
    liveTranscript,
    speechSupport,
    isTabAudioCapturing,
    startTabAudioCapture,
    isCompactMode,
    setIsCompactMode,
    isNotesDrawerOpen,
    setIsNotesDrawerOpen,
    questionsFeed,

    // FLOATING WINDOW & UTILITY
    isMiniWindowCollapsed,
    setIsMiniWindowCollapsed,
    isMiniWindowHidden,
    setIsMiniWindowHidden,
    disclosureLevel,
    setDisclosureLevel,
    isStuckModalOpen,
    triggerImStuck,
    stallingPhrase,
    setStallingPhrase,
    triggerBuyMeASecond,
    speakText,
    speechActive,
    systemNotice,

    // SCENARIOS & RECAP
    demoScenarios: DEMO_SCENARIOS,
    questionsList: DEMO_SCENARIOS,
    wrapUpSummary: MEETING_WRAPUP_SUMMARY,
    stallingPhrases: BUY_ME_A_SECOND_PHRASES,
    startMeeting,
    wrapUpMeeting
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}
