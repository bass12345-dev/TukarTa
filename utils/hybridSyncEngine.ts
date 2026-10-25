/**
 * hybridSyncEngine.ts
 * 
 * True Offline Hotspot & Cloud Hybrid Synchronization Engine for TukarTa.
 * 
 * Handles:
 * 1. Cloud WebSockets (Supabase Realtime) when internet is available.
 * 2. Local Hotspot P2P (WebRTC DataChannel / Local IP) when offline with 0 internet.
 * 3. Automatic failover and seamless auto-switch when internet drops on stage.
 */

export type SyncTransportType = 'cloud' | 'hotspot_p2p' | 'local_ip' | 'local_broadcast';

export interface HybridSyncMessage {
  event: 'SONG_SELECTED' | 'PLAYBACK_CHANGE' | 'CUE_COUNT_IN' | 'REQUEST_CURRENT_SONG' | 'PEER_JOIN' | 'PEER_PING';
  payload?: any;
  sentAt: number;
  senderId?: string;
}

export interface HotspotPreset {
  id: string;
  label: string;
  gatewayIp: string;
  description: string;
}

export const HOTSPOT_PRESETS: HotspotPreset[] = [
  {
    id: 'android',
    label: 'Android Hotspot',
    gatewayIp: '192.168.43.1',
    description: 'Standard Android Mobile Hotspot default IP',
  },
  {
    id: 'ios',
    label: 'iPhone / iPad Hotspot',
    gatewayIp: '172.20.10.1',
    description: 'Standard Apple iOS Personal Hotspot default IP',
  },
  {
    id: 'router_1',
    label: 'Venue Wi-Fi (192.168.1.x)',
    gatewayIp: '192.168.1.1',
    description: 'Standard venue router subnet',
  },
  {
    id: 'router_0',
    label: 'Venue Wi-Fi (192.168.0.x)',
    gatewayIp: '192.168.0.1',
    description: 'Alternative venue router subnet',
  },
];

/**
 * Checks if the browser or web environment has WebRTC RTCPeerConnection available
 */
export function isWebRTCAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).RTCPeerConnection ||
    (window as any).webkitRTCPeerConnection ||
    (window as any).mozRTCPeerConnection
  );
}

/**
 * Checks whether device currently has access to the public internet
 * (Tests navigator.onLine and pings with short timeout)
 */
export async function testInternetReachable(timeoutMs = 2500): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  // Quick DNS / HTTP check to a reliable, lightweight ping endpoint
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    
    // Check Supabase or 1.1.1.1
    const res = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller?.signal,
    });
    
    if (timer) clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

/**
 * Local WebRTC Peer-to-Peer DataChannel Coordinator (Works with 0 Internet on Hotspots)
 */
export class LocalP2PManager {
  private pc: any = null;
  private dataChannels: Map<string, any> = new Map();
  private onMessageCallback: ((msg: HybridSyncMessage) => void) | null = null;
  private onConnectionChangeCallback: ((connected: boolean, peerCount: number) => void) | null = null;
  private isLeader = false;

  constructor(
    isLeader: boolean,
    onMessage: (msg: HybridSyncMessage) => void,
    onConnectionChange: (connected: boolean, peerCount: number) => void
  ) {
    this.isLeader = isLeader;
    this.onMessageCallback = onMessage;
    this.onConnectionChangeCallback = onConnectionChange;
  }

