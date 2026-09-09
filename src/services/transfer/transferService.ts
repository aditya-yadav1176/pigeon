/**
 * Transfer Service Interface & Types
 *
 * Defines the clean boundary between the UI and file transfer mechanisms.
 * In Phase 4, this is backed by MockTransferService (in-memory demo state).
 * In Phase 5, this will be backed by FastAPITransferService with zero UI changes.
 */

export interface TransferPayload {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File | undefined;
  text?: string | undefined;
  blobUrl?: string | undefined;
}

export interface TransferRoom {
  code: string;
  url: string;
  payloads: TransferPayload[];
  totalSize: number;
  createdAt: number;
  expiresAt: number;
}

export type UploadProgressCallback = (progress: number) => void;

export interface ITransferService {
  /**
   * Upload files to create a temporary room.
   * Preserves real browser File objects in memory for downloading.
   */
  uploadFiles(files: File[], onProgress?: UploadProgressCallback): Promise<TransferRoom>;

  /**
   * Upload pasted text or links as a text payload.
   */
  uploadText(text: string, onProgress?: UploadProgressCallback): Promise<TransferRoom>;

  /**
   * Look up an active room by its code.
   */
  getRoom(code: string): Promise<TransferRoom | null>;

  /**
   * Join an existing room to receive files.
   */
  joinRoom(code: string): Promise<TransferRoom>;

  /**
   * Trigger a browser download for a specific payload using its in-memory File/Blob.
   */
  downloadPayload(payload: TransferPayload): void;

  /**
   * Trigger downloads for all payloads in a room.
   */
  downloadAll(payloads: TransferPayload[]): void;

  /**
   * Generate an unambiguous, memorable room code.
   */
  generateCode(): string;
}
