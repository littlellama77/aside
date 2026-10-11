import React, { useState, useEffect, useRef } from 'react';
import { useMeeting } from '../context/MeetingContext';
import {
  Mic,
  Zap,
  Square,
  Pin,
  PinOff,
  MousePointer,
  ChevronDown,
  ChevronUp,
  Volume2
} from 'lucide-react';

export function FloatingQuestionTrigger() {
  const {
    isManualCaptureActive,
    manualCapturedTranscript,
    toggleManualQuestionCapture,
    isFollowCursorEnabled,
    setIsFollowCursorEnabled,
    currentScreen,
    activeQuestion,
    isGeneratingWithAi
  } = useMeeting();

  const [mousePos, setMousePos] = useState({ x: 24, y: window.innerHeight - 90 });
  const [pinnedPos, setPinnedPos] = useState(() => {
    try {
      const saved = localStorage.getItem('aside_pinned_trigger_pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: window.innerWidth - 280, y: window.innerHeight - 80 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const [isMinimized, setIsMinimized] = useState(false);

  // 1. Follow Mouse Mode: Smoothly track mouse cursor
  useEffect(() => {
    if (!isFollowCursorEnabled) return;

    let animationFrameId;
    const handleMouseMove = (e) => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        // Offset so the floating pill hovers comfortably near the cursor without blocking clicks
        const offsetX = 22;
        const offsetY = 18;

        // Viewport boundary clamping
        const pillWidth = isManualCaptureActive ? 320 : 210;
        const pillHeight = 46;

        let targetX = e.clientX + offsetX;
        let targetY = e.clientY + offsetY;

        if (targetX + pillWidth > window.innerWidth - 12) {
          targetX = e.clientX - pillWidth - 10;
        }
        if (targetY + pillHeight > window.innerHeight - 12) {
          targetY = e.clientY - pillHeight - 10;
        }

        setMousePos({
          x: Math.max(10, targetX),
          y: Math.max(10, targetY)
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isFollowCursorEnabled, isManualCaptureActive]);

  // 2. Draggable handler when Pinned
  const handleDragStart = (e) => {
    if (isFollowCursorEnabled) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pinnedPos.x,
      initialY: pinnedPos.y
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e) => {
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const newPos = {
        x: Math.max(10, Math.min(window.innerWidth - 220, dragStartRef.current.initialX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 60, dragStartRef.current.initialY + dy))
      };
      setPinnedPos(newPos);
      try {
        localStorage.setItem('aside_pinned_trigger_pos', JSON.stringify(newPos));
      } catch {}
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  const currentPos = isFollowCursorEnabled ? mousePos : pinnedPos;

  if (isMinimized) {
    return (
      <button
        type="button"
        className={`floating-trigger-minimized ${isManualCaptureActive ? 'recording' : ''}`}
        style={{ left: `${currentPos.x}px`, top: `${currentPos.y}px` }}
        onClick={() => setIsMinimized(false)}
        title="Expand Question Listener"
      >
        <Mic size={14} className={isManualCaptureActive ? 'animate-pulse text-white' : 'text-accent'} />
      </button>
    );
  }

  return (
    <div
      className={`floating-question-trigger-container ${isFollowCursorEnabled ? 'following-cursor' : 'pinned'} ${isManualCaptureActive ? 'recording-active' : 'idle'} animate-fade-in`}
      style={{
        transform: `translate3d(${currentPos.x}px, ${currentPos.y}px, 0)`,
        pointerEvents: 'auto'
      }}
    >
      <div
        className={`floating-trigger-card ${isManualCaptureActive ? 'card-recording' : 'card-idle'}`}
        onClick={toggleManualQuestionCapture}
        onMouseDown={!isFollowCursorEnabled ? handleDragStart : undefined}
      >
        {/* Left Status Icon */}
        <div className="trigger-icon-area">
          {isManualCaptureActive ? (
            <div className="active-soundwave-indicator">
              <span className="wave-bar bar-1"></span>
              <span className="wave-bar bar-2"></span>
              <span className="wave-bar bar-3"></span>
            </div>
          ) : (
            <div className="idle-mic-badge">
              <Mic size={15} className="text-accent" />
            </div>
          )}
        </div>

        {/* Center Label & Live Preview */}
        <div className="trigger-text-area">
          <div className="trigger-main-row">
            <span className="trigger-title">
              {isManualCaptureActive ? "Stop & Answer ASAP" : "Listen for Question"}
            </span>
            {isManualCaptureActive && <Zap size={13} className="text-amber fill-amber animate-bounce" />}
          </div>

          {isManualCaptureActive && (
            <div className="trigger-transcript-preview" title={manualCapturedTranscript}>
              {manualCapturedTranscript ? (
                <span>"{manualCapturedTranscript.length > 36 ? '...' + manualCapturedTranscript.slice(-36) : manualCapturedTranscript}"</span>
              ) : (
                <span className="placeholder-text">Listening to interviewer...</span>
              )}
            </div>
          )}
        </div>

        {/* Hotkey Tag */}
        <div className="trigger-hotkey-badge" title="Tap Spacebar or Alt+Q to toggle">
          <span>Space</span>
        </div>

        {/* Pin / Follow Mode Toggle */}
        <button
          type="button"
          className="trigger-mode-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsFollowCursorEnabled(prev => !prev);
          }}
          title={isFollowCursorEnabled ? "Click to Pin in place" : "Click to Follow cursor"}
        >
          {isFollowCursorEnabled ? <Pin size={12} /> : <MousePointer size={12} />}
        </button>
      </div>
    </div>
  );
}
