/**
 * Aside Companion Synchronization Engine
 * 
 * Supports:
 * 1. WebRTC DataChannel via PeerJS (True internet-accessible peer-to-peer connection
 *    across different networks, e.g. laptop on Wi-Fi and phone on cellular 5G).
 * 2. BroadcastChannel + Storage Events (Instantaneous zero-latency sync for same device,
 *    multi-window, popup, or browser tabs).
 * 3. Simulated Pairing Flow (Guaranteed graceful fallback in offline or restricted environments).
 * 
 * Roles:
 * - Laptop: "Ears + Brain" (processes simulated audio, state machine, targeting, generation).
 * - Phone:  "Private Display Only" (zero audio capture, zero microphone access needed).
 */

import { Peer } from 'peerjs';

class CompanionSyncEngine {
  constructor() {
    this.role = null; // 'laptop' | 'phone'
    this.pairingCode = null;
    this.peer = null;
    this.peerConnection = null;
    this.broadcastChannel = null;
    this.connectionStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'connected'
    this.connectionType = 'none'; // 'webrtc' | 'broadcast' | 'simulated'
    this.statusListeners = new Set();
    this.messageListeners = new Set();
    this.isSimulatedConnected = false;
  }

  // Subscribe to connection status changes
  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.connectionStatus, this.connectionType);
    return () => this.statusListeners.delete(callback);
  }

  // Subscribe to received messages
  onMessage(callback) {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  notifyStatus(status, type) {
    this.connectionStatus = status;
    this.connectionType = type;
    this.statusListeners.forEach(cb => {
      try { cb(status, type); } catch (e) { console.error(e); }
    });
  }

  notifyMessage(data) {
    this.messageListeners.forEach(cb => {
      try { cb(data); } catch (e) { console.error(e); }
    });
  }

  // Generate a clean sanitized room ID for WebRTC
  getPeerId(code, role) {
    const clean = (code || 'aside8492').toLowerCase().replace(/[^a-z0-9]/g, '');
    return `aside-companion-${clean}-${role}`;
  }

  getHostPeerId(code) {
    const clean = (code || 'aside8492').toLowerCase().replace(/[^a-z0-9]/g, '');
    return `aside-companion-${clean}-laptop`;
  }

  // =========================================================================
  // LAPTOP INITIALIZATION ("Ears + Brain")
  // =========================================================================
  initLaptop(code = 'ASIDE-8492') {
    this.role = 'laptop';
    this.pairingCode = code;
    this.notifyStatus('connecting', 'initiating');

    // 1. Setup local BroadcastChannel
    try {
      this.broadcastChannel = new BroadcastChannel(`aside_sync_${code}`);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'PHONE_ACTION') {
          this.notifyMessage(event.data);
        } else if (event.data?.type === 'PHONE_HELLO') {
          this.notifyStatus('connected', 'broadcast');
        }
      };
    } catch {
      // Fallback handled by localStorage
    }

    // 2. Setup LocalStorage event listener
    const storageHandler = (e) => {
      if (e.key === `aside_phone_action_${code}` && e.newValue) {
        try {
          const action = JSON.parse(e.newValue);
          this.notifyMessage(action);
        } catch {
          // ignore parsing error
        }
      }
    };
    window.addEventListener('storage', storageHandler);

    // 3. Setup WebRTC Peer (Internet-accessible connection)
    this.initLaptopWebRTC(code);

    // Default to connected for simulated flow
    this.isSimulatedConnected = true;
    setTimeout(() => {
      if (this.connectionStatus !== 'connected') {
        this.notifyStatus('connected', 'simulated');
      }
    }, 600);
  }

  initLaptopWebRTC(code) {
    try {
      const laptopPeerId = this.getHostPeerId(code);
      // Clean up previous peer
      if (this.peer) {
        try { this.peer.destroy(); } catch {}
      }

      this.peer = new Peer(laptopPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', () => {
        // Laptop peer registered on internet signaling server
      });

      this.peer.on('connection', (conn) => {
        this.peerConnection = conn;

        conn.on('open', () => {
          this.notifyStatus('connected', 'webrtc');
        });

        conn.on('data', (data) => {
          this.notifyMessage(data);
        });

        conn.on('close', () => {
          this.notifyStatus('connected', 'broadcast'); // fallback
        });
      });

      this.peer.on('error', () => {
        // If peer ID taken or network blocks WebRTC, seamlessly fall back to local/simulated
        if (this.connectionStatus !== 'connected') {
          this.notifyStatus('connected', 'simulated');
        }
      });
    } catch {
      this.notifyStatus('connected', 'simulated');
    }
  }

  // =========================================================================
  // PHONE INITIALIZATION ("Private Display Only")
  // =========================================================================
  initPhone(code = 'ASIDE-8492') {
    this.role = 'phone';
    this.pairingCode = code;
    this.notifyStatus('connecting', 'initiating');

    // 1. Setup local BroadcastChannel
    try {
      this.broadcastChannel = new BroadcastChannel(`aside_sync_${code}`);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'STATE_UPDATE') {
          this.notifyMessage(event.data);
          this.notifyStatus('connected', 'broadcast');
        }
      };

      // Announce phone presence
      this.broadcastChannel.postMessage({ type: 'PHONE_HELLO', code, timestamp: Date.now() });
    } catch {
      // BroadcastChannel fallback
    }

    // 2. Setup LocalStorage event listener
    const storageHandler = (e) => {
      if (e.key === `aside_state_${code}` && e.newValue) {
        try {
          const stateData = JSON.parse(e.newValue);
          this.notifyMessage(stateData);
          this.notifyStatus('connected', 'broadcast');
        } catch {}
      }
    };
    window.addEventListener('storage', storageHandler);

    // Initial check for cached state in localStorage
    try {
      const cached = localStorage.getItem(`aside_state_${code}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.notifyMessage(parsed);
        this.notifyStatus('connected', 'broadcast');
      }
    } catch {}

    // 3. Setup WebRTC Peer (Internet-accessible connection)
    this.initPhoneWebRTC(code);

    // If no message within 1.2s, mark as connected in simulated flow
    setTimeout(() => {
      if (this.connectionStatus === 'connecting') {
        this.notifyStatus('connected', 'simulated');
      }
    }, 1200);
  }

  initPhoneWebRTC(code) {
    try {
      if (this.peer) {
        try { this.peer.destroy(); } catch {}
      }

      this.peer = new Peer({
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', () => {
        // Connect to laptop host over the internet
        const laptopPeerId = this.getHostPeerId(code);
        const conn = this.peer.connect(laptopPeerId, { reliable: true });

        conn.on('open', () => {
          this.peerConnection = conn;
          this.notifyStatus('connected', 'webrtc');
          conn.send({ type: 'PHONE_CONNECTED', timestamp: Date.now() });
        });

        conn.on('data', (data) => {
          this.notifyMessage(data);
          this.notifyStatus('connected', 'webrtc');
        });

        conn.on('close', () => {
          this.notifyStatus('connected', 'simulated');
        });
      });

      this.peer.on('error', () => {
        // Graceful fallback to broadcast/simulated
        if (this.connectionStatus !== 'connected') {
          this.notifyStatus('connected', 'simulated');
        }
      });
    } catch {
      this.notifyStatus('connected', 'simulated');
    }
  }

  // =========================================================================
  // SEND STATE (Laptop -> Phone)
  // =========================================================================
  broadcastStateToPhone(payload) {
    const message = {
      type: 'STATE_UPDATE',
      payload,
      timestamp: Date.now()
    };

    // 1. Send via WebRTC if connected
    if (this.peerConnection && this.peerConnection.open) {
      try {
        this.peerConnection.send(message);
      } catch (err) {
        console.warn('WebRTC send failed, falling back to local relay:', err);
      }
    }

    // 2. Send via BroadcastChannel (for same browser / tabs)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch {}
    }

    // 3. Save to localStorage for cross-tab storage sync
    if (this.pairingCode) {
      try {
        localStorage.setItem(`aside_state_${this.pairingCode}`, JSON.stringify(message));
      } catch {}
    }
  }

  // =========================================================================
  // SEND ACTION (Phone -> Laptop)
  // =========================================================================
  sendActionToLaptop(actionName, data = {}) {
    const action = {
      type: 'PHONE_ACTION',
      action: actionName,
      data,
      timestamp: Date.now()
    };

    // 1. Send via WebRTC
    if (this.peerConnection && this.peerConnection.open) {
      try {
        this.peerConnection.send(action);
      } catch {}
    }

    // 2. Send via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(action);
      } catch {}
    }

    // 3. Send via localStorage
    if (this.pairingCode) {
      try {
        localStorage.setItem(`aside_phone_action_${this.pairingCode}`, JSON.stringify(action));
      } catch {}
    }
  }

  // Force simulated connection status (for testing demo flows)
  setSimulatedStatus(isConnected) {
    this.isSimulatedConnected = isConnected;
    this.notifyStatus(isConnected ? 'connected' : 'disconnected', 'simulated');
  }

  destroy() {
    if (this.peer) {
      try { this.peer.destroy(); } catch {}
    }
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch {}
    }
  }
}

export const companionSync = new CompanionSyncEngine();
