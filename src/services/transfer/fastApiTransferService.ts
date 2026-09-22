/**
 * FastAPITransferService (Phase 5 Real File Transfer)
 *
 * Implements ITransferService using real HTTP REST communication with the FastAPI backend.
 * Handles true progress tracking via XMLHttpRequest upload events, chunked server storage,
 * and direct browser attachment downloads.
 */

import type {
  ITransferService,
  RoomStatusInfo,
  TransferPayload,
  TransferRoom,
  UploadProgressCallback,
} from "./transferService";

// Unambiguous alphabet avoiding 0, 1, I, O
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function normalizeCode(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

interface ApiFileMetadata {
  id: string;
  name: string;
  size: number;
  content_type: string;
}

interface ApiRoomResponse {
  code: string;
  status: string;
  expires_at: number;
  created_at: number;
  total_size: number;
  files: ApiFileMetadata[];
}

interface ApiStatusResponse {
  code: string;
  status: string;
  receiver_connected: boolean;
  expires_at: number;
}

export class FastAPITransferService implements ITransferService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl?: string) {
    const envUrl = (
      import.meta.env?.["VITE_API_BASE_URL"] as string | undefined
    )?.trim();
    if (apiBaseUrl) {
      this.apiBaseUrl = apiBaseUrl.replace(/\/+$/, "");
    } else if (envUrl) {
      this.apiBaseUrl = envUrl.replace(/\/+$/, "");
    } else if (typeof window !== "undefined" && window.location?.hostname) {
      const hostname = window.location.hostname;
      // Only fallback to :8000 on local or private LAN networks
      const isLocalOrLan =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        /^192\.168\.\d+\.\d+$/.test(hostname) ||
        /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(hostname);

      if (isLocalOrLan) {
        this.apiBaseUrl = `http://${hostname}:8000`;
      } else {
        console.error(
          "[PIGEON] VITE_API_BASE_URL environment variable is not configured on this public deployment. " +
            "Please set VITE_API_BASE_URL to your deployed FastAPI backend URL (e.g., https://your-backend.onrender.com).",
        );
        // Fallback to relative or current origin rather than breaking with mixed-content localhost
        this.apiBaseUrl = "";
      }
    } else {
      this.apiBaseUrl = "http://localhost:8000";
    }
  }

  generateCode(): string {
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += CODE_ALPHABET.charAt(
        Math.floor(Math.random() * CODE_ALPHABET.length),
      );
    }
    return code;
  }

  async uploadFiles(
    files: File[],
    onProgress?: UploadProgressCallback,
    ttlSeconds?: number,
  ): Promise<TransferRoom> {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    if (ttlSeconds !== undefined) {
      formData.append("ttl_seconds", ttlSeconds.toString());
    }

    return this.uploadFormData(formData, onProgress);
  }

  async uploadText(
    text: string,
    onProgress?: UploadProgressCallback,
    ttlSeconds?: number,
  ): Promise<TransferRoom> {
    const formData = new FormData();
    formData.append("text", text);
    if (ttlSeconds !== undefined) {
      formData.append("ttl_seconds", ttlSeconds.toString());
    }

    return this.uploadFormData(formData, onProgress);
  }

  private uploadFormData(
    formData: FormData,
    onProgress?: UploadProgressCallback,
  ): Promise<TransferRoom> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${this.apiBaseUrl}/api/rooms`);

      if (onProgress) {
        onProgress(0);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.min(
              Math.round((event.loaded / event.total) * 100),
              99,
            );
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            if (onProgress) onProgress(100);
            const data: ApiRoomResponse = JSON.parse(xhr.responseText);
            resolve(this.mapApiRoomToTransferRoom(data));
          } catch {
            reject(new Error("Failed to parse server room response."));
          }
        } else if (xhr.status === 413) {
          reject(new Error("File exceeds maximum allowed size of 250 MB."));
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(
              new Error(
                errData.detail || `Upload failed with status ${xhr.status}`,
              ),
            );
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(
          new Error(
            `Could not connect to Pigeon backend at ${this.apiBaseUrl}. Ensure the server is running.`,
          ),
        );
      };

      xhr.send(formData);
    });
  }

  async getRoom(code: string): Promise<TransferRoom | null> {
    const normalized = normalizeCode(code);
    try {
      const res = await fetch(
        `${this.apiBaseUrl}/api/rooms/${encodeURIComponent(normalized)}`,
      );
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch room (${res.status})`);
      }
      const data: ApiRoomResponse = await res.json();
      return this.mapApiRoomToTransferRoom(data);
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error(
          `Could not reach Pigeon server at ${this.apiBaseUrl}. Check your connection.`,
        );
      }
      throw err;
    }
  }

  async joinRoom(code: string): Promise<TransferRoom> {
    const normalized = normalizeCode(code);
    try {
      const res = await fetch(
        `${this.apiBaseUrl}/api/rooms/${encodeURIComponent(normalized)}/connect`,
        { method: "POST" },
      );

      if (res.status === 404) {
        throw new Error(`That Pigeon code doesn't exist or has expired.`);
      }
      if (res.status === 410) {
        throw new Error(`This Pigeon has expired.`);
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.detail || `Could not connect to room (${res.status})`,
        );
      }

      const data: ApiRoomResponse = await res.json();
      return this.mapApiRoomToTransferRoom(data);
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error(
          `Could not reach Pigeon server at ${this.apiBaseUrl}. Check your connection.`,
        );
      }
      throw err;
    }
  }

  async pollRoomStatus(code: string): Promise<RoomStatusInfo | null> {
    const normalized = normalizeCode(code);
    try {
      const res = await fetch(
        `${this.apiBaseUrl}/api/rooms/${encodeURIComponent(normalized)}/status`,
      );
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        return null;
      }
      const data: ApiStatusResponse = await res.json();
      return {
        code: data.code,
        status: data.status,
        receiverConnected: data.receiver_connected,
        expiresAt: data.expires_at,
      };
    } catch {
      return null;
    }
  }

  async completeRoom(code: string): Promise<void> {
    const normalized = normalizeCode(code);
    try {
      await fetch(
        `${this.apiBaseUrl}/api/rooms/${encodeURIComponent(normalized)}/complete`,
        {
          method: "POST",
        },
      );
    } catch {
      // Best-effort completion notification
    }
  }

  downloadPayload(payload: TransferPayload): void {
    if (typeof window === "undefined") return;

    if (payload.downloadUrl) {
      const a = document.createElement("a");
      a.href = payload.downloadUrl;
      a.download = payload.name;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    if (payload.file) {
      const url = URL.createObjectURL(payload.file);
      const a = document.createElement("a");
      a.href = url;
      a.download = payload.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      return;
    }
  }

  downloadAll(payloads: TransferPayload[]): void {
    payloads.forEach((payload, index) => {
      window.setTimeout(() => {
        this.downloadPayload(payload);
      }, index * 300);
    });
  }

  private mapApiRoomToTransferRoom(data: ApiRoomResponse): TransferRoom {
    const payloads: TransferPayload[] = data.files.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.content_type,
      roomCode: data.code,
      downloadUrl: `${this.apiBaseUrl}/api/rooms/${encodeURIComponent(data.code)}/files/${encodeURIComponent(f.id)}`,
    }));

    return {
      code: data.code,
      url: `usepigeon.vercel.app/r/${data.code}`,
      payloads,
      totalSize: data.total_size,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      status: data.status,
      receiverConnected: data.status === "connected",
    };
  }
}
