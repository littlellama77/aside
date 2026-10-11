/**
 * Aside Companion Synchronization Engine
 * 
 * Supports:
 * 1. MQTT over Secure WebSocket (EMQX / HiveMQ Public Cloud Relay):
 *    - Real-time internet sync across networks (e.g. laptop on Wi-Fi and phone on 5G cellular).
 *    - Zero configuration, bypasses corporate firewalls and cellular CGNAT.
 *    - Retained messages ensure the phone instantly receives the current answer on connect/reload!
 * 2. BroadcastChannel + Storage Events:
 *    - Instantaneous zero-latency sync for same device, multi-window, popup, or browser tabs.
 * 3. Graceful fallback & automatic reconnection.
 */

import mqtt from 'mqtt';

class CompanionSyncEngine {
  constructor() {
    this.role = null; // 'laptop' | 'phone'
    this.pairingCode = null;
    this.mqttClient = null;
    this.broadcastChannel = null;
    this.connectionStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'connected'
    this.connectionType = 'none'; // 'cloud' | 'broadcast' | 'simulated'
    this.statusListeners = new Set();
    this.messageListeners = new Set();
    this.lastStatePayload = null;
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

  getCleanCode(code) {
    return (code || 'ASIDE-8492').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // =========================================================================
  // LAPTOP INITIALIZATION ("Ears + Brain")
  // =========================================================================
  initLaptop(code = 'ASIDE-8492') {
    this.role = 'laptop';
    this.pairingCode = code;
    this.notifyStatus('connecting', 'initiating');

    const cleanCode = this.getCleanCode(code);

    // 1. Setup local BroadcastChannel
    try {
      if (this.broadcastChannel) {
        try { this.broadcastChannel.close(); } catch {}
      }
      this.broadcastChannel = new BroadcastChannel(`aside_sync_${cleanCode}`);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'PHONE_ACTION') {
          this.notifyMessage(event.data);
          this.notifyStatus('connected', 'broadcast');
        } else if (event.data?.type === 'PHONE_HELLO') {
          this.notifyStatus('connected', 'broadcast');
        }
      };
    } catch {
      // Fallback handled by localStorage
    }

    // 2. Setup LocalStorage event listener
    const storageHandler = (e) => {
      if (e.key === `aside_phone_action_${cleanCode}` && e.newValue) {
        try {
          const action = JSON.parse(e.newValue);
          this.notifyMessage(action);
          this.notifyStatus('connected', 'broadcast');
        } catch {}
      }
    };
    window.addEventListener('storage', storageHandler);

    // 3. Setup MQTT Cloud Relay over WSS
    this.initMqttLaptop(cleanCode);
  }

  initMqttLaptop(cleanCode) {
    try {
      if (this.mqttClient) {
        try { this.mqttClient.end(true); } catch {}
      }

      const clientId = `aside_lap_${cleanCode}_${Math.random().toString(36).slice(2, 8)}`;
      const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';

      this.mqttClient = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 2000,
        keepalive: 30
      });

      this.mqttClient.on('connect', () => {
        this.notifyStatus('connected', 'cloud');
        // Laptop subscribes to actions sent from phone
        this.mqttClient.subscribe(`aside/rooms/${cleanCode}/phone`, { qos: 1 });

        // If laptop already has active state, publish immediately with retain: true
        if (this.lastStatePayload) {
          const message = {
            type: 'STATE_UPDATE',
            payload: this.lastStatePayload,
            timestamp: Date.now()
          };
          this.mqttClient.publish(
            `aside/rooms/${cleanCode}/laptop`,
            JSON.stringify(message),
            { qos: 1, retain: true }
          );
        }
      });

