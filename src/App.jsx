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

  // Check URL query parameters or mobile screen for standalone mobile view
  const isUrlPhoneMode = window.location.search.includes('view=phone') ||
    (typeof window !== 'undefined' && window.innerWidth <= 768 && !window.location.search.includes('view=desktop'));

  if (isUrlPhoneMode) {
    return (
      <div className="standalone-mobile-wrapper">
        <PhoneCompanion
          isStandalone={true}
          onOpenNotes={() => setIsNotesDrawerOpen(true)}
          onOpenAiSettings={() => setIsAiSettingsOpen(true)}
          onOpenPairing={() => setIsPairingOpen(true)}
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
      <HeaderNav onOpenPairingModal={() => setIsPairingOpen(true)} />

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
    </div>
  );
}

export default function App() {
  return (
    <MeetingProvider>
      <MainApp />
    </MeetingProvider>
  );
}
