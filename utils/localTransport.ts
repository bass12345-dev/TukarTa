import { Platform } from 'react-native';
import TcpSocket from 'react-native-tcp-socket';
import type { HybridSyncMessage } from './hybridSyncEngine';

/**
 * Local band sync over the phone's hotspot, with no internet.
 *
 * The leader's phone runs the hotspot, so it is the gateway. It listens on a TCP port and
 * members connect to the gateway address. Messages are JSON lines.
 *
 * This replaces the WebRTC path, which needs a browser: React Native has no RTCPeerConnection.
 */

export const HOTSPOT_PORT = 47654;
const CONNECT_TIMEOUT_MS = 6000;
const TOKEN_PATTERN = /^tk:\/\/([^:/]+):(\d+)\/([^/]+)$/;

/** Default gateway address of the hotspot on each platform. */
export function hotspotGatewayIp(): string {
  return Platform.OS === 'ios' ? '172.20.10.1' : '192.168.43.1';
}

/** Tokens look like tk://<gateway ip>:<port>/<session code>. */
export function isHotspotToken(value: string): boolean {
  return TOKEN_PATTERN.test(value.trim());
}

function parseToken(token: string): { host: string; port: number } | null {
  const match = token.trim().match(TOKEN_PATTERN);
  if (!match) return null;
  return { host: match[1], port: Number(match[2]) };
}

export class LocalP2PManager {
  private server: any = null;
  private connections = new Map<string, any>();
  private onMessageCallback: ((msg: HybridSyncMessage) => void) | null;
  private onConnectionChangeCallback: ((connected: boolean, peerCount: number) => void) | null;
  private isLeader: boolean;

  constructor(
    isLeader: boolean,
    onMessage: (msg: HybridSyncMessage) => void,
    onConnectionChange: (connected: boolean, peerCount: number) => void
  ) {
    this.isLeader = isLeader;
    this.onMessageCallback = onMessage;
    this.onConnectionChangeCallback = onConnectionChange;
  }

  /** Leader: start listening on the hotspot. Returns the token members scan or type. */
  async createHostOffer(sessionCode: string): Promise<string | null> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.server = TcpSocket.createServer((socket: any) => this.attachConnection(socket));
        this.server.once('error', reject);
        this.server.listen({ port: HOTSPOT_PORT, host: '0.0.0.0' }, () => resolve());
      });
      return `tk://${hotspotGatewayIp()}:${HOTSPOT_PORT}/${encodeURIComponent(sessionCode)}`;
    } catch (e) {
      console.warn('Could not start the hotspot sync server:', e);
      return null;
    }
  }

  /** Member: connect to the leader's hotspot gateway. Resolves to the token on success, null otherwise. */
  async joinHostWithOffer(token: string): Promise<string | null> {
    const target = parseToken(token);
    if (!target) return null;

    return new Promise<string | null>((resolve) => {
      let settled = false;
      const finish = (result: string | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      };

      const socket = TcpSocket.createConnection({ host: target.host, port: target.port }, () => {
        this.attachConnection(socket);
        finish(token);
      });
      socket.once('error', (err: any) => {
        console.warn('Hotspot connect failed:', err);
        finish(null);
      });

      const timer = setTimeout(() => {
        try {
          socket.destroy();
        } catch {}
        finish(null);
      }, CONNECT_TIMEOUT_MS);
    });
  }

  /** Track a socket and read its JSON lines. */
  private attachConnection(socket: any) {
    const id = `${socket.remoteAddress ?? 'peer'}:${socket.remotePort ?? Date.now()}`;
    this.connections.set(id, socket);
    this.notifyConnection();

    if (!this.isLeader) {
      // A member asks the leader for the current song as soon as it is connected.
      this.writeTo(socket, { event: 'REQUEST_CURRENT_SONG', sentAt: Date.now() });
    }

    let buffer = '';
    socket.on('data', (data: any) => {
      buffer += data.toString('utf8');
      let newline = buffer.indexOf('\n');
      while (newline >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        this.deliver(line);
        newline = buffer.indexOf('\n');
      }
    });
    socket.on('error', () => {});
    socket.on('close', () => {
      this.connections.delete(id);
      this.notifyConnection();
    });
  }

  private deliver(line: string) {
    if (!line.trim()) return;
    try {
      const parsed: HybridSyncMessage = JSON.parse(line);
      this.onMessageCallback?.(parsed);
    } catch (e) {
      console.warn('Failed to parse hotspot message:', e);
    }
  }

  private writeTo(socket: any, message: HybridSyncMessage): boolean {
    try {
      socket.write(JSON.stringify(message) + '\n');
      return true;
    } catch (e) {
      console.warn('Hotspot send error:', e);
      return false;
    }
  }

  private notifyConnection() {
    this.onConnectionChangeCallback?.(this.connections.size > 0, this.connections.size);
  }

  /** Send a message to every connected peer. */
  send(message: HybridSyncMessage): boolean {
    let sent = false;
    this.connections.forEach((socket) => {
      if (this.writeTo(socket, message)) sent = true;
    });
    return sent;
  }

  getConnectedPeerCount(): number {
    return this.connections.size;
  }

  close() {
    this.connections.forEach((socket) => {
      try {
        socket.destroy();
      } catch {}
    });
    this.connections.clear();
    try {
      this.server?.close();
    } catch {}
    this.server = null;
  }
}