  /**
   * Initializes host (Leader) WebRTC connection
   */
  async createHostOffer(sessionCode: string): Promise<string | null> {
    if (!isWebRTCAvailable()) return null;

    try {
      const PeerConnection =
        (window as any).RTCPeerConnection || (window as any).webkitRTCPeerConnection;

      // Crucial: empty iceServers ensures ICE only gathers LOCAL host candidates
      // on the hotspot / Wi-Fi subnet with ZERO dependency on external STUN/TURN servers!
      this.pc = new PeerConnection({
        iceServers: [],
      });

      // Leader creates the data channel
      const dc = this.pc.createDataChannel(`tukarta_${sessionCode}`, {
        ordered: true,
      });

      this.setupDataChannel(dc, 'follower_default');

      // Gather ICE candidates locally
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Wait briefly for local host candidates to be populated into SDP
      await new Promise<void>((resolve) => {
        if (this.pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          const checkState = () => {
            if (this.pc.iceGatheringState === 'complete') {
              this.pc.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          this.pc.addEventListener('icegatheringstatechange', checkState);
          // 800ms fallback timeout
          setTimeout(resolve, 800);
        }
      });

      // Compress into a compact pairing token
      const tokenPayload = {
        code: sessionCode,
        sdp: this.pc.localDescription?.sdp,
        type: 'offer',
      };

      return btoa(unescape(encodeURIComponent(JSON.stringify(tokenPayload))));
    } catch (e) {
      console.warn('Local P2P host offer creation error:', e);
      return null;
    }
  }

  /**
   * Leader receives Answer token from follower
   */
  async acceptFollowerAnswer(answerToken: string): Promise<boolean> {
    if (!this.pc) return false;
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(answerToken))));
      if (decoded.type === 'answer' && decoded.sdp) {
        await this.pc.setRemoteDescription(new (window as any).RTCSessionDescription({
          type: 'answer',
          sdp: decoded.sdp,
        }));
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Failed to accept follower answer:', e);
      return false;
    }
  }

  /**
   * Follower joins by accepting Leader's offer token and producing an answer token
   */
  async joinHostWithOffer(offerToken: string): Promise<string | null> {
    if (!isWebRTCAvailable()) return null;

    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(offerToken))));
      if (!decoded.sdp) return null;

      const PeerConnection =
        (window as any).RTCPeerConnection || (window as any).webkitRTCPeerConnection;

      this.pc = new PeerConnection({
        iceServers: [],
      });

      // Follower listens for incoming DataChannel created by host
      this.pc.ondatachannel = (event: any) => {
        this.setupDataChannel(event.channel, 'leader');
      };

      await this.pc.setRemoteDescription(new (window as any).RTCSessionDescription({
        type: 'offer',
        sdp: decoded.sdp,
      }));

      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      // Wait for local ICE
      await new Promise<void>((resolve) => {
        if (this.pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          const checkState = () => {
            if (this.pc.iceGatheringState === 'complete') {
              this.pc.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          this.pc.addEventListener('icegatheringstatechange', checkState);
          setTimeout(resolve, 800);
        }
      });

      const answerPayload = {
        type: 'answer',
        code: decoded.code,
        sdp: this.pc.localDescription?.sdp,
      };

      return btoa(unescape(encodeURIComponent(JSON.stringify(answerPayload))));
    } catch (e) {
      console.warn('Failed to join host with offer token:', e);
      return null;
    }
  }

  /**
   * Configure a data channel with handlers
   */
  private setupDataChannel(dc: any, peerId: string) {
    dc.onopen = () => {
      this.dataChannels.set(peerId, dc);
      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback(true, this.dataChannels.size);
      }

      // If follower, request currently playing song immediately
      if (!this.isLeader) {
        this.send({
          event: 'REQUEST_CURRENT_SONG',
          sentAt: Date.now(),
        });
      }
    };

    dc.onclose = () => {
      this.dataChannels.delete(peerId);
      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback(this.dataChannels.size > 0, this.dataChannels.size);
      }
    };

    dc.onerror = (err: any) => {
      console.warn('DataChannel error:', err);
    };

    dc.onmessage = (event: any) => {
      try {
        const parsed: HybridSyncMessage = JSON.parse(event.data);
        if (this.onMessageCallback) {
          this.onMessageCallback(parsed);
        }
      } catch (e) {
        console.warn('Failed to parse incoming DataChannel message:', e);
      }
    };
  }

  /**
   * Send a message to all connected local peers
   */
  send(message: HybridSyncMessage): boolean {
    let sentCount = 0;
    const serialized = JSON.stringify(message);

    this.dataChannels.forEach((dc) => {
      if (dc.readyState === 'open') {
        try {
          dc.send(serialized);
          sentCount++;
        } catch (e) {
          console.warn('DataChannel send error:', e);
        }
      }
    });

    return sentCount > 0;
  }

  getConnectedPeerCount(): number {
    let count = 0;
    this.dataChannels.forEach((dc) => {
      if (dc.readyState === 'open') count++;
    });
    return count;
  }

  close() {
    this.dataChannels.forEach((dc) => {
      try {
        dc.close();
      } catch {}
    });
    this.dataChannels.clear();

    if (this.pc) {
      try {
        this.pc.close();
      } catch {}
      this.pc = null;
    }
  }
}
