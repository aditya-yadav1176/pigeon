import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  Check,
  Clipboard,
  Clock3,
  Copy,
  Download,
  File,
  FileImage,
  FileText,
  Laptop,
  LoaderCircle,
  MessageSquareText,
  MonitorDown,
  Plus,
  RotateCcw,
  Share2,
  Smartphone,
  Trash2,
  Upload,
  Wifi,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Pigeon, PigeonMark } from "./PigeonCharacter";

type Stage =
  "empty" | "selected" | "uploading" | "ready" | "connected" | "received" | "expired" | "error";

type Payload = {
  id: string;
  name: string;
  size: number;
  type: string;
  text?: string;
};

const DEMO_PAYLOADS: Payload[] = [
  { id: "demo-pdf", name: "DBMS Notes.pdf", size: 4_200_000, type: "application/pdf" },
  {
    id: "demo-ppt",
    name: "Presentation.pptx",
    size: 24_800_000,
    type: "application/vnd.ms-powerpoint",
  },
  { id: "demo-image", name: "diagram.png", size: 1_700_000, type: "image/png" },
];

const ROOM_CODE = "4K9X";
const ROOM_URL = "pigeon.app/r/4K9X";

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

/** Deterministic decorative QR-style matrix (visual only). */
function useQrMatrix(seed: string, size = 21) {
  return useMemo(() => {
    let hash = 2166136261;
    for (const char of seed) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    const rand = () => {
      hash ^= hash << 13;
      hash ^= hash >>> 17;
      hash ^= hash << 5;
      return Math.abs(hash % 1000) / 1000;
    };
    const inFinder = (row: number, col: number) =>
      (row < 8 && col < 8) || (row < 8 && col > size - 9) || (row > size - 9 && col < 8);
    const inLogo = (row: number, col: number) => {
      const mid = (size - 1) / 2;
      return Math.abs(row - mid) <= 2 && Math.abs(col - mid) <= 2;
    };
    return Array.from({ length: size }, (_, row) =>
      Array.from({ length: size }, (_, col) =>
        inFinder(row, col) || inLogo(row, col) ? false : rand() > 0.48,
      ),
    );
  }, [seed, size]);
}

function FileGlyph({ type }: { type: string }) {
  if (type.startsWith("image")) return <FileImage />;
  if (type === "text/plain") return <MessageSquareText />;
  return type.includes("pdf") || type.includes("presentation") ? <FileText /> : <File />;
}

function Finder({
  className,
  style,
}: {
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}) {
  return (
    <span
      style={style}
      className={cn("absolute grid place-items-center border-[6px] border-ink bg-paper", className)}
    >
      <span className="h-1/2 w-1/2 bg-ink" />
    </span>
  );
}

