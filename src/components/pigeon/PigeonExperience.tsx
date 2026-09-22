import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Clipboard,
  Clock3,
  Copy,
  Download,
  File,
  FileImage,
  FileText,
  KeyRound,
  Laptop,
  LoaderCircle,
  MessageSquareText,
  Plus,
  RotateCcw,
  Share2,
  Smartphone,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  transferService,
  type TransferPayload,
  type TransferRoom,
} from "@/services/transfer";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Pigeon, PigeonMark } from "./Pigeon";
import type { PigeonState } from "./pigeon.types";

/**
 * Application UX States (Phase 4 State Machine)
 */
export type AppState =
  | "IDLE"
  | "FILE_SELECTED"
  | "UPLOADING"
  | "READY"
  | "WAITING_FOR_RECEIVER"
  | "CONNECTED"
  | "RECEIVER_CODE_ENTRY"
  | "CONNECTING"
  | "FILES_AVAILABLE"
  | "DOWNLOADING"
  | "SENDING"
  | "RECEIVING"
  | "SUCCESS"
  | "COMPLETED"
  | "ERROR"
  | "EXPIRED";

export type ActiveMode = "send" | "receive";

/**
 * Maps high-level application state to the Pigeon animation state engine.
 */
function getPigeonState(appState: AppState): PigeonState {
  switch (appState) {
    case "IDLE":
      return "idle";
    case "FILE_SELECTED":
      return "dragging";
    case "UPLOADING":
      return "uploading";
    case "READY":
      return "ready";
    case "WAITING_FOR_RECEIVER":
      return "waiting";
    case "CONNECTED":
      return "sending";
    case "RECEIVER_CODE_ENTRY":
      return "idle";
    case "CONNECTING":
      return "waiting";
    case "FILES_AVAILABLE":
      return "ready";
    case "DOWNLOADING":
      return "receiving";
    case "SENDING":
      return "sending";
    case "RECEIVING":
      return "receiving";
    case "SUCCESS":
    case "COMPLETED":
      return "success";
    case "ERROR":
      return "error";
    case "EXPIRED":
      return "expired";
  }
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function FileGlyph({ type }: { type: string }) {
  if (type.startsWith("image")) return <FileImage />;
  if (type === "text/plain") return <MessageSquareText />;
  return type.includes("pdf") || type.includes("presentation") ? (
    <FileText />
  ) : (
    <File />
  );
}

function IconButton({
  label,
  children,
  onClick,
  className,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string | undefined;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={label}
          onClick={onClick}
          className={cn("h-10 w-10 rounded-full", className)}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function PigeonExperience() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core Mode: "send" or "receive"
  const [mode, setMode] = useState<ActiveMode>("send");

  // Application State
  const [appState, setAppState] = useState<AppState>("IDLE");

  // Real File selection state (retains browser File objects in memory)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activePayloads, setActivePayloads] = useState<TransferPayload[]>([]);

  // Active room created in Send mode
  const [activeRoom, setActiveRoom] = useState<TransferRoom | null>(null);

  // Active room loaded in Receive mode
  const [receivedRoom, setReceivedRoom] = useState<TransferRoom | null>(null);

  // Receiver code input
  const [receiveCode, setReceiveCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  // Upload error state
  const [uploadError, setUploadError] = useState<{
    title: string;
    detail: string;
  } | null>(null);

  // Progress, countdown, dialogs, duration
  const [progress, setProgress] = useState(0);
  const [seconds, setSeconds] = useState(600);
  const [selectedDuration, setSelectedDuration] = useState<180 | 300 | 600>(
    600,
  );
  const [textOpen, setTextOpen] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [scrollTilt, setScrollTilt] = useState(0);

  // Subtle scroll-linked reactive moment for the hero Pigeon (restrained, 0-3 deg tilt)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          const factor = Math.min(y / 400, 1);
          setScrollTilt(factor * 3);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pigeonState = getPigeonState(appState);

  const totalSize = useMemo(
    () => activePayloads.reduce((sum, file) => sum + file.size, 0),
    [activePayloads],
  );

  // Room countdown timer: synchronized from authoritative backend expiresAt
  const targetExpiry = activeRoom?.expiresAt ?? receivedRoom?.expiresAt ?? null;

  useEffect(() => {
    if (!targetExpiry) return;
    const activeStates: AppState[] = [
      "READY",
      "WAITING_FOR_RECEIVER",
      "CONNECTED",
      "SENDING",
      "RECEIVING",
      "FILES_AVAILABLE",
      "DOWNLOADING",
      "COMPLETED",
    ];
    if (!activeStates.includes(appState)) return;

    const syncRemaining = () => {
      const remaining = Math.max(
        0,
        Math.floor((targetExpiry - Date.now()) / 1000),
      );
      setSeconds(remaining);
      if (remaining <= 0) {
        setAppState("EXPIRED");
      }
    };

    syncRemaining();
    const timer = window.setInterval(syncRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [targetExpiry, appState]);

  // Sender status polling: Detects when receiver connects or room expires
  useEffect(() => {
    if (appState !== "WAITING_FOR_RECEIVER" || !activeRoom?.code) return;

    const interval = window.setInterval(async () => {
      try {
        const status = await transferService.pollRoomStatus?.(activeRoom.code);
        if (!status) return;

        if (status.status === "expired") {
          setAppState("EXPIRED");
        } else if (status.receiverConnected || status.status === "connected") {
          // Receiver has connected! Animate handoff on sender screen
          setAppState("CONNECTED");
          window.setTimeout(() => {
            setAppState("SENDING");
            window.setTimeout(() => {
              setAppState("COMPLETED");
            }, 1800);
          }, 600);
        } else if (status.status === "completed") {
          setAppState("COMPLETED");
        }
      } catch {
        // Ignore transient polling network hiccups
      }
    }, 1500);

    return () => window.clearInterval(interval);
  }, [appState, activeRoom?.code]);

  // Mode switcher handler
  function switchMode(newMode: ActiveMode) {
    setMode(newMode);
    setCodeError(null);
    if (newMode === "receive") {
      // If we already completed a transfer or have files available, keep it; otherwise open code entry
      if (
        !["SUCCESS", "FILES_AVAILABLE", "DOWNLOADING", "COMPLETED"].includes(
          appState,
        )
      ) {
        setAppState("RECEIVER_CODE_ENTRY");
      }
      if (activeRoom) {
        setReceiveCode(activeRoom.code);
      }
    } else {
      if (
        activeRoom &&
        ["READY", "WAITING_FOR_RECEIVER", "CONNECTED", "COMPLETED"].includes(
          appState,
        )
      ) {
        // preserve active room state
      } else if (
        !["SUCCESS", "FILE_SELECTED", "COMPLETED"].includes(appState)
      ) {
        setAppState("IDLE");
      }
    }
  }

  // Handle incoming file drops / selections
  function handleFiles(list: FileList | File[]) {
    const rawIncoming = Array.from(list);
    const validIncoming = rawIncoming.filter((f) => f.size > 0);

    if (rawIncoming.length > 0 && validIncoming.length === 0) {
      setUploadError({
        title: "Empty file detected.",
        detail:
          "Pigeon cannot carry empty 0-byte files. Please choose a valid file.",
      });
      setAppState("ERROR");
      return;
    }

    const combinedFiles =
      appState === "FILE_SELECTED"
        ? [...selectedFiles, ...validIncoming]
        : validIncoming;
    const totalSize = combinedFiles.reduce((acc, file) => acc + file.size, 0);

    if (totalSize > 250 * 1024 * 1024) {
      setUploadError({
        title: "That one’s too heavy.",
        detail:
          "Pigeon carries up to 250 MB total per transfer. Please choose smaller files.",
      });
      setAppState("ERROR");
      return;
    }

    setUploadError(null);
    setSelectedFiles(combinedFiles);
    setActivePayloads(
      combinedFiles.map((file, index) => ({
        id: `payload-${file.name}-${file.size}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        file,
      })),
    );
    setAppState("FILE_SELECTED");
    setProgress(0);
    setMode("send");
  }

  // Handle text paste dialog submission
  async function handleSendText() {
    const trimmed = textValue.trim();
    if (!trimmed) return;

    setAppState("UPLOADING");
    setTextOpen(false);
    setProgress(0);
    setUploadError(null);

    try {
      const room = await transferService.uploadText(
        trimmed,
        (pct) => setProgress(pct),
        selectedDuration,
      );
      setActiveRoom(room);
      setActivePayloads(room.payloads);
      setAppState("WAITING_FOR_RECEIVER");
      const remainingSeconds = Math.max(
        1,
        Math.floor((room.expiresAt - Date.now()) / 1000),
      );
      setSeconds(remainingSeconds);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while uploading.";
      setUploadError({
        title: "Could not upload note.",
        detail: message,
      });
      setAppState("ERROR");
    }
  }

  // Trigger Send Across
  async function startUpload() {
    if (!selectedFiles.length) return;
    setAppState("UPLOADING");
    setProgress(0);
    setUploadError(null);

    try {
      const room = await transferService.uploadFiles(
        selectedFiles,
        (pct) => setProgress(pct),
        selectedDuration,
      );
      setActiveRoom(room);
      setActivePayloads(room.payloads);
      setAppState("WAITING_FOR_RECEIVER");
      const remainingSeconds = Math.max(
        1,
        Math.floor((room.expiresAt - Date.now()) / 1000),
      );
      setSeconds(remainingSeconds);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while uploading.";
      setUploadError({
        title: message.includes("250")
          ? "That one’s too heavy."
          : "Upload failed.",
        detail: message,
      });
      setAppState("ERROR");
    }
  }

  // Receiver: Submit code and execute signature handoff sequence
  async function handleReceiveSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setCodeError(null);

    const codeToLookup = receiveCode.trim().toUpperCase();
    if (!codeToLookup) {
      setCodeError("Please enter a Pigeon code.");
      return;
    }

    try {
      const room = await transferService.joinRoom(codeToLookup);
      setReceivedRoom(room);
      const remainingSeconds = Math.max(
        1,
        Math.floor((room.expiresAt - Date.now()) / 1000),
      );
      setSeconds(remainingSeconds);

      // STEP 1: CONNECTING (0.6s)
      setAppState("CONNECTING");

      window.setTimeout(() => {
        // STEP 2: SENDING (1.4s signature sequence)
        setAppState("SENDING");

        window.setTimeout(() => {
          // STEP 3: RECEIVING (1.0s landing sequence)
          setAppState("RECEIVING");

          window.setTimeout(() => {
            // STEP 4: FILES_AVAILABLE
            setAppState("FILES_AVAILABLE");
          }, 1000);
        }, 1400);
      }, 600);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : `No active Pigeon found with code "${codeToLookup}". Check the code on the sender screen.`;
      setCodeError(message);
    }
  }

  function resetAll() {
    setAppState("IDLE");
    setSelectedFiles([]);
    setActivePayloads([]);
    setActiveRoom(null);
    setReceivedRoom(null);
    setProgress(0);
    setSeconds(600);
    setSelectedDuration(600);
    setDownloadedIds([]);
    setTextValue("");
    setCopied(false);
    setCodeError(null);
    setMode("send");
  }

  async function copyCode(code: string) {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareCode(code: string) {
    if (navigator.share) {
      await navigator.share({
        title: "Your Pigeon is ready",
        text: `Open usepigeon.vercel.app and enter code: ${code}`,
      });
    } else {
      await copyCode(code);
    }
  }

  function triggerDownload(payload: TransferPayload) {
    transferService.downloadPayload(payload);
    setDownloadedIds((prev) => {
      const next = [...new Set([...prev, payload.id])];
      if (receivedRoom && next.length >= receivedRoom.payloads.length) {
        setAppState("COMPLETED");
        if (receivedRoom.code) {
          transferService.completeRoom?.(receivedRoom.code);
        }
      }
      return next;
    });
  }

  function triggerDownloadAll(payloads: TransferPayload[]) {
    setAppState("DOWNLOADING");
    transferService.downloadAll(payloads);
    setDownloadedIds(payloads.map((p) => p.id));
    window.setTimeout(() => {
      setAppState("COMPLETED");
      if (receivedRoom?.code) {
        transferService.completeRoom?.(receivedRoom.code);
      }
    }, 1200);
  }

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen overflow-x-clip bg-paper font-body text-ink">
        {/* Sticky Header with Send / Receive Mode Switcher */}
        <header className="animate-entrance-nav sticky top-0 z-40 border-b-2 border-ink bg-paper">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-3 py-2.5 sm:px-7 sm:py-3">
            <button
              type="button"
              onClick={resetAll}
              className="flex shrink-0 items-center gap-2 text-left"
              aria-label="Pigeon home"
            >
              <span className="grid h-9 w-10 shrink-0 -rotate-3 place-items-center rounded-sm bg-ink px-1 text-paper sm:h-10 sm:w-11 sm:px-1.5">
                <PigeonMark className="w-full" />
              </span>
              <span className="shrink-0 font-display text-base font-extrabold tracking-tight sm:text-lg">
                PIGEON
              </span>
            </button>

            {/* Centered Mode Switcher */}
            <div className="flex shrink-0 justify-center">
              <div className="inline-flex border-2 border-ink bg-paper p-0.5">
                <button
                  type="button"
                  onClick={() => switchMode("send")}
                  className={cn(
                    "whitespace-nowrap px-2.5 py-1 font-display text-[11px] font-extrabold uppercase tracking-wider transition-colors sm:px-3.5 sm:py-1.5 sm:text-sm sm:tracking-[0.14em]",
                    mode === "send"
                      ? "bg-ink text-paper"
                      : "text-ink hover:bg-ink/10",
                  )}
                >
                  <span className="sm:hidden">Send</span>
                  <span className="hidden sm:inline">Send a file</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("receive")}
                  className={cn(
                    "whitespace-nowrap px-2.5 py-1 font-display text-[11px] font-extrabold uppercase tracking-wider transition-colors sm:px-3.5 sm:py-1.5 sm:text-sm sm:tracking-[0.14em]",
                    mode === "receive"
                      ? "bg-cobalt text-paper"
                      : "text-ink hover:bg-ink/10",
                  )}
                >
                  Receive
                </button>
              </div>
            </div>

            {/* Right Action */}
            <div className="flex shrink-0 items-center gap-3 text-sm">
              <span className="hidden font-semibold text-ink/55 lg:inline">
                No login. No install.
              </span>
              <Button
                onClick={() => {
                  setMode("send");
                  fileInputRef.current?.click();
                }}
                className="pigeon-interactive-btn h-9 rounded-none border-2 border-ink bg-acid px-2.5 text-xs font-bold text-ink shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-ink hover:text-paper sm:h-10 sm:px-4 sm:text-sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{" "}
                <span className="hidden sm:inline">Drop a file</span>
                <span className="sm:hidden">Drop</span>
              </Button>
            </div>
          </div>
        </header>

        <main id="top">
          {/* ---------------- HERO POSTER ---------------- */}
          <section className="relative mx-auto max-w-[1440px] overflow-hidden px-4 pb-8 pt-6 sm:overflow-visible sm:px-7 sm:pb-10 sm:pt-14">
            <div className="pointer-events-none absolute -right-4 top-2 select-none font-display text-[9rem] font-extrabold leading-none text-coral/15 sm:-right-10 sm:text-[24rem] lg:-right-6">
              01
            </div>

            <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
              <div className="animate-entrance-headline relative z-10 lg:col-span-7">
                <div className="mb-4 inline-flex items-center gap-1.5 border-2 border-ink bg-paper px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.18em]">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-acid" />{" "}
                  <span className="sm:hidden">Phone → Pigeon → Laptop</span>
                  <span className="hidden sm:inline">
                    Phone → Pigeon → Laptop / Board
                  </span>
                </div>
                <h1 className="font-display text-[2.75rem] font-extrabold leading-[0.92] tracking-[-0.03em] min-[380px]:text-[3.2rem] sm:text-8xl lg:text-[8rem]">
                  <span className="block">Get it</span>
                  <span className="relative z-10 block">
                    <span className="relative inline-block -rotate-1 bg-acid px-2">
                      off
                    </span>{" "}
                    your
                  </span>
                  <span className="block">phone.</span>
                </h1>
                <p className="mt-5 max-w-[42ch] text-pretty text-base leading-relaxed text-ink/65 sm:text-lg">
                  Drop it. Get a short code. Pick it up on your laptop or board.
                  No email, no WhatsApp, no account.
                </p>
              </div>

              {/* Character with live state engine: sized and placed so it never covers the headline on mobile */}
              <div
                className="animate-entrance-pigeon pointer-events-none absolute right-1 top-2 z-0 w-24 text-cobalt opacity-70 min-[380px]:w-32 min-[430px]:w-36 sm:right-[-4%] sm:top-[-14%] sm:w-[48%] sm:opacity-95 lg:w-[44%]"
                style={{
                  transform: `rotate(${-6 + scrollTilt}deg) translateY(${scrollTilt * 1.5}px)`,
                }}
              >
                <Pigeon
                  state={pigeonState}
                  wingClass="fill-paper/35"
                  beakClass="fill-acid"
                  eyeClass="fill-paper"
                />
              </div>

              <div className="animate-entrance-sub relative z-10 lg:col-span-5">
                <div className="flex flex-wrap gap-2">
                  {["OPEN", "DROP", "CODE", "DONE"].map((word, index) => (
                    <span
                      key={word}
                      className={cn(
                        "border-2 border-ink px-3 py-1.5 font-display text-sm font-extrabold tracking-[0.14em]",
                        index === 2
                          ? "bg-acid text-ink"
                          : index === 3
                            ? "bg-ink text-paper"
                            : "bg-paper",
                      )}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ---------------- TICKER ---------------- */}
          <div
            className="animate-entrance-ticker relative w-full overflow-hidden border-y-2 border-ink bg-cobalt py-2.5 text-paper select-none"
            aria-label="Product workflow: Open, Drop, Code, Done"
          >
            <div className="animate-marquee flex w-max">
              {/* Primary Marquee Track Segment */}
              <div className="flex shrink-0 items-center gap-8 pr-8 font-display text-sm font-extrabold uppercase tracking-[0.24em]">
                {Array.from({ length: 8 }).map((_, index) => (
                  <span
                    key={`ticker-a-${index}`}
                    className="flex items-center gap-8"
                  >
                    Open <span className="text-acid">·</span> Drop{" "}
                    <span className="text-acid">·</span> Code{" "}
                    <span className="text-acid">·</span> Done{" "}
                    <span className="text-acid">✦</span>
                  </span>
                ))}
              </div>

              {/* Duplicate Marquee Track Segment (Enables Seamless Infinite Loop) */}
              <div
                className="flex shrink-0 items-center gap-8 pr-8 font-display text-sm font-extrabold uppercase tracking-[0.24em]"
                aria-hidden="true"
              >
                {Array.from({ length: 8 }).map((_, index) => (
                  <span
                    key={`ticker-b-${index}`}
                    className="flex items-center gap-8"
                  >
                    Open <span className="text-acid">·</span> Drop{" "}
                    <span className="text-acid">·</span> Code{" "}
                    <span className="text-acid">·</span> Done{" "}
                    <span className="text-acid">✦</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ---------------- THE MACHINE ---------------- */}
          <section className="animate-entrance-card mx-auto max-w-[1440px] px-4 py-8 sm:px-7 sm:py-12">
            {/* View Mode Switching */}
            {mode === "receive" ? (
              <div className="mx-auto w-full max-w-2xl">
                <ReceiveSection
                  appState={appState}
                  receiveCode={receiveCode}
                  codeError={codeError}
                  activeRoomCode={activeRoom?.code}
                  room={receivedRoom}
                  minutes={minutes}
                  seconds={remainder}
                  onCodeChange={(code) => {
                    setReceiveCode(code);
                    setCodeError(null);
                  }}
                  onSubmit={handleReceiveSubmit}
                  onDownload={triggerDownload}
                  onDownloadAll={triggerDownloadAll}
                  downloadedIds={downloadedIds}
                  onReset={() => {
                    setAppState("RECEIVER_CODE_ENTRY");
                    setReceivedRoom(null);
                    setCodeError(null);
                  }}
                />
              </div>
            ) : [
                "READY",
                "WAITING_FOR_RECEIVER",
                "CONNECTED",
                "COMPLETED",
                "EXPIRED",
              ].includes(appState) && activeRoom ? (
              <CodeMoment
                appState={appState}
                room={activeRoom}
                minutes={minutes}
                seconds={remainder}
                copied={copied}
                onCopy={() => copyCode(activeRoom.code)}
                onShare={() => shareCode(activeRoom.code)}
                onReset={resetAll}
                onSwitchToReceive={() => {
                  setReceiveCode(activeRoom.code);
                  switchMode("receive");
                }}
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-12">
                <section className="relative col-span-12 flex min-h-[460px] flex-col border-2 border-ink bg-surface p-4 shadow-poster sm:p-6 lg:col-span-8">
                  {/* Pigeon mascot peering over top edge */}
                  <span className="pointer-events-none absolute -top-14 right-6 hidden w-32 rotate-6 text-ink sm:block">
                    <Pigeon
                      state={pigeonState}
                      wingClass="fill-acid"
                      beakClass="fill-coral"
                    />
                  </span>

                  <div className="mb-4 flex items-center justify-between">
                    <span className="label">Dispatch · 01</span>
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        appState === "ERROR" ? "bg-coral" : "bg-acid",
                      )}
                    />
                  </div>

                  {appState === "ERROR" ? (
                    <div className="grid flex-1 place-items-center border-2 border-dashed border-coral bg-coral/10 p-6 text-center">
                      <div>
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-coral text-paper">
                          <X className="h-7 w-7" />
                        </span>
                        <h2 className="mt-5 font-display text-3xl font-extrabold">
                          {uploadError?.title ?? "Something went wrong."}
                        </h2>
                        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink/60">
                          {uploadError?.detail ??
                            "Pigeon carries files up to 250 MB. Please check your connection and try again."}
                        </p>
                        <Button
                          onClick={resetAll}
                          className="mt-6 h-11 rounded-none border-2 border-ink bg-ink px-5 text-paper hover:bg-cobalt"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" /> Try another
                        </Button>
                      </div>
                    </div>
                  ) : activePayloads.length ? (
                    <div className="flex flex-1 flex-col">
                      <FileList
                        files={activePayloads}
                        onRemove={(id) => {
                          const next = activePayloads.filter(
                            (file) => file.id !== id,
                          );
                          setActivePayloads(next);
                          setSelectedFiles(
                            next.map((p) => p.file).filter(Boolean) as File[],
                          );
                          if (!next.length) setAppState("IDLE");
                        }}
                      />

                      {appState === "UPLOADING" && (
                        <div className="mt-auto border-2 border-ink bg-ink p-5 text-paper">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-display text-2xl font-extrabold">
                              Pigeon in flight
                            </span>
                            <span className="font-mono text-sm text-acid">
                              {progress}%
                            </span>
                          </div>
                          <Progress
                            value={progress}
                            className="mt-4 h-2 rounded-none bg-paper/20 [&>div]:bg-acid"
                          />
                          <div className="mt-6 flex items-center justify-between">
                            <Smartphone className="h-6 w-6" />
                            <span className="w-24 text-cobalt">
                              <Pigeon
                                state="uploading"
                                wingClass="fill-acid"
                                beakClass="fill-coral"
                                parcelClass="fill-coral"
                              />
                            </span>
                            <Laptop className="h-6 w-6" />
                          </div>
                          <Button
                            onClick={resetAll}
                            variant="ghost"
                            className="mt-4 w-full rounded-none text-paper/60 hover:bg-paper/10 hover:text-paper"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}

                      {appState === "FILE_SELECTED" && (
                        <div className="mt-auto space-y-3 pt-5">
                          <DurationSelector
                            value={selectedDuration}
                            onChange={setSelectedDuration}
                          />
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Button
                              onClick={startUpload}
                              className="h-12 rounded-none border-2 border-ink bg-cobalt text-paper shadow-none hover:bg-ink"
                            >
                              <Upload className="mr-2 h-4 w-4" /> Send across
                            </Button>
                            <Button
                              onClick={() => fileInputRef.current?.click()}
                              variant="outline"
                              className="h-12 rounded-none border-2 border-ink bg-paper"
                            >
                              <Plus className="mr-2 h-4 w-4" /> Add more
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "group relative grid flex-1 place-items-center overflow-hidden border-2 border-dashed p-7 text-center transition-colors",
                        dragging
                          ? "border-ink bg-acid"
                          : "border-ink/35 bg-paper",
                      )}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setDragging(true);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragging(false);
                        handleFiles(event.dataTransfer.files);
                      }}
                    >
                      <div className="relative z-10">
                        <span
                          className={cn(
                            "mx-auto block w-40 text-cobalt transition-transform duration-300",
                            dragging
                              ? "-translate-y-2 scale-110"
                              : "group-hover:-translate-y-1",
                          )}
                        >
                          <Pigeon
                            state={dragging ? "dragging" : "idle"}
                            parcelClass="fill-coral"
                          />
                        </span>
                        <h2 className="mt-6 font-display text-4xl font-extrabold leading-none">
                          {dragging ? "Give it here." : "Drop it on the bird."}
                        </h2>
                        <p className="mt-2 text-sm font-semibold text-ink/55">
                          PDF · PPT · image · video · text
                        </p>
                        <div className="mt-7 grid gap-2 sm:grid-cols-2">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="pigeon-interactive-btn h-12 rounded-none border-2 border-ink bg-cobalt text-paper shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-ink"
                          >
                            <Upload className="mr-2 h-4 w-4" /> Choose files
                          </Button>
                          <Button
                            onClick={() => setTextOpen(true)}
                            variant="outline"
                            className="pigeon-interactive-btn h-12 rounded-none border-2 border-ink bg-paper shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <Clipboard className="mr-2 h-4 w-4" /> Paste text
                          </Button>
                        </div>
                        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                          No account · Temporary Code
                        </p>
                      </div>
                      <span className="dispatch-dot absolute left-[38%] top-[86%] h-3 w-3 rounded-full bg-coral" />
                      <ArrowDown className="pointer-events-none absolute left-6 top-6 h-6 w-6 text-ink/25" />
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    className="sr-only"
                    type="file"
                    multiple
                    onChange={(event) =>
                      event.target.files && handleFiles(event.target.files)
                    }
                  />
                </section>

                <div className="col-span-12 grid gap-4 lg:col-span-4">
                  <TransferVisual appState={appState} />
                  <PayloadPanel
                    files={activePayloads}
                    totalSize={totalSize}
                    appState={appState}
                  />
                </div>
              </div>
            )}
          </section>

          <CampaignSections onSwitchToReceive={() => switchMode("receive")} />
        </main>

        <ScrollReveal
          as="footer"
          className="border-t-2 border-ink bg-paper px-4 py-8 sm:px-7"
        >
          <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 font-display font-extrabold">
              <span className="w-10 text-cobalt">
                <PigeonMark className="w-full" />
              </span>{" "}
              PIGEON
            </div>
            <p className="text-sm text-ink/50">
              Built for the “it’s on my phone” problem.
            </p>
          </div>
        </ScrollReveal>

        {/* Dialog for Text Sharing */}
        <Dialog open={textOpen} onOpenChange={setTextOpen}>
          <DialogContent className="max-w-xl rounded-none border-2 border-ink bg-paper p-5 shadow-poster sm:p-7">
            <DialogHeader>
              <DialogTitle className="font-display text-3xl font-extrabold">
                Send the words.
              </DialogTitle>
              <DialogDescription className="text-ink/55">
                Paste a note, link, code, or anything you don’t want to type
                twice.
              </DialogDescription>
            </DialogHeader>
            <textarea
              autoFocus
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              placeholder="Paste it here…"
              className="mt-3 min-h-44 w-full resize-none border-2 border-ink bg-surface p-4 text-base outline-none focus:ring-2 focus:ring-cobalt/30"
            />
            <DurationSelector
              value={selectedDuration}
              onChange={setSelectedDuration}
              className="mt-2"
            />
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
              <p className="self-center text-xs text-ink/45">
                Stays in memory for this session.
              </p>
              <Button
                disabled={!textValue.trim()}
                onClick={handleSendText}
                className="h-11 rounded-none border-2 border-ink bg-cobalt px-5 text-paper shadow-none hover:bg-ink"
              >
                <MessageSquareText className="mr-2 h-4 w-4" /> Add text
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

/**
 * Duration Selector for 3, 5, or 10-minute transfer rooms
 */
function DurationSelector({
  value,
  onChange,
  className,
}: {
  value: 180 | 300 | 600;
  onChange: (val: 180 | 300 | 600) => void;
  className?: string;
}) {
  const options: Array<{ label: string; value: 180 | 300 | 600 }> = [
    { label: "3 MIN", value: 180 },
    { label: "5 MIN", value: 300 },
    { label: "10 MIN", value: 600 },
  ];

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label className="label text-[11px] text-ink/70">
          Transfer expires in
        </label>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/50">
          TOTAL ROOM LIFETIME
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label="Transfer duration"
        className="grid grid-cols-3 gap-1.5 border-2 border-ink bg-surface p-1"
      >
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(opt.value)}
              className={cn(
                "h-9 font-display text-xs font-extrabold uppercase tracking-wider transition-all",
                isSelected
                  ? "border-2 border-ink bg-cobalt text-paper shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  : "border-2 border-transparent bg-paper text-ink/75 hover:border-ink/40 hover:text-ink",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * File List displaying real selected payloads
 */
function FileList({
  files,
  onRemove,
}: {
  files: TransferPayload[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="mb-4">
        <h2 className="font-display text-4xl font-extrabold leading-none">
          Ready to fly.
        </h2>
        <p className="mt-2 text-sm font-semibold text-ink/55">
          {files.length} {files.length === 1 ? "file" : "files"} selected
        </p>
      </div>
      {files.map((file) => (
        <div
          key={file.id}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-2 border-ink bg-paper p-3"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center bg-acid text-ink">
            <FileGlyph type={file.type} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{file.name}</p>
            <p className="text-xs text-ink/45">{formatSize(file.size)}</p>
            {file.text && (
              <p className="mt-2 line-clamp-2 text-sm text-ink/65">
                {file.text}
              </p>
            )}
          </div>
          <IconButton
            label={`Remove ${file.name}`}
            onClick={() => onRemove(file.id)}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      ))}
    </div>
  );
}

/**
 * The Signature Code Moment: Displays the short temporary code (OPEN → DROP → CODE → DONE)
 */
function CodeMoment({
  appState,
  room,
  minutes,
  seconds,
  copied,
  onCopy,
  onShare,
  onReset,
  onSwitchToReceive,
}: {
  appState: AppState;
  room: TransferRoom;
  minutes: string;
  seconds: string;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onReset: () => void;
  onSwitchToReceive: () => void;
}) {
  if (appState === "EXPIRED") {
    return (
      <section className="grid place-items-center border-2 border-ink bg-ink px-6 py-24 text-center text-paper">
        <div>
          <span className="mx-auto block w-40 rotate-6 text-paper">
            <Pigeon
              state="expired"
              wingClass="fill-coral"
              beakClass="fill-acid"
            />
          </span>
          <Clock3 className="mx-auto mt-6 h-10 w-10 text-coral" />
          <h2 className="mt-4 font-display text-5xl font-extrabold leading-none">
            This Pigeon flew home.
          </h2>
          <p className="mt-3 text-sm text-paper/60">
            The temporary room expired. Start a fresh one.
          </p>
          <Button
            onClick={onReset}
            className="mt-7 h-12 rounded-none border-2 border-acid bg-acid px-6 text-ink hover:bg-paper"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> New Pigeon
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <section className="relative overflow-hidden border-2 border-ink bg-ink text-paper">
        <div className="pointer-events-none absolute -left-10 bottom-[-8%] w-64 rotate-12 text-cobalt opacity-90 sm:w-80">
          <Pigeon
            state="ready"
            wingClass="fill-acid"
            beakClass="fill-coral"
            eyeClass="fill-paper"
          />
        </div>

        <div className="relative grid gap-8 p-5 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="max-w-2xl">
            <span className="inline-block border-2 border-acid px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-acid">
              Temporary Code Ready
            </span>
            <h2 className="mt-5 font-display text-5xl font-extrabold uppercase leading-[0.85] tracking-[-0.02em] sm:text-7xl">
              Your pigeon
              <br />
              is ready.
            </h2>
            <p className="mt-4 font-display text-2xl font-bold text-acid sm:text-3xl">
              Open usepigeon.vercel.app on your other device (laptop, phone, or
              board).
            </p>

            {/* Prominent Code Card */}
            <div className="mt-7 grid gap-3 sm:max-w-md">
              <div className="border-2 border-paper/20 bg-surface/5 p-4">
                <span className="label text-paper/60">Enter this code:</span>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="font-mono text-4xl font-extrabold tracking-[0.2em] text-acid sm:text-5xl">
                    {room.code}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      onClick={onCopy}
                      variant="outline"
                      className={cn(
                        "pigeon-interactive-btn h-11 rounded-none border-2 font-bold transition-all",
                        copied
                          ? "border-acid bg-acid text-ink shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]"
                          : "border-paper bg-paper text-ink hover:bg-acid hover:text-ink shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                      )}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}{" "}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      onClick={onShare}
                      variant="ghost"
                      className="pigeon-interactive-btn h-11 rounded-none text-paper hover:bg-paper/15"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Status and countdown banner */}
              {appState === "CONNECTED" ? (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 bg-cobalt p-3 text-paper">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">
                      Receiver connected!
                    </p>
                    <p className="text-xs font-semibold text-paper/80">
                      Carrying your files across...
                    </p>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-ink">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  </span>
                </div>
              ) : appState === "COMPLETED" ? (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 bg-acid p-3 text-ink">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">
                      Transfer Complete!
                    </p>
                    <p className="text-xs font-semibold text-ink/70">
                      Pigeon has delivered your files.
                    </p>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-paper">
                    <Check className="h-4 w-4" />
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 bg-acid p-3 text-ink">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">
                      Waiting for receiver...
                    </p>
                    <p className="text-xs font-semibold text-ink/60">
                      Expires in {minutes}:{seconds}
                    </p>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-paper">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={onSwitchToReceive}
                className="pigeon-interactive-btn h-12 rounded-none border-2 border-acid bg-acid px-5 text-ink shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)] hover:bg-paper"
              >
                <KeyRound className="mr-2 h-4 w-4" /> Test Receive Mode with
                this Code
              </Button>
              <Button
                onClick={onReset}
                variant="ghost"
                className="h-12 rounded-none text-paper/70 hover:bg-paper/10 hover:text-paper"
              >
                Cancel Pigeon
              </Button>
            </div>
          </div>

          {/* Right Visual Poster Card */}
          <div className="relative mx-auto w-full max-w-[380px] rotate-1">
            <div className="border-4 border-acid bg-paper p-6 text-ink shadow-poster">
              <span className="label text-coral">Step 03</span>
              <h3 className="mt-2 font-display text-4xl font-extrabold uppercase leading-tight">
                CODE → DONE
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                1. Open{" "}
                <strong className="font-mono text-ink">
                  usepigeon.vercel.app
                </strong>{" "}
                on your other device.
                <br />
                2. Click <strong>Receive</strong>.
                <br />
                3. Type{" "}
                <strong className="font-mono text-cobalt">{room.code}</strong>.
              </p>

              <div className="mt-6 border-t-2 border-ink pt-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink/60">
                  <span>Files in pouch:</span>
                  <span>
                    {room.payloads.length} ({formatSize(room.totalSize)})
                  </span>
                </div>
              </div>
            </div>
            <span className="absolute -bottom-4 -right-3 -rotate-6 border-2 border-ink bg-coral px-3 py-1.5 font-display text-sm font-extrabold text-paper">
              ENTER CODE ON RECEIVER
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Receiver Experience: Code entry, Connecting, Transfer animation, and Success/Download
 */
function ReceiveSection({
  appState,
  receiveCode,
  codeError,
  activeRoomCode,
  room,
  minutes,
  seconds,
  onCodeChange,
  onSubmit,
  onDownload,
  onDownloadAll,
  downloadedIds,
  onReset,
}: {
  appState: AppState;
  receiveCode: string;
  codeError: string | null;
  activeRoomCode?: string | undefined;
  room: TransferRoom | null;
  minutes: string;
  seconds: string;
  onCodeChange: (code: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onDownload: (payload: TransferPayload) => void;
  onDownloadAll: (payloads: TransferPayload[]) => void;
  downloadedIds: string[];
  onReset: () => void;
}) {
  const isTransferring = ["CONNECTING", "SENDING", "RECEIVING"].includes(
    appState,
  );
  const isSuccess =
    (appState === "SUCCESS" ||
      appState === "FILES_AVAILABLE" ||
      appState === "DOWNLOADING" ||
      appState === "COMPLETED") &&
    room != null;

  return (
    <div className="grid gap-4">
      {appState === "EXPIRED" ? (
        /* EXPIRED SCREEN FOR RECEIVER */
        <section className="grid place-items-center border-2 border-ink bg-ink px-6 py-20 text-center text-paper shadow-poster">
          <div>
            <span className="mx-auto block w-36 rotate-6 text-paper">
              <Pigeon
                state="expired"
                wingClass="fill-coral"
                beakClass="fill-acid"
              />
            </span>
            <Clock3 className="mx-auto mt-6 h-9 w-9 text-coral" />
            <h2 className="mt-4 font-display text-4xl font-extrabold uppercase leading-none sm:text-5xl">
              This Pigeon flew home.
            </h2>
            <p className="mt-3 text-sm text-paper/60">
              The temporary room expired. Ask the sender for a new code.
            </p>
            <Button
              onClick={onReset}
              className="mt-6 h-12 rounded-none border-2 border-acid bg-acid px-6 font-bold text-ink hover:bg-paper"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Try Another Code
            </Button>
          </div>
        </section>
      ) : isSuccess ? (
        /* SUCCESS SCREEN: "GOT IT." */
        <section className="relative border-2 border-ink bg-surface p-6 shadow-poster sm:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mx-auto block w-32 text-cobalt">
              <Pigeon
                state="success"
                wingClass="fill-acid"
                beakClass="fill-coral"
              />
            </span>

            <span className="label mt-4 block text-acid">
              {appState === "DOWNLOADING"
                ? "Downloading Files..."
                : appState === "COMPLETED"
                  ? "Transfer Complete"
                  : "Files Available"}
            </span>
            <h2 className="mt-2 font-display text-6xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl">
              {appState === "DOWNLOADING"
                ? "Saving..."
                : appState === "COMPLETED"
                  ? "Delivered."
                  : "Got it."}
            </h2>
            <div className="mt-2.5 inline-flex items-center gap-2 border-2 border-ink bg-paper px-3 py-1 font-mono text-xs font-bold text-ink shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <Clock3 className="h-3.5 w-3.5 text-coral" />
              <span>
                EXPIRES IN {minutes}:{seconds}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-ink/60 sm:text-base">
              {appState === "DOWNLOADING"
                ? "Streaming files to your device storage..."
                : appState === "COMPLETED"
                  ? "All files downloaded successfully."
                  : `The pigeon delivered ${room.payloads.length} ${room.payloads.length === 1 ? "file" : "files"} from the sender.`}
            </p>

            {/* File List for Download */}
            <div className="mt-8 space-y-3 text-left">
              {room.payloads.map((payload) => (
                <div
                  key={payload.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-2 border-ink bg-paper p-4"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center bg-acid text-ink">
                    <FileGlyph type={payload.type} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-ink">
                      {payload.name}
                    </p>
                    <p className="text-xs font-semibold text-ink/50">
                      {formatSize(payload.size)} · {payload.type}
                    </p>
                    {payload.text && (
                      <p className="mt-2 rounded-none border border-ink/20 bg-surface p-2 text-sm text-ink/75">
                        {payload.text}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => onDownload(payload)}
                    className="pigeon-interactive-btn h-11 rounded-none border-2 border-ink bg-cobalt px-4 text-paper shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-ink"
                  >
                    {downloadedIds.includes(payload.id) ? (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Downloaded
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" /> Download
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>

            {/* Batch actions */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {room.payloads.length > 1 && (
                <Button
                  onClick={() => onDownloadAll(room.payloads)}
                  className="pigeon-interactive-btn h-12 rounded-none border-2 border-ink bg-ink px-6 text-paper shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-cobalt"
                >
                  <Download className="mr-2 h-4 w-4" /> Download All (
                  {room.payloads.length} files)
                </Button>
              )}
              <Button
                onClick={onReset}
                variant="outline"
                className="pigeon-interactive-btn h-12 rounded-none border-2 border-ink bg-paper px-6 text-ink shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-ink hover:text-paper"
              >
                <Plus className="mr-2 h-4 w-4" /> Receive another file
              </Button>
            </div>
          </div>
        </section>
      ) : isTransferring ? (
        /* ACTIVE IN-FLIGHT HANDOFF ANIMATION SCREEN */
        <section className="relative border-2 border-ink bg-ink p-8 text-center text-paper shadow-poster sm:p-14">
          <div className="mx-auto max-w-xl">
            <span className="label text-acid">
              {appState === "CONNECTING"
                ? "Connecting"
                : appState === "SENDING"
                  ? "Pigeon In Flight"
                  : "Touchdown"}
            </span>

            <h2 className="mt-3 font-display text-4xl font-extrabold uppercase leading-tight sm:text-5xl">
              {appState === "CONNECTING" && "Pairing with sender…"}
              {appState === "SENDING" && "Carrying your file across…"}
              {appState === "RECEIVING" && "Pigeon has landed! Settling…"}
            </h2>

            {/* Centerpiece Pigeon executing signature flight sequences */}
            <div className="my-10">
              <span className="mx-auto block w-36 text-cobalt sm:w-44">
                <Pigeon
                  state={
                    appState === "SENDING"
                      ? "sending"
                      : appState === "RECEIVING"
                        ? "receiving"
                        : "waiting"
                  }
                  wingClass="fill-acid"
                  beakClass="fill-coral"
                  parcelClass="fill-coral"
                />
              </span>
            </div>

            <p className="font-mono text-sm text-paper/70">
              Code:{" "}
              <strong className="text-acid">{room?.code ?? receiveCode}</strong>
            </p>
          </div>
        </section>
      ) : (
        /* CODE ENTRY SCREEN */
        <section className="relative border-2 border-ink bg-surface p-6 shadow-poster sm:p-10">
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="label">Receiver · 02</span>
              <span className="h-2.5 w-2.5 rounded-full bg-cobalt" />
            </div>

            <h2 className="mt-4 font-display text-4xl font-extrabold uppercase tracking-tight sm:text-6xl">
              Receive a file.
            </h2>
            <p className="mt-2 text-base text-ink/65">
              Enter the short code shown on the sender’s phone or computer.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="pigeon-code-input"
                  className="label mb-2 block text-ink"
                >
                  Pigeon Code
                </label>
                <div className="relative">
                  <input
                    id="pigeon-code-input"
                    type="text"
                    value={receiveCode}
                    onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
                    placeholder="K7M4P"
                    maxLength={8}
                    autoFocus
                    className={cn(
                      "h-16 w-full border-2 border-ink bg-paper p-4 font-mono text-3xl font-extrabold uppercase tracking-[0.2em] text-ink outline-none transition-all placeholder:text-ink/30 focus:border-cobalt focus:ring-4 focus:ring-cobalt/20",
                      codeError && "border-coral bg-coral/10",
                    )}
                  />
                  <KeyRound className="pointer-events-none absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-ink/30" />
                </div>
                {codeError && (
                  <p className="mt-2 text-sm font-bold text-coral">
                    {codeError}
                  </p>
                )}
              </div>

              {/* Memory room autofill helper chip for demonstration */}
              {activeRoomCode && (
                <div className="flex items-center justify-between border-2 border-dashed border-ink/30 bg-paper p-3 text-sm">
                  <span className="font-semibold text-ink/70">
                    Active code from your Send tab:{" "}
                    <strong className="font-mono text-cobalt">
                      {activeRoomCode}
                    </strong>
                  </span>
                  <Button
                    type="button"
                    onClick={() => onCodeChange(activeRoomCode)}
                    variant="ghost"
                    className="h-8 rounded-none border border-ink bg-acid px-3 text-xs font-bold text-ink hover:bg-ink hover:text-paper"
                  >
                    Auto-fill
                  </Button>
                </div>
              )}

              <div className="pt-3">
                <Button
                  type="submit"
                  className="h-14 w-full rounded-none border-2 border-ink bg-acid font-display text-lg font-extrabold uppercase tracking-wider text-ink hover:bg-ink hover:text-paper"
                >
                  Receive file <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </form>

            <div className="mt-10 border-t-2 border-ink/20 pt-6">
              <span className="label text-ink/50">Prototype Note</span>
              <p className="mt-1 text-xs text-ink/50">
                Code <strong className="font-mono text-ink">K7M4P</strong> is
                pre-seeded with sample lecture notes so you can test receiving
                immediately. Or drop a file in the Send tab to generate your own
                code.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Route Step Timeline
 */
function TransferVisual({ appState }: { appState: AppState }) {
  const activeIndex =
    appState === "SUCCESS"
      ? 2
      : [
            "UPLOADING",
            "READY",
            "WAITING_FOR_RECEIVER",
            "CONNECTING",
            "SENDING",
            "RECEIVING",
          ].includes(appState)
        ? 1
        : 0;

  const labels = ["Tagged on phone", "In flight", "Landed on laptop"];
  const pigeonState = getPigeonState(appState);

  return (
    <section className="flex min-h-64 flex-col border-2 border-ink bg-ink p-5 text-paper">
      <span className="label text-paper/50">The short route</span>
      <div className="my-7 flex items-center justify-between gap-3">
        <Smartphone className="h-7 w-7" />
        <span className="h-0.5 flex-1 bg-paper/20" />
        <span className="w-16 text-cobalt">
          <Pigeon state={pigeonState} parcelClass="fill-coral" />
        </span>
        <span className="h-0.5 flex-1 bg-paper/20" />
        <Laptop className="h-7 w-7" />
      </div>
      <div className="mt-auto space-y-4">
        {labels.map((label, index) => (
          <div
            key={label}
            className={cn(
              "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-sm",
              index > activeIndex ? "text-paper/35" : "font-bold text-paper",
            )}
          >
            <span
              className={cn(
                "h-2.5 w-2.5",
                index < activeIndex
                  ? "bg-acid"
                  : index === activeIndex
                    ? "bg-cobalt"
                    : "bg-paper/20",
              )}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Payload summary card
 */
function PayloadPanel({
  files,
  totalSize,
  appState,
}: {
  files: TransferPayload[];
  totalSize: number;
  appState: AppState;
}) {
  return (
    <section className="border-2 border-ink bg-acid p-5 text-ink">
      <div className="flex items-center justify-between">
        <span className="label text-ink/70">Payload</span>
        <span className="text-xs font-bold">
          {files.length} {files.length === 1 ? "file" : "files"}
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {files.length === 0 ? (
          <p className="text-sm font-semibold text-ink/60">
            No files staged yet.
          </p>
        ) : (
          files.slice(0, 3).map((file) => (
            <div
              key={file.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm"
            >
              <span className="truncate font-bold">{file.name}</span>
              <span className="shrink-0 text-ink/60">
                {formatSize(file.size)}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="mt-5 flex items-center justify-between border-t-2 border-ink pt-3 text-xs font-extrabold uppercase tracking-[0.12em]">
        <span>{appState === "SUCCESS" ? "Delivered" : "Status"}</span>
        <span>{formatSize(totalSize)}</span>
      </div>
    </section>
  );
}

/**
 * Marketing & Campaign posters below the fold
 */
function CampaignSections({
  onSwitchToReceive,
}: {
  onSwitchToReceive: () => void;
}) {
  const oldWay = [
    "Open Gmail",
    "Login",
    "Compose",
    "Attach",
    "Send",
    "Open laptop",
    "Download",
  ];
  return (
    <div>
      {/* POSTER 1 — The stupid old way */}
      <ScrollReveal as="section" className="border-t-2 border-ink">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-12 sm:gap-10 sm:px-7 sm:py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <span className="label text-coral">
              A completely normal question
            </span>
            <h2 className="mt-4 max-w-[11ch] font-display text-[2.75rem] font-extrabold leading-[1.04] tracking-[-0.03em] min-[380px]:text-[3.2rem] sm:leading-[0.88] sm:text-8xl">
              Why are you{" "}
              <span className="inline-block bg-coral px-2 py-0.5 text-paper">
                emailing
              </span>{" "}
              yourself?
            </h2>
          </div>
          <div className="lg:col-span-5">
            <div className="flex flex-wrap gap-2">
              {oldWay.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="border-2 border-ink bg-paper px-2.5 py-1.5 text-xs font-bold line-through decoration-coral decoration-2 sm:px-3 sm:py-2 sm:text-sm">
                    {step}
                  </span>
                  {index < oldWay.length - 1 && (
                    <span className="text-coral">→</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 overflow-hidden border-2 border-ink bg-cobalt p-4 sm:p-6 text-paper">
              <p className="label text-paper/60">Or</p>
              <p className="mt-2 font-display text-[1.32rem] min-[360px]:text-[1.55rem] min-[400px]:text-2xl sm:text-4xl font-extrabold leading-none tracking-tight whitespace-nowrap">
                Drop → Code → Done.
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* POSTER 2 — Anything goes */}
      <ScrollReveal
        as="section"
        className="border-y-2 border-ink bg-coral px-4 py-12 text-paper sm:px-7 sm:py-20 lg:py-28"
      >
        <div className="mx-auto grid max-w-[1440px] items-center gap-8 sm:gap-12 lg:grid-cols-2">
          <div>
            <span className="label text-paper/70">Anything goes</span>
            <h2 className="mt-4 max-w-[13ch] font-display text-[2.6rem] font-extrabold leading-[0.94] tracking-[-0.03em] min-[380px]:text-[3rem] sm:leading-[0.86] sm:text-7xl">
              Anything you send to yourself, you can Pigeon.
            </h2>
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-2">
              {[
                "Lecture slides",
                "A screenshot",
                "That one video",
                "A link",
                "Your ID scan",
              ].map((item) => (
                <span
                  key={item}
                  className="border-2 border-paper px-3 py-1.5 text-sm font-bold"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Continuous Journey Illustration: Phone ⇄ Laptop with Endless Flying Pigeon */}
          <div className="relative min-h-[22rem] sm:min-h-[24rem] overflow-hidden border-2 border-ink bg-paper p-5 sm:p-7 text-ink select-none">
            {/* Phone Device on Left */}
            <div className="absolute left-5 top-5 sm:left-7 sm:top-7 z-10 grid h-20 w-13 sm:h-28 sm:w-18 place-items-center rounded-sm border-2 border-ink bg-ink px-2 sm:px-3 text-paper shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Smartphone className="h-7 w-7 sm:h-10 sm:w-10" />
            </div>

            {/* Laptop Device on Right */}
            <div className="absolute bottom-14 right-5 sm:bottom-7 sm:right-7 z-10 grid h-28 w-44 sm:h-40 sm:w-60 place-items-center rounded-sm border-[4px] sm:border-[6px] border-ink bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Laptop className="h-12 w-12 sm:h-16 sm:w-16 text-ink" />
            </div>

            {/* Continuous Flight Stage: PHONE → PIGEON FLIES → PC → PIGEON FLIES BACK → PHONE */}
            <div className="animate-pigeon-shuttle pointer-events-none z-20 w-32 sm:w-44 text-cobalt">
              <Pigeon
                state="uploading"
                wingClass="fill-acid"
                beakClass="fill-coral"
                parcelClass="fill-coral"
              />
            </div>

            {/* Bottom Action Button */}
            <button
              type="button"
              onClick={onSwitchToReceive}
              className="pigeon-interactive-btn absolute bottom-4 left-5 sm:bottom-6 sm:left-6 z-20 border-2 border-ink bg-acid px-3.5 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-extrabold text-ink shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors hover:bg-ink hover:text-paper"
            >
              Works the other way, too →
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* POSTER 3 — Three-beat manifesto */}
      <ScrollReveal
        as="section"
        className="mx-auto max-w-[1440px] px-4 py-20 sm:px-7 lg:py-28"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              n: "01",
              t: "Open",
              d: "No app, no signup. A tab is the whole product.",
              bg: "bg-paper",
              fg: "text-ink",
            },
            {
              n: "02",
              t: "Drop",
              d: "Files, text, links. The bird takes whatever you hand it.",
              bg: "bg-ink",
              fg: "text-paper",
            },
            {
              n: "03",
              t: "Code",
              d: "Type a 5-character code. The bird delivers it. Then it's gone.",
              bg: "bg-cobalt",
              fg: "text-paper",
            },
          ].map((item) => (
            <div
              key={item.n}
              className={cn(
                "pigeon-card-interactive relative overflow-hidden border-2 border-ink p-6",
                item.bg,
                item.fg,
              )}
            >
              <span className="font-mono text-xs font-bold opacity-60">
                {item.n}
              </span>
              <h3 className="mt-6 font-display text-6xl font-extrabold leading-none">
                {item.t}
              </h3>
              <p className="mt-3 max-w-[26ch] text-sm opacity-80">{item.d}</p>
              <span className="pointer-events-none absolute -bottom-6 -right-6 w-28 rotate-12 opacity-25">
                <Pigeon
                  state="idle"
                  wingClass="fill-acid"
                  beakClass="fill-coral"
                />
              </span>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </div>
  );
}
