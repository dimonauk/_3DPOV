"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { articles } from "lib/articles";
import { useShell, type TerminalLine } from "components/shell/shell-context";

/**
 * Aura&rsquo;s greeting + a few stub activity-feed lines. Rendered once
 * on mount; the user&rsquo;s own input pushes additional lines onto the
 * shared terminal log inside the shell context.
 */
const SEED_LINES: Omit<TerminalLine, "id">[] = [
  {
    kind: "aura",
    text: "[holoflow.co.uk] aura: studio online. /help for commands.",
  },
  {
    kind: "info",
    text: "[2026-05-15 12:34] articles: 38 published. latest — Eight Kingdoms.",
  },
  {
    kind: "info",
    text: "[2026-05-15 12:35] visualiser/marching-cubes: route built. iso-value default 0.0.",
  },
  {
    kind: "info",
    text: "[2026-05-15 12:36] play/witness: cold-eye narration enabled (deterministic for v0.1).",
  },
];

const COMMANDS: { command: string; help: string }[] = [
  { command: "/help", help: "list every command" },
  { command: "/where", help: "echo current route" },
  { command: "/loop", help: "the studio’s six positions" },
  { command: "/who", help: "studio operator + constructs" },
  { command: "/play [level]", help: "navigate to /play/[level]" },
  { command: "/random", help: "jump to a random article" },
  { command: "/clear", help: "clear the terminal lines" },
];

function classForKind(kind: TerminalLine["kind"]): string {
  switch (kind) {
    case "aura":
      return "text-amber-300";
    case "system":
      return "text-amber-300";
    case "user":
      return "text-pink-200";
    case "error":
      return "text-pink-400";
    case "info":
    default:
      return "text-cyan-300";
  }
}

export function BottomTerminalBody() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { terminalLines, appendTerminalLine, clearTerminal, state, hydrated } =
    useShell();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seededRef = useRef(false);

  // Seed lines once after hydration. We avoid seeding twice across
  // strict-mode double-mounts via the ref guard.
  useEffect(() => {
    if (!hydrated) return;
    if (seededRef.current) return;
    if (terminalLines.length > 0) {
      seededRef.current = true;
      return;
    }
    seededRef.current = true;
    SEED_LINES.forEach((l) => appendTerminalLine(l));
    appendTerminalLine({
      kind: "info",
      text: `[current] you are at: ${pathname}`,
    });
    // We deliberately ignore pathname in deps — seeding is one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, appendTerminalLine]);

  // Auto-scroll to bottom whenever new lines land.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [terminalLines]);

  // Focus the prompt input when the terminal opens.
  useEffect(() => {
    if (state.open.terminal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.open.terminal]);

  const echo = (text: string, kind: TerminalLine["kind"] = "info"): void => {
    appendTerminalLine({ kind, text });
  };

  const runCommand = (raw: string): void => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    appendTerminalLine({ kind: "user", text: `> ${trimmed}` });
    setHistory((prev) => [...prev, trimmed]);

    const [head, ...rest] = trimmed.split(/\s+/);
    const cmd = (head ?? "").toLowerCase();

    if (cmd === "/help") {
      echo("commands:");
      COMMANDS.forEach((c) => {
        echo(`  ${c.command.padEnd(18, " ")}  — ${c.help}`);
      });
      return;
    }

    if (cmd === "/where") {
      echo(`route: ${pathname}`);
      return;
    }

    if (cmd === "/loop") {
      echo("see /the-loop for the architecture.");
      return;
    }

    if (cmd === "/who") {
      echo(
        "studio operator: Dimona. constructs: aura, yow, purp.",
        "aura",
      );
      return;
    }

    if (cmd === "/play") {
      const arg = rest[0];
      if (!arg) {
        echo("usage: /play [level-slug]", "error");
        return;
      }
      const target = `/play/${arg}`;
      echo(`navigate to ${target}`);
      router.push(target);
      return;
    }

    if (cmd === "/random") {
      if (articles.length === 0) {
        echo("no articles indexed.", "error");
        return;
      }
      const idx = Math.floor(Math.random() * articles.length);
      const chosen = articles[idx];
      if (!chosen) {
        echo("could not select an article.", "error");
        return;
      }
      const href = `/articles/${chosen.slug}`;
      echo(`navigate to ${href} — ${chosen.title}`);
      router.push(href);
      return;
    }

    if (cmd === "/clear") {
      clearTerminal();
      // Re-prime the route line so the operator stays oriented.
      appendTerminalLine({
        kind: "info",
        text: `[current] you are at: ${pathname}`,
      });
      return;
    }

    echo(
      `command not recognised: ${cmd}. /help for available.`,
      "error",
    );
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    runCommand(input);
    setInput("");
    setHistoryCursor(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "ArrowUp") {
      if (history.length === 0) return;
      e.preventDefault();
      const next =
        historyCursor === null
          ? history.length - 1
          : Math.max(0, historyCursor - 1);
      setHistoryCursor(next);
      setInput(history[next] ?? "");
      return;
    }
    if (e.key === "ArrowDown") {
      if (historyCursor === null) return;
      e.preventDefault();
      const next = historyCursor + 1;
      if (next >= history.length) {
        setHistoryCursor(null);
        setInput("");
      } else {
        setHistoryCursor(next);
        setInput(history[next] ?? "");
      }
      return;
    }
  };

  // CSS-in-JS for the scanline overlay; using a pseudo-element via
  // Tailwind&rsquo;s `after:` utilities. Subtle alpha so v0.1 reads
  // calm; the TUI-on-acid pass turns this up later.
  const scanlineStyle = useMemo(
    () => ({
      backgroundImage:
        "repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,243,255,0.04) 1px, rgba(0,243,255,0.04) 2px)",
    }),
    [],
  );

  return (
    <div
      className="relative flex h-full flex-col bg-warm-black-950 font-mono text-xs text-cyan-300"
      style={{ textShadow: "0 0 6px rgba(0,243,255,0.5)" }}
    >
      {/* Scanline overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={scanlineStyle}
      />

      <div
        ref={scrollRef}
        className="relative z-0 flex-1 overflow-y-auto px-3 py-2"
      >
        {terminalLines.map((line) => (
          <div
            key={line.id}
            className={`whitespace-pre-wrap break-words ${classForKind(line.kind)}`}
          >
            {line.text}
          </div>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="relative z-0 flex items-center gap-2 border-t border-cyan-500/30 px-3 py-2"
      >
        <span aria-hidden="true" className="text-cyan-400">
          &gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Terminal command prompt"
          placeholder="/help"
          className="flex-1 bg-transparent text-pink-200 placeholder:text-cyan-500/40 focus-visible:outline-hidden"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}