function QrArt({ size = 21 }: { size?: number }) {
  const matrix = useQrMatrix(ROOM_CODE, size);
  const unit = `${100 / size}%`;
  return (
    <div className="qr-reveal relative aspect-square w-full bg-paper p-[6%]">
      <div
        className="relative grid h-full w-full"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {matrix.flatMap((row, r) =>
          row.map((on, c) => (
            <span key={`${r}-${c}`} className={on ? "bg-ink" : "bg-transparent"} />
          )),
        )}
        <Finder className="left-0 top-0" style={{ width: unit, height: unit } as never} />
      </div>
      {/* finder eyes */}
      <span className="pointer-events-none absolute left-[6%] top-[6%] grid aspect-square w-[30%] place-items-center border-[0.5rem] border-ink bg-paper">
        <span className="h-1/2 w-1/2 bg-cobalt" />
      </span>
      <span className="pointer-events-none absolute right-[6%] top-[6%] grid aspect-square w-[30%] place-items-center border-[0.5rem] border-ink bg-paper">
        <span className="h-1/2 w-1/2 bg-ink" />
      </span>
      <span className="pointer-events-none absolute bottom-[6%] left-[6%] grid aspect-square w-[30%] place-items-center border-[0.5rem] border-ink bg-paper">
        <span className="h-1/2 w-1/2 bg-coral" />
      </span>
      {/* pigeon sits in the middle of its own code */}
      <span className="pointer-events-none absolute left-1/2 top-1/2 w-[26%] -translate-x-1/2 -translate-y-1/2 bg-paper p-1 text-ink">
        <Pigeon mood="idle" wingClass="fill-acid" beakClass="fill-coral" />
      </span>
    </div>
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
  className?: string;
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
  const [stage, setStage] = useState<Stage>("empty");
  const [files, setFiles] = useState<Payload[]>([]);
  const [progress, setProgress] = useState(0);
  const [seconds, setSeconds] = useState(582);
  const [textOpen, setTextOpen] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [downloaded, setDownloaded] = useState<string[]>([]);

  const activePayloads = files.length ? files : DEMO_PAYLOADS;
  const totalSize = useMemo(
    () => activePayloads.reduce((sum, file) => sum + file.size, 0),
    [activePayloads],
  );

  useEffect(() => {
    if (stage !== "uploading") return;
    const timer = window.setInterval(() => {
      setProgress((value) => {
        const next = Math.min(value + 4, 100);
        if (next === 100) {
          window.clearInterval(timer);
          window.setTimeout(() => setStage("ready"), 350);
        }
        return next;
      });
    }, 90);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (!["ready", "connected", "received"].includes(stage)) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (seconds === 0 && ["ready", "connected", "received"].includes(stage)) setStage("expired");
  }, [seconds, stage]);

  function acceptFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    if (incoming.some((file) => file.size > 250 * 1024 * 1024)) {
      setStage("error");
      return;
    }
    setFiles(
      incoming.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      })),
    );
    setStage("selected");
    setProgress(0);
  }

  function sendText() {
    const trimmed = textValue.trim();
    if (!trimmed) return;
    setFiles([
      {
        id: `text-${Date.now()}`,
        name: trimmed.startsWith("http") ? "Shared link" : "Shared note",
        size: new Blob([trimmed]).size,
        type: "text/plain",
        text: trimmed,
      },
    ]);
    setStage("selected");
    setTextOpen(false);
  }

  function reset() {
    setStage("empty");
    setFiles([]);
    setProgress(0);
    setSeconds(582);
    setDownloaded([]);
    setTextValue("");
    setCopied(false);
  }

  async function copyLink() {
    await navigator.clipboard?.writeText(`https://${ROOM_URL}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareRoom() {
    if (navigator.share)
      await navigator.share({ title: "Your Pigeon is ready", url: `https://${ROOM_URL}` });
    else await copyLink();
  }

  function downloadFile(id: string) {
    setDownloaded((items) => [...new Set([...items, id])]);
  }

  const isRoom = ["ready", "connected", "received", "expired"].includes(stage);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen overflow-x-clip bg-paper font-body text-ink">
        <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper">
          <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-7">
            <a href="#top" className="flex min-w-0 items-center gap-2.5" aria-label="Pigeon home">
              <span className="grid h-10 w-11 shrink-0 -rotate-3 place-items-center rounded-sm bg-ink px-1.5 text-paper">
                <PigeonMark className="w-full" />
              </span>
              <span className="truncate font-display text-lg font-extrabold tracking-tight">
                PIGEON
              </span>
            </a>
            <div className="flex shrink-0 items-center gap-3 text-sm">
              <span className="hidden font-semibold text-ink/55 sm:inline">
                No login. No install.
              </span>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-10 rounded-none border-2 border-ink bg-acid px-4 text-ink shadow-none hover:bg-ink hover:text-paper"
              >
                <Plus /> Drop a file
              </Button>
            </div>
          </div>
        </header>

        <main id="top">
          {/* ---------------- HERO POSTER ---------------- */}
          <section className="relative mx-auto max-w-[1440px] px-4 pb-10 pt-10 sm:px-7 sm:pt-16">
            <div className="pointer-events-none absolute -right-10 top-2 select-none font-display text-[16rem] font-extrabold leading-none text-coral/15 sm:text-[26rem] lg:-right-6">
              01
            </div>

            <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
              <div className="relative z-10 lg:col-span-7">
                <div className="mb-5 inline-flex items-center gap-2 border-2 border-ink bg-paper px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
                  <span className="h-2 w-2 rounded-full bg-acid" /> Phone <span>→</span> Pigeon{" "}
                  <span>→</span> Laptop
                </div>
                <h1 className="font-display text-[3.4rem] font-extrabold leading-[0.86] tracking-[-0.03em] sm:text-8xl lg:text-[8.5rem]">
                  <span className="block">Get it</span>
                  <span className="relative z-10 block">
                    <span className="relative inline-block bg-acid px-2 -rotate-1">off</span> your
                  </span>
                  <span className="block">phone.</span>
                </h1>
                <p className="mt-6 max-w-[42ch] text-pretty text-lg leading-relaxed text-ink/65">
                  Drop it. Scan it from your laptop. Done. No email, no WhatsApp, no account.
                </p>
              </div>

              {/* oversized character, overlapping the headline and breaking the grid */}
              <div className="pointer-events-none absolute right-[-6%] top-[-4%] z-0 w-[62%] max-w-[560px] rotate-[-8deg] text-cobalt opacity-95 sm:w-[52%] lg:right-[-4%] lg:top-[-14%] lg:w-[46%]">
                <Pigeon
                  mood="waiting"
                  wingClass="fill-paper/35"
                  beakClass="fill-acid"
                  eyeClass="fill-paper"
                />
              </div>

              <div className="relative z-10 lg:col-span-5">
                <div className="flex flex-wrap gap-2">
                  {["OPEN", "DROP", "SCAN", "DONE"].map((word, index) => (
                    <span
                      key={word}
                      className={cn(
                        "border-2 border-ink px-3 py-1.5 font-display text-sm font-extrabold tracking-[0.14em]",
                        index === 3 ? "bg-ink text-paper" : "bg-paper",
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
          <div className="relative overflow-hidden border-y-2 border-ink bg-cobalt py-2.5 text-paper">
            <div className="marquee flex w-max gap-8 whitespace-nowrap font-display text-sm font-extrabold uppercase tracking-[0.24em]">
              {Array.from({ length: 8 }).map((_, index) => (
                <span key={index} className="flex items-center gap-8">
                  Open <span className="text-acid">·</span> Drop{" "}
                  <span className="text-acid">·</span> Scan <span className="text-acid">·</span>{" "}
                  Done <span className="text-acid">✦</span>
                </span>
              ))}
            </div>
          </div>

          {/* ---------------- THE MACHINE ---------------- */}
          <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-7 sm:py-14">
            {isRoom ? (
              <QrMoment
                stage={stage}
                files={activePayloads}
                minutes={minutes}
                seconds={remainder}
                copied={copied}
                onCopy={copyLink}
                onShare={shareRoom}
                onConnect={() => setStage("connected")}
                onReceive={() => setStage("received")}
                onReset={reset}
                downloaded={downloaded}
                onDownload={downloadFile}
                onDownloadAll={() => setDownloaded(activePayloads.map((file) => file.id))}
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-12">
                <section className="relative col-span-12 flex min-h-[460px] flex-col border-2 border-ink bg-surface p-4 shadow-poster sm:p-6 lg:col-span-8">
                  {/* pigeon head peeks out over the top edge of the card */}
                  <span className="pointer-events-none absolute -top-14 right-6 hidden w-32 rotate-6 text-ink sm:block">
                    <Pigeon
                      mood={dragging ? "carrying" : "idle"}
                      wingClass="fill-acid"
                      beakClass="fill-coral"
                    />
                  </span>

                  <div className="mb-4 flex items-center justify-between">
                    <span className="label">Dispatch · 01</span>
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        stage === "error" ? "bg-coral" : "bg-acid",
                      )}
                    />
                  </div>

                  {stage === "error" ? (
                    <div className="grid flex-1 place-items-center border-2 border-dashed border-coral bg-coral/10 p-6 text-center">
                      <div>
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-coral text-paper">
                          <X />
                        </span>
                        <h2 className="mt-5 font-display text-3xl font-extrabold">
                          That one’s too heavy.
                        </h2>
                        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink/60">
                          This demo carries files up to 250 MB. Nothing was uploaded.
                        </p>
                        <Button
                          onClick={reset}
                          className="mt-6 h-11 rounded-none border-2 border-ink bg-ink px-5 text-paper hover:bg-cobalt"
                        >
                          <RotateCcw /> Try another
                        </Button>
                      </div>
                    </div>
                  ) : files.length ? (
                    <div className="flex flex-1 flex-col">
                      <FileList
                        files={files}
                        onRemove={(id) => {
                          const next = files.filter((file) => file.id !== id);
                          setFiles(next);
                          if (!next.length) setStage("empty");
                        }}
                      />
                      {stage === "uploading" && (
                        <div className="mt-auto border-2 border-ink bg-ink p-5 text-paper">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-display text-2xl font-extrabold">
                              Pigeon in flight
                            </span>
                            <span className="font-mono text-sm text-acid">{progress}%</span>
                          </div>
                          <Progress
                            value={progress}
                            className="mt-4 h-2 rounded-none bg-paper/20 [&>div]:bg-acid"
                          />
                          <div className="mt-6 flex items-center justify-between">
                            <Smartphone />
                            <span className="w-24 text-cobalt">
                              <Pigeon
                                mood="carrying"
                                wingClass="fill-acid"
                                beakClass="fill-coral"
                                parcelClass="fill-coral"
                              />
                            </span>
                            <Laptop />
                          </div>
                          <Button
                            onClick={reset}
                            variant="ghost"
                            className="mt-4 w-full rounded-none text-paper/60 hover:bg-paper/10 hover:text-paper"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      {stage === "selected" && (
                        <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
                          <Button
                            onClick={() => {
                              setProgress(0);
                              setStage("uploading");
                            }}
                            className="h-12 rounded-none border-2 border-ink bg-cobalt text-paper shadow-none hover:bg-ink"
                          >
                            <Upload /> Send across
                          </Button>
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="h-12 rounded-none border-2 border-ink bg-paper"
                          >
                            <Plus /> Add more
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "group relative grid flex-1 place-items-center overflow-hidden border-2 border-dashed p-7 text-center transition-colors",
                        dragging ? "border-ink bg-acid" : "border-ink/35 bg-paper",
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
                        acceptFiles(event.dataTransfer.files);
                      }}
                    >
                      <div className="relative z-10">
                        <span
                          className={cn(
                            "mx-auto block w-40 text-cobalt transition-transform duration-300",
                            dragging ? "-translate-y-2 scale-110" : "group-hover:-translate-y-1",
                          )}
                        >
                          <Pigeon
                            mood={dragging ? "carrying" : "waiting"}
                            wingClass="fill-acid"
                            beakClass="fill-coral"
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
                            className="h-12 rounded-none border-2 border-ink bg-cobalt text-paper shadow-none hover:bg-ink"
                          >
                            <Upload /> Choose files
                          </Button>
                          <Button
                            onClick={() => setTextOpen(true)}
                            variant="outline"
                            className="h-12 rounded-none border-2 border-ink bg-paper"
                          >
                            <Clipboard /> Paste text
                          </Button>
                        </div>
                        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
                          No account · Temporary
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
                    onChange={(event) => event.target.files && acceptFiles(event.target.files)}
                  />
                </section>

                <div className="col-span-12 grid gap-4 lg:col-span-4">
                  <TransferVisual stage={stage} />
                  <PayloadPanel files={activePayloads} totalSize={totalSize} stage={stage} />
                </div>
              </div>
            )}
          </section>

          <CampaignSections />
        </main>

        <footer className="border-t-2 border-ink bg-paper px-4 py-8 sm:px-7">
          <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 font-display font-extrabold">
              <span className="w-10 text-cobalt">
                <PigeonMark className="w-full" />
              </span>{" "}
              PIGEON
            </div>
            <p className="text-sm text-ink/50">Built for the “it’s on my phone” problem.</p>
          </div>
        </footer>

        <Dialog open={textOpen} onOpenChange={setTextOpen}>
          <DialogContent className="max-w-xl rounded-none border-2 border-ink bg-paper p-5 shadow-poster sm:p-7">
            <DialogHeader>
              <DialogTitle className="font-display text-3xl font-extrabold">
                Send the words.
              </DialogTitle>
              <DialogDescription className="text-ink/55">
                Paste a note, link, code, or anything you don’t want to type twice.
              </DialogDescription>
            </DialogHeader>
            <textarea
              autoFocus
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              placeholder="Paste it here…"
              className="mt-3 min-h-44 w-full resize-none border-2 border-ink bg-surface p-4 text-base outline-none focus:ring-2 focus:ring-cobalt/30"
            />
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <p className="self-center text-xs text-ink/45">Stays only in this browser demo.</p>
              <Button
                disabled={!textValue.trim()}
                onClick={sendText}
                className="h-11 rounded-none border-2 border-ink bg-cobalt px-5 text-paper shadow-none hover:bg-ink"
              >
                <MessageSquareText /> Add text
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function FileList({ files, onRemove }: { files: Payload[]; onRemove: (id: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="mb-4">
        <h2 className="font-display text-4xl font-extrabold leading-none">Ready to fly.</h2>
        <p className="mt-2 text-sm font-semibold text-ink/55">
          {files.length} {files.length === 1 ? "thing" : "things"} selected
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
            {file.text && <p className="mt-2 line-clamp-2 text-sm text-ink/65">{file.text}</p>}
          </div>
          <IconButton label={`Remove ${file.name}`} onClick={() => onRemove(file.id)}>
            <Trash2 />
          </IconButton>
        </div>
      ))}
    </div>
  );
}

/** The signature moment: a full-width QR poster. */
function QrMoment({
  stage,
  files,
  minutes,
  seconds,
  copied,
  onCopy,
  onShare,
  onConnect,
  onReceive,
  onReset,
  downloaded,
  onDownload,
  onDownloadAll,
}: {
  stage: Stage;
  files: Payload[];
  minutes: string;
  seconds: string;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onConnect: () => void;
  onReceive: () => void;
  onReset: () => void;
  downloaded: string[];
  onDownload: (id: string) => void;
  onDownloadAll: () => void;
}) {
  if (stage === "expired") {
    return (
      <section className="grid place-items-center border-2 border-ink bg-ink px-6 py-24 text-center text-paper">
        <div>
          <span className="mx-auto block w-40 rotate-6 text-paper">
            <Pigeon mood="idle" wingClass="fill-coral" beakClass="fill-acid" />
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
            <RotateCcw /> New Pigeon
          </Button>
        </div>
      </section>
    );
  }

  const statusLabel =
    stage === "ready"
      ? "Waiting for your laptop…"
      : stage === "connected"
        ? "Laptop connected"
        : "Delivered. Nice.";
  const receiverOpen = stage === "connected" || stage === "received";

  return (
    <div className="grid gap-4">
      <section className="relative overflow-hidden border-2 border-ink bg-ink text-paper">
        <div className="pointer-events-none absolute -left-10 bottom-[-8%] w-64 rotate-12 text-cobalt opacity-90 sm:w-80">
          <Pigeon
            mood={stage === "received" ? "done" : "waiting"}
            wingClass="fill-acid"
            beakClass="fill-coral"
            eyeClass="fill-paper"
          />
        </div>
        <div className="relative grid gap-8 p-5 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="max-w-2xl">
            <span className="inline-block border-2 border-acid px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-acid">
              Room {ROOM_CODE}
            </span>
            <h2 className="mt-5 font-display text-5xl font-extrabold uppercase leading-[0.85] tracking-[-0.02em] sm:text-7xl">
              Your pigeon
              <br />
              is ready.
            </h2>
            <p className="mt-4 font-display text-2xl font-bold text-acid sm:text-3xl">
              Scan from your laptop.
            </p>

            <div className="mt-7 grid gap-2 sm:max-w-md">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1 border-2 border-paper/25 bg-paper/5 p-1.5">
                <span className="truncate pl-2 font-mono text-sm">{ROOM_URL}</span>
                <IconButton
                  label="Copy link"
                  onClick={onCopy}
                  className="text-paper hover:bg-paper/15 hover:text-paper"
                >
                  {copied ? <Check /> : <Copy />}
                </IconButton>
                <IconButton
                  label="Share"
                  onClick={onShare}
                  className="text-paper hover:bg-paper/15 hover:text-paper"
                >
                  <Share2 />
                </IconButton>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 bg-acid p-3 text-ink">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">{statusLabel}</p>
                  <p className="text-xs font-semibold text-ink/60">
                    Expires in {minutes}:{seconds}
                  </p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-paper">
                  {stage === "received" ? (
                    <Check />
                  ) : stage === "connected" ? (
                    <Wifi />
                  ) : (
                    <LoaderCircle className="animate-spin" />
                  )}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {stage === "ready" && (
                <Button
                  onClick={onConnect}
                  className="h-11 rounded-none border-2 border-paper bg-paper text-ink hover:bg-acid"
                >
                  <Laptop /> Preview receiver
                </Button>
              )}
              {stage === "connected" && (
                <Button
                  onClick={onReceive}
                  className="h-11 rounded-none border-2 border-acid bg-acid text-ink hover:bg-paper"
                >
                  <MonitorDown /> Complete transfer
                </Button>
              )}
              {stage === "received" && (
                <Button
                  onClick={onReset}
                  className="h-11 rounded-none border-2 border-acid bg-acid text-ink hover:bg-paper"
                >
                  <Plus /> Send another
                </Button>
              )}
              <Button
                onClick={onReset}
                variant="ghost"
                className="h-11 rounded-none text-paper/70 hover:bg-paper/10 hover:text-paper"
              >
                Cancel room
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[420px] rotate-1">
            <div className="border-4 border-acid bg-paper p-3 shadow-poster">
              <QrArt />
              <div className="mt-3 flex items-center justify-between border-t-2 border-ink pt-2 text-ink">
                <span className="font-mono text-xs font-bold">{ROOM_URL}</span>
                <span className="font-mono text-xs font-bold text-coral">
                  {minutes}:{seconds}
                </span>
              </div>
            </div>
            <span className="absolute -bottom-4 -right-3 -rotate-6 border-2 border-ink bg-coral px-3 py-1.5 font-display text-sm font-extrabold text-paper">
              POINT CAMERA HERE
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="col-span-12 border-2 border-ink bg-surface p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <span className="label">
              In the pouch · {files.length} {files.length === 1 ? "item" : "items"}
            </span>
            <span className="text-xs font-bold">
              {formatSize(files.reduce((sum, file) => sum + file.size, 0))}
            </span>
          </div>
          <div className="mt-4 space-y-2">
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
                </div>
                {receiverOpen ? (
                  <IconButton label={`Download ${file.name}`} onClick={() => onDownload(file.id)}>
                    {downloaded.includes(file.id) ? <Check /> : <Download />}
                  </IconButton>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink/40">
                    Waiting
                  </span>
                )}
              </div>
            ))}
          </div>
          {receiverOpen && (
            <Button
              onClick={onDownloadAll}
              className="mt-4 h-11 w-full rounded-none border-2 border-ink bg-ink text-paper hover:bg-cobalt"
            >
              <Download /> {downloaded.length === files.length ? "Downloaded" : "Download all"}
            </Button>
          )}
        </section>

        <section className="col-span-12 flex flex-col border-2 border-ink bg-coral p-5 text-paper lg:col-span-5">
          <span className="label text-paper/70">Laptop · receiver</span>
          {receiverOpen ? (
            <>
              <h3 className="mt-3 font-display text-4xl font-extrabold leading-none">
                Someone sent you something.
              </h3>
              <p className="mt-3 text-sm text-paper/85">
                Grab it from the list. The room disappears when the clock runs out.
              </p>
            </>
          ) : (
            <>
              <h3 className="mt-3 font-display text-4xl font-extrabold leading-none">
                Waiting on the other side.
              </h3>
              <p className="mt-3 text-sm text-paper/85">Scan the code and this side lights up.</p>
            </>
          )}
          <span className="mt-auto block w-28 self-end text-paper">
            <Pigeon
              mood={receiverOpen ? "done" : "waiting"}
              wingClass="fill-ink/30"
              beakClass="fill-acid"
            />
          </span>
        </section>
      </div>
    </div>
  );
}

function TransferVisual({ stage }: { stage: Stage }) {
  const activeIndex = stage === "received" ? 2 : ["ready", "connected"].includes(stage) ? 1 : 0;
  const labels = ["Tagged on phone", "In flight", "Landed on laptop"];
  return (
    <section className="flex min-h-64 flex-col border-2 border-ink bg-ink p-5 text-paper">
      <span className="label text-paper/50">The short route</span>
      <div className="my-7 flex items-center justify-between gap-3">
        <Smartphone className="h-7 w-7" />
        <span className="h-0.5 flex-1 bg-paper/20" />
        <span className={cn("w-16 text-cobalt", stage === "uploading" && "animate-pigeon")}>
          <Pigeon mood="flying" wingClass="fill-acid" beakClass="fill-coral" />
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

function PayloadPanel({
  files,
  totalSize,
  stage,
}: {
  files: Payload[];
  totalSize: number;
  stage: Stage;
}) {
  return (
    <section className="border-2 border-ink bg-acid p-5">
      <div className="flex items-center justify-between">
        <span className="label">Payload</span>
        <span className="text-xs font-bold">{files.length} files</span>
      </div>
      <div className="mt-5 space-y-3">
        {files.slice(0, 3).map((file) => (
          <div key={file.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
            <span className="truncate font-bold">{file.name}</span>
            <span className="shrink-0 text-ink/50">{formatSize(file.size)}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between border-t-2 border-ink pt-3 text-xs font-extrabold uppercase tracking-[0.12em]">
        <span>{stage === "received" ? "Delivered" : "Ready"}</span>
        <span>{formatSize(totalSize)}</span>
      </div>
    </section>
  );
}

function CampaignSections() {
  const oldWay = ["Open Gmail", "Login", "Compose", "Attach", "Send", "Open laptop", "Download"];
  return (
    <div>
      {/* POSTER — the stupid old way */}
      <section className="border-t-2 border-ink">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-20 sm:px-7 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <span className="label text-coral">A completely normal question</span>
            <h2 className="mt-4 max-w-[11ch] font-display text-[3.2rem] font-extrabold leading-[0.86] tracking-[-0.03em] sm:text-8xl">
              Why are you <span className="bg-coral px-2 text-paper">emailing</span> yourself?
            </h2>
          </div>
          <div className="lg:col-span-5">
            <div className="flex flex-wrap gap-2">
              {oldWay.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="border-2 border-ink bg-paper px-3 py-2 text-sm font-bold line-through decoration-coral decoration-2">
                    {step}
                  </span>
                  {index < oldWay.length - 1 && <span className="text-coral">→</span>}
                </div>
              ))}
            </div>
            <div className="mt-8 border-2 border-ink bg-cobalt p-6 text-paper">
              <p className="label text-paper/60">Or</p>
              <p className="mt-3 font-display text-4xl font-extrabold leading-none">
                Drop → Scan → Done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* POSTER — anything goes */}
      <section className="border-y-2 border-ink bg-coral px-4 py-20 text-paper sm:px-7 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="label text-paper/70">Anything goes</span>
            <h2 className="mt-4 max-w-[13ch] font-display text-[3rem] font-extrabold leading-[0.86] tracking-[-0.03em] sm:text-7xl">
              Anything you send to yourself, you can Pigeon.
            </h2>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Lecture slides", "A screenshot", "That one video", "A link", "Your ID scan"].map(
                (item) => (
                  <span key={item} className="border-2 border-paper px-3 py-1.5 text-sm font-bold">
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="relative min-h-[22rem] overflow-hidden border-2 border-ink bg-paper p-7">
            <div className="absolute left-7 top-7 grid h-28 w-18 place-items-center border-2 border-ink bg-ink px-3 text-paper">
              <Smartphone className="h-10 w-10" />
            </div>
            <div className="absolute bottom-7 right-7 grid h-40 w-60 place-items-center border-[6px] border-ink bg-surface">
              <Laptop className="h-16 w-16 text-ink" />
            </div>
            <span className="absolute left-[34%] top-[30%] w-44 -rotate-6 text-cobalt sm:w-56">
              <Pigeon
                mood="carrying"
                wingClass="fill-acid"
                beakClass="fill-coral"
                parcelClass="fill-coral"
              />
            </span>
            <div className="absolute bottom-6 left-6 border-2 border-ink bg-acid px-4 py-2 text-sm font-extrabold text-ink">
              Works the other way, too.
            </div>
          </div>
        </div>
      </section>

      {/* POSTER — three-beat manifesto */}
      <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-7 lg:py-28">
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
              t: "Scan",
              d: "Point your laptop camera. It lands. Then it disappears.",
              bg: "bg-cobalt",
              fg: "text-paper",
            },
          ].map((item) => (
            <div
              key={item.n}
              className={cn("relative overflow-hidden border-2 border-ink p-6", item.bg, item.fg)}
            >
              <span className="font-mono text-xs font-bold opacity-60">{item.n}</span>
              <h3 className="mt-6 font-display text-6xl font-extrabold leading-none">{item.t}</h3>
              <p className="mt-3 max-w-[26ch] text-sm opacity-80">{item.d}</p>
              <span className="pointer-events-none absolute -bottom-6 -right-6 w-28 rotate-12 opacity-25">
                <Pigeon mood="idle" wingClass="fill-acid" beakClass="fill-coral" />
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