      this.mqttClient.on('message', (topic, message) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed && parsed.type === 'PHONE_ACTION') {
            this.notifyMessage(parsed);
            this.notifyStatus('connected', 'cloud');
          }
        } catch (err) {
          console.warn('Failed to parse phone action from MQTT:', err);
        }
      });

      this.mqttClient.on('error', (err) => {
        console.warn('MQTT laptop client error:', err.message);
      });

      this.mqttClient.on('close', () => {
        if (this.connectionType === 'cloud') {
          this.notifyStatus('connecting', 'cloud');
        }
      });
    } catch (err) {
      console.warn('Failed to initialize MQTT laptop:', err);
    }
  }

  // =========================================================================
  // PHONE INITIALIZATION ("Private Display & Remote Mic")
  // =========================================================================
  initPhone(code = 'ASIDE-8492') {
    this.role = 'phone';
    this.pairingCode = code;
    this.notifyStatus('connecting', 'initiating');

    const cleanCode = this.getCleanCode(code);

    // 1. Setup local BroadcastChannel
    try {
      if (this.broadcastChannel) {
        try { this.broadcastChannel.close(); } catch {}
      }
      this.broadcastChannel = new BroadcastChannel(`aside_sync_${cleanCode}`);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'STATE_UPDATE' && event.data.payload) {
          this.notifyMessage(event.data);
          this.notifyStatus('connected', 'broadcast');
        }
      };

      // Announce presence
      this.broadcastChannel.postMessage({ type: 'PHONE_HELLO', code: cleanCode, timestamp: Date.now() });
    } catch {}

    // 2. Setup LocalStorage event listener
    const storageHandler = (e) => {
      if (e.key === `aside_state_${cleanCode}` && e.newValue) {
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
      const cached = localStorage.getItem(`aside_state_${cleanCode}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.notifyMessage(parsed);
      }
    } catch {}

    // 3. Setup MQTT Cloud Relay over WSS
    this.initMqttPhone(cleanCode);
  }

  initMqttPhone(cleanCode) {
    try {
      if (this.mqttClient) {
        try { this.mqttClient.end(true); } catch {}
      }

      const clientId = `aside_ph_${cleanCode}_${Math.random().toString(36).slice(2, 8)}`;
      const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';

      this.mqttClient = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 2000,
        keepalive: 30
      });

      this.mqttClient.on('connect', () => {
        this.notifyStatus('connected', 'cloud');
        // Phone subscribes to laptop state updates (receives retained state immediately!)
        this.mqttClient.subscribe(`aside/rooms/${cleanCode}/laptop`, { qos: 1 });

        // Announce phone presence
        const hello = {
          type: 'PHONE_ACTION',
          action: 'PHONE_CONNECTED',
          timestamp: Date.now()
        };
        this.mqttClient.publish(
          `aside/rooms/${cleanCode}/phone`,
          JSON.stringify(hello),
          { qos: 1 }
        );
      });

      this.mqttClient.on('message', (topic, message) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed && parsed.type === 'STATE_UPDATE' && parsed.payload) {
            this.notifyMessage(parsed);
            this.notifyStatus('connected', 'cloud');
          }
        } catch (err) {
          console.warn('Failed to parse state from MQTT:', err);
        }
      });

      this.mqttClient.on('error', (err) => {
        console.warn('MQTT phone client error:', err.message);
      });

      this.mqttClient.on('close', () => {
        if (this.connectionType === 'cloud') {
          this.notifyStatus('connecting', 'cloud');
        }
      });
    } catch (err) {
      console.warn('Failed to initialize MQTT phone:', err);
    }
  }

  // =========================================================================
  // SEND STATE (Laptop -> Phone)
  // =========================================================================
  broadcastStateToPhone(payload) {
    this.lastStatePayload = payload;
    const cleanCode = this.getCleanCode(this.pairingCode);

    const message = {
      type: 'STATE_UPDATE',
      payload,
      timestamp: Date.now()
    };

    // 1. Send via MQTT Cloud Relay (retained so phone gets latest state immediately)
    if (this.mqttClient && this.mqttClient.connected) {
      try {
        this.mqttClient.publish(
          `aside/rooms/${cleanCode}/laptop`,
          JSON.stringify(message),
          { qos: 1, retain: true }
        );
      } catch (err) {
        console.warn('MQTT publish state failed:', err);
      }
    }

    // 2. Send via BroadcastChannel (for same browser / tabs)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch {}
    }

    // 3. Save to localStorage for cross-tab storage sync
    try {
      localStorage.setItem(`aside_state_${cleanCode}`, JSON.stringify(message));
    } catch {}
  }

  // =========================================================================
  // SEND ACTION (Phone -> Laptop)
  // =========================================================================
  sendActionToLaptop(actionName, data = {}) {
    const cleanCode = this.getCleanCode(this.pairingCode);

    const action = {
      type: 'PHONE_ACTION',
      action: actionName,
      data,
      timestamp: Date.now()
    };

    // 1. Send via MQTT Cloud Relay
    if (this.mqttClient && this.mqttClient.connected) {
      try {
        this.mqttClient.publish(
          `aside/rooms/${cleanCode}/phone`,
          JSON.stringify(action),
          { qos: 1 }
        );
      } catch (err) {
        console.warn('MQTT send action failed:', err);
      }
    }

    // 2. Send via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(action);
      } catch {}
    }

    // 3. Send via localStorage
    try {
      localStorage.setItem(`aside_phone_action_${cleanCode}`, JSON.stringify(action));
    } catch {}
  }

  // Force simulated connection status (for testing demo flows)
  setSimulatedStatus(isConnected) {
    this.isSimulatedConnected = isConnected;
    this.notifyStatus(isConnected ? 'connected' : 'disconnected', 'simulated');
  }

  destroy() {
    if (this.mqttClient) {
      try { this.mqttClient.end(true); } catch {}
    }
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch {}
    }
  }
}

export const companionSync = new CompanionSyncEngine();
