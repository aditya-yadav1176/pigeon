/**
 * MockTransferService (Phase 4 Prototype)
 *
 * MOCK / TEMPORARY IMPLEMENTATION
 * This service simulates upload and transfer flows purely within the browser's
 * local runtime while preserving REAL File objects in memory for authentic downloads.
 *
 * In Phase 5, this will be replaced with FastAPITransferService.
 */

import type {
  ITransferService,
  TransferPayload,
  TransferRoom,
  UploadProgressCallback,
} from "./transferService";

// Unambiguous alphabet avoiding O/0, I/1, S/5
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRTUVWXYZ2346789";

function normalizeCode(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export class MockTransferService implements ITransferService {
  /**
   * In-memory storage for active rooms during the browser session.
   * Maps normalized code (e.g. "K7M4PQ") to TransferRoom.
   */
  private rooms = new Map<string, TransferRoom>();

  constructor() {
    // Seed an initial demo room so users can test Receive mode immediately
    const demoPayloads: TransferPayload[] = [
      {
        id: "demo-pdf-1",
        name: "DBMS_Unit_3_Notes.pdf",
        size: 4_200_000,
        type: "application/pdf",
        text: undefined,
        blobUrl: undefined,
      },
      {
        id: "demo-ppt-2",
        name: "System_Design_Presentation.pptx",
        size: 24_800_000,
        type: "application/vnd.ms-powerpoint",
        text: undefined,
        blobUrl: undefined,
      },
    ];

    this.rooms.set("K7M4PQ", {
      code: "K7M4-PQ",
      url: "pigeon.app/r/K7M4-PQ",
      payloads: demoPayloads,
      totalSize: 29_000_000,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
  }

  generateCode(): string {
    let part1 = "";
    let part2 = "";
    for (let i = 0; i < 4; i++) {
      part1 += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
    }
    for (let i = 0; i < 2; i++) {
      part2 += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
    }
    return `${part1}-${part2}`;
  }

  async uploadFiles(files: File[], onProgress?: UploadProgressCallback): Promise<TransferRoom> {
    const code = this.generateCode();
    const normalized = normalizeCode(code);

    // Simulate mock upload progress over ~1.4s
    await this.simulateProgress(onProgress);

    const payloads: TransferPayload[] = files.map((file, index) => ({
      id: `payload-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      file, // Retain REAL browser File object in memory!
      blobUrl: undefined,
    }));

    const totalSize = payloads.reduce((sum, p) => sum + p.size, 0);

    const room: TransferRoom = {
      code,
      url: `pigeon.app/r/${code}`,
      payloads,
      totalSize,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10-minute TTL
    };

    this.rooms.set(normalized, room);
    return room;
  }

  async uploadText(text: string, onProgress?: UploadProgressCallback): Promise<TransferRoom> {
    const code = this.generateCode();
    const normalized = normalizeCode(code);

    await this.simulateProgress(onProgress);

    const trimmed = text.trim();
    const isUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://");
    const name = isUrl ? "Shared Link.txt" : "Shared Note.txt";
    const blob = new Blob([trimmed], { type: "text/plain;charset=utf-8" });
    const file = new File([blob], name, { type: "text/plain" });

    const payload: TransferPayload = {
      id: `text-${Date.now()}`,
      name,
      size: blob.size,
      type: "text/plain",
      text: trimmed,
      file,
    };

    const room: TransferRoom = {
      code,
      url: `pigeon.app/r/${code}`,
      payloads: [payload],
      totalSize: blob.size,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    this.rooms.set(normalized, room);
    return room;
  }

  async getRoom(code: string): Promise<TransferRoom | null> {
    const normalized = normalizeCode(code);
    return this.rooms.get(normalized) ?? null;
  }

  async joinRoom(code: string): Promise<TransferRoom> {
    const room = await this.getRoom(code);
    if (!room) {
      throw new Error(`Room with code "${code}" was not found or has expired.`);
    }
    return room;
  }

  downloadPayload(payload: TransferPayload): void {
    if (typeof window === "undefined") return;

    let url: string;
    let shouldRevoke = false;

    if (payload.file) {
      url = URL.createObjectURL(payload.file);
      shouldRevoke = true;
    } else if (payload.text) {
      const blob = new Blob([payload.text], { type: "text/plain;charset=utf-8" });
      url = URL.createObjectURL(blob);
      shouldRevoke = true;
    } else {
      // Fallback for demo payloads without local File
      const blob = new Blob([`PIGEON Demo File: ${payload.name}\nSize: ${payload.size} bytes`], {
        type: "text/plain",
      });
      url = URL.createObjectURL(blob);
      shouldRevoke = true;
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = payload.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (shouldRevoke) {
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
  }

  downloadAll(payloads: TransferPayload[]): void {
    payloads.forEach((payload, index) => {
      window.setTimeout(() => {
        this.downloadPayload(payload);
      }, index * 250);
    });
  }

  private simulateProgress(onProgress?: UploadProgressCallback): Promise<void> {
    if (!onProgress) return Promise.resolve();

    return new Promise((resolve) => {
      let current = 0;
      onProgress(0);

      const interval = window.setInterval(() => {
        current += Math.floor(Math.random() * 15) + 10;
        if (current >= 100) {
          current = 100;
          onProgress(100);
          window.clearInterval(interval);
          window.setTimeout(resolve, 200);
        } else {
          onProgress(current);
        }
      }, 100);
    });
  }
}

/** Singleton instance used across the frontend prototype */
export const transferService = new MockTransferService();
