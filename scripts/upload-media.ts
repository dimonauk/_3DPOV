#!/usr/bin/env tsx
/**
 * upload-media.ts
 *
 * Path 1 of the Holoflow Studio media-upload pipeline. Takes a folder
 * of files and stages them under `public/<subject>/<slug>/`, writing a
 * Media-shaped sidecar JSON next to each file plus a Markdown index.
 *
 * This is the lightweight, repo-committable path — files end up in git
 * and ship with the static build. The forthcoming admin UI will push
 * into Vercel Blob + Firestore via the `mediaUpload` capability; the
 * sidecar JSON here is shaped to match `Media` so a migration script
 * can later promote these records.
 *
 * Run:
 *   pnpm exec tsx scripts/upload-media.ts <source-folder> \
 *     --subject <subject> --slug <slug> \
 *     [--kind <kind>] [--captured <iso-date>] [--dry-run]
 *
 * No new npm packages. Node built-ins only (fs/promises, crypto,
 * child_process for `git config user.email`). Requires Node 18+.
 */

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { argv, cwd, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";

// --- Type mirrors (from lib/capabilities/media/library-types.ts) -----------
// We mirror rather than import to keep this script free of project
// path-alias resolution; if that file changes shape, update here.

type MediaKind =
  | "photo"
  | "photo-single-exposure"
  | "video"
  | "360-photo"
  | "360-video"
  | "sbs-stereo-mp4"
  | "usdz"
  | "glb"
  | "ply"
  | "audio"
  | "pdf"
  | "other";

type MediaSubject =
  | "photograph"
  | "aerial"
  | "holo-walk"
  | "codex"
  | "article"
  | "journal"
  | "tutorial"
  | "product"
  | "rookery"
  | "press"
  | "other";

const SUBJECTS: readonly MediaSubject[] = [
  "photograph",
  "aerial",
  "holo-walk",
  "codex",
  "article",
  "journal",
  "tutorial",
  "product",
  "rookery",
  "press",
  "other",
] as const;

const KINDS: readonly MediaKind[] = [
  "photo",
  "photo-single-exposure",
  "video",
  "360-photo",
  "360-video",
  "sbs-stereo-mp4",
  "usdz",
  "glb",
  "ply",
  "audio",
  "pdf",
  "other",
] as const;

type MediaSidecar = {
  id: string;
  kind: MediaKind;
  subject: MediaSubject;
  source: "public-static";
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  capturedAt?: string;
};

// --- CLI parsing -----------------------------------------------------------

type CliFlags = {
  sourceFolder: string;
  subject: MediaSubject;
  slug: string;
  kind: MediaKind | null;
  capturedAt: string | null;
  dryRun: boolean;
};

function isSubject(v: string): v is MediaSubject {
  return (SUBJECTS as readonly string[]).includes(v);
}

function isKind(v: string): v is MediaKind {
  return (KINDS as readonly string[]).includes(v);
}

function isKebabCase(s: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
}

function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(
    s,
  );
}

function requireNext(args: string[], i: number, name: string): string {
  const next = args[i + 1];
  if (!next) throw new Error(`${name} requires a value`);
  return next;
}

function parseFlags(args: string[]): CliFlags {
  let sourceFolder: string | null = null;
  let subject: MediaSubject | null = null;
  let slug: string | null = null;
  let kind: MediaKind | null = null;
  let capturedAt: string | null = null;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === undefined) continue;
    if (a === "--help" || a === "-h") {
      printHelp();
      exit(0);
    } else if (a === "--subject") {
      const v = requireNext(args, i, "--subject");
      if (!isSubject(v)) {
        throw new Error(
          `--subject must be one of: ${SUBJECTS.join(", ")} (got ${v})`,
        );
      }
      subject = v;
      i++;
    } else if (a === "--slug") {
      slug = requireNext(args, i, "--slug");
      i++;
    } else if (a === "--kind") {
      const v = requireNext(args, i, "--kind");
      if (!isKind(v)) {
        throw new Error(
          `--kind must be one of: ${KINDS.join(", ")} (got ${v})`,
        );
      }
      kind = v;
      i++;
    } else if (a === "--captured") {
      const v = requireNext(args, i, "--captured");
      if (!isISODate(v)) {
        throw new Error(`--captured must be an ISO date (got ${v})`);
      }
      capturedAt = v;
      i++;
    } else if (a === "--dry-run") {
      dryRun = true;
    } else if (a.startsWith("--")) {
      throw new Error(`Unknown flag ${a}`);
    } else if (sourceFolder === null) {
      sourceFolder = a;
    } else {
      throw new Error(`Unexpected positional argument ${a}`);
    }
  }

  if (sourceFolder === null) throw new Error("source-folder is required");
  if (subject === null) throw new Error("--subject is required");
  if (slug === null) throw new Error("--slug is required");
  if (!isKebabCase(slug)) {
    throw new Error(
      `--slug must be kebab-case (lowercase a-z, 0-9, hyphens; got ${slug})`,
    );
  }

  return { sourceFolder, subject, slug, kind, capturedAt, dryRun };
}

