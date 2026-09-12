export * from "./transferService";
export { FastAPITransferService } from "./fastApiTransferService";
export { MockTransferService } from "./mockTransferService";

import { FastAPITransferService } from "./fastApiTransferService";
import { MockTransferService } from "./mockTransferService";
import type { ITransferService } from "./transferService";

const mode = (
  import.meta.env?.["VITE_TRANSFER_MODE"] as string | undefined
)?.toLowerCase();

/**
 * Active Transfer Service
 * Defaults to FastAPITransferService (real HTTP REST transfer).
 * Set VITE_TRANSFER_MODE=mock to fallback to in-memory mock service for offline testing.
 */
export const transferService: ITransferService =
  mode === "mock" ? new MockTransferService() : new FastAPITransferService();
