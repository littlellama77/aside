import React, { useState } from 'react';
import { MeetingProvider, useMeeting } from './context/MeetingContext';
import { HeaderNav } from './components/HeaderNav';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PrepareScreen } from './components/PrepareScreen';
import { SetupScreen } from './components/SetupScreen';
import { PrivateMeetingView } from './components/PrivateMeetingView';
import { PhoneCompanion } from './components/PhoneCompanion';
import { WrapUpScreen } from './components/WrapUpScreen';
import { ImStuckModal } from './components/ImStuckModal';
import { PairingModal } from './components/PairingModal';
import { NotesDrawer } from './components/NotesDrawer';
import { AiSettingsModal } from './components/AiSettingsModal';
import { FloatingQuestionTrigger } from './components/FloatingQuestionTrigger';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function MainApp() {
  const {
    currentScreen,
    isNotesDrawerOpen,
    setIsNotesDrawerOpen,
    isAiSettingsOpen,
    setIsAiSettingsOpen
  } = useMeeting();
  const [isPairingOpen, setIsPairingOpen] = useState(false);

  // State for mobile view with instant toggling
  const [isPhoneMode, setIsPhoneMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('view');
      if (param === 'desktop') return false;
      if (param === 'phone') return true;
      return window.innerWidth <= 768;
    }
    return false;
  });

  if (isPhoneMode) {
    return (
      <div className="standalone-mobile-wrapper">
        <PhoneCompanion
          isStandalone={true}
          onOpenNotes={() => setIsNotesDrawerOpen(true)}
          onOpenAiSettings={() => setIsAiSettingsOpen(true)}
          onOpenPairing={() => setIsPairingOpen(true)}
          onToggleView={() => setIsPhoneMode(false)}
        />
        <ImStuckModal />
        <NotesDrawer isOpen={isNotesDrawerOpen} onClose={() => setIsNotesDrawerOpen(false)} />
        <AiSettingsModal isOpen={isAiSettingsOpen} onClose={() => setIsAiSettingsOpen(false)} />
        <PairingModal isOpen={isPairingOpen} onClose={() => setIsPairingOpen(false)} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header & Navigation */}
      <HeaderNav
        onOpenPairingModal={() => setIsPairingOpen(true)}
        onTogglePhoneView={() => setIsPhoneMode(true)}
      />

      {/* Main Interactive Screen Area */}
      <main className="main-content">
        {currentScreen === 'welcome' && <WelcomeScreen />}
        {currentScreen === 'prepare' && <PrepareScreen />}
        {currentScreen === 'setup' && <SetupScreen onOpenPairingModal={() => setIsPairingOpen(true)} />}
        {currentScreen === 'meeting' && <PrivateMeetingView onOpenPairingModal={() => setIsPairingOpen(true)} />}
        {currentScreen === 'wrapup' && <WrapUpScreen />}
      </main>

      {/* Emergency Cognitive Recovery Modal ("I'm stuck") */}
      <ImStuckModal />

      {/* Phone Pairing QR & Code Modal */}
      <PairingModal isOpen={isPairingOpen} onClose={() => setIsPairingOpen(false)} />

      {/* Floating Instant Question Listener (Follows cursor or pinned) */}
      <FloatingQuestionTrigger />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MeetingProvider>
        <MainApp />
      </MeetingProvider>
    </ErrorBoundary>
  );
}