function printHelp(): void {
  stdout.write(
    [
      "upload-media — stage files under public/<subject>/<slug>/ with Media sidecars",
      "",
      "Usage:",
      "  pnpm exec tsx scripts/upload-media.ts <source-folder> \\",
      "    --subject <subject> --slug <slug> \\",
      "    [--kind <kind>] [--captured <iso-date>] [--dry-run]",
      "",
      "Flags:",
      "  --subject <s>     One of: " + SUBJECTS.join(", "),
      "  --slug <s>        Kebab-case slug, names the output folder",
      "  --kind <k>        Optional: " + KINDS.join(", ") + " (else inferred)",
      "  --captured <iso>  Optional ISO date the media was captured",
      "  --dry-run         Print plan, write nothing",
      "  --help            This help",
      "",
    ].join("\n"),
  );
}

// --- Inference + sanitisation ---------------------------------------------

const EXT_KIND: Record<string, MediaKind> = {
  ".jpg": "photo",
  ".jpeg": "photo",
  ".png": "photo",
  ".webp": "photo",
  ".avif": "photo",
  ".heic": "photo",
  ".heif": "photo",
  ".mp4": "video",
  ".webm": "video",
  ".mov": "video",
  ".m4v": "video",
  ".glb": "glb",
  ".ply": "ply",
  ".wav": "audio",
  ".mp3": "audio",
  ".opus": "audio",
  ".flac": "audio",
  ".pdf": "pdf",
  ".usdz": "usdz",
};

const EXT_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".glb": "model/gltf-binary",
  ".ply": "application/octet-stream",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".opus": "audio/opus",
  ".flac": "audio/flac",
  ".pdf": "application/pdf",
  ".usdz": "model/vnd.usdz+zip",
};

function inferKind(filename: string): MediaKind {
  const ext = extname(filename).toLowerCase();
  return EXT_KIND[ext] ?? "other";
}

function inferMime(filename: string): string {
  const ext = extname(filename).toLowerCase();
  return EXT_MIME[ext] ?? "application/octet-stream";
}

function sanitiseFilename(name: string): string {
  const ext = extname(name).toLowerCase();
  const stem = name.slice(0, name.length - ext.length);
  const cleanStem =
    stem
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "file";
  return `${cleanStem}${ext}`;
}

function uuid(): string {
  // RFC4122 v4-ish; sufficient for sidecar ids and avoids crypto.randomUUID
  // typing edge cases on older @types/node.
  const bytes = createHash("sha256")
    .update(`${Date.now()}-${Math.random()}-${process.pid}`)
    .digest();
  const b = Array.from(bytes.subarray(0, 16));
  if (b[6] !== undefined) b[6] = (b[6] & 0x0f) | 0x40;
  if (b[8] !== undefined) b[8] = (b[8] & 0x3f) | 0x80;
  const hex = b.map((n) => n.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function sha256OfFile(path: string): Promise<string> {
  const buf = await readFile(path);
  return createHash("sha256").update(buf).digest("hex");
}

function gitUserEmail(projectRoot: string): string {
  try {
    return execSync("git config user.email", {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

// --- Main ------------------------------------------------------------------

async function main(): Promise<void> {
  const flags = parseFlags(argv.slice(2));
  const here = dirname(fileURLToPath(import.meta.url));
  const projectRoot = resolve(here, "..");
  const sourceAbs = resolve(cwd(), flags.sourceFolder);

  let srcStat;
  try {
    srcStat = await stat(sourceAbs);
  } catch {
    stderr.write(`upload-media: source folder not found: ${sourceAbs}\n`);
    exit(1);
    return;
  }
  if (!srcStat.isDirectory()) {
    stderr.write(`upload-media: ${sourceAbs} is not a directory\n`);
    exit(1);
    return;
  }

  const allEntries = await readdir(sourceAbs, { withFileTypes: true });
  const files = allEntries.filter((e) => e.isFile()).map((e) => e.name);
  if (files.length === 0) {
    stderr.write(`upload-media: no files in ${sourceAbs}\n`);
    exit(1);
    return;
  }

  const targetDir = resolve(
    projectRoot,
    "public",
    flags.subject,
    flags.slug,
  );

  stdout.write(`upload-media: source = ${sourceAbs}\n`);
  stdout.write(`upload-media: target = ${targetDir}\n`);
  stdout.write(`upload-media: ${files.length} file(s) to import\n`);
  if (flags.dryRun) stdout.write("upload-media: DRY RUN — no files written\n");

  if (!flags.dryRun) {
    await mkdir(targetDir, { recursive: true });
  }

  const uploadedBy = `cli:${gitUserEmail(projectRoot)}`;
  const uploadedAt = new Date().toISOString();
  const indexLines: string[] = [
    `# ${flags.subject}/${flags.slug}`,
    "",
    `Imported ${uploadedAt} by ${uploadedBy} via scripts/upload-media.ts.`,
    "",
    "| File | Kind | Size | sha256 |",
    "| --- | --- | --- | --- |",
  ];

  let totalBytes = 0;
  for (const name of files) {
    if (name.endsWith(".meta.json") || name === "_INDEX.md") continue;
    const srcFile = join(sourceAbs, name);
    const fileStat = await stat(srcFile);
    const sanitised = sanitiseFilename(name);
    const destFile = join(targetDir, sanitised);
    const kind = flags.kind ?? inferKind(name);
    const mimeType = inferMime(name);
    const sha = flags.dryRun ? "(dry-run)" : await sha256OfFile(srcFile);

    const sidecar: MediaSidecar = {
      id: uuid(),
      kind,
      subject: flags.subject,
      source: "public-static",
      url: `/${flags.subject}/${flags.slug}/${sanitised}`,
      uploadedAt,
      uploadedBy,
      mimeType,
      sizeBytes: fileStat.size,
      sha256: sha,
      ...(flags.capturedAt ? { capturedAt: flags.capturedAt } : {}),
    };

    if (!flags.dryRun) {
      await copyFile(srcFile, destFile);
      await writeFile(
        `${destFile}.meta.json`,
        JSON.stringify(sidecar, null, 2) + "\n",
      );
    }

    totalBytes += fileStat.size;
    indexLines.push(
      `| \`${sanitised}\` | ${kind} | ${fileStat.size} B | \`${sha.slice(0, 12)}…\` |`,
    );
    stdout.write(
      `  ${flags.dryRun ? "[dry-run] " : ""}${name} -> ${sanitised} (${kind}, ${fileStat.size} B)\n`,
    );
  }

  const indexPath = join(targetDir, "_INDEX.md");
  if (!flags.dryRun) {
    await writeFile(indexPath, indexLines.join("\n") + "\n");
  }

  stdout.write(
    `\nupload-media: done. files=${files.length} bytes=${totalBytes} target=${targetDir}\n`,
  );
  if (!flags.dryRun) {
    stdout.write(`upload-media: index written to ${indexPath}\n`);
    stdout.write(
      `Next: review ${indexPath} and the .meta.json sidecars, then commit public/${flags.subject}/${flags.slug}/.\n`,
    );
  }
}

main().catch((err: unknown) => {
  stderr.write(`upload-media: fatal — ${(err as Error).message}\n`);
  exit(1);
});
