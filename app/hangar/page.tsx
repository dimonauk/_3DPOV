"use client";

import { CustomCursor } from "components/hangar/CustomCursor";
import { HangarHero } from "components/hangar/HangarHero";
import { HangarNav } from "components/hangar/HangarNav";
import { useState } from "react";

export default function HangarPage() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <>
      <CustomCursor />
      <HangarNav activeId={activeTab} onNavigate={setActiveTab} />

      <main>
        {activeTab === "home" && (
          <div className="animate-[fi_0.3s_ease]">
            <HangarHero />

            <div className="p-[36px_60px] border-b border-[rgba(10,10,15,0.1)]">
              <div className="text-[10px] tracking-[0.25em] text-[var(--dim)] uppercase mb-[8px]">
                What this is
              </div>
              <p className="text-[12px] leading-[2.1] max-w-[680px] text-[var(--dim)] mt-[8px]">
                The Hangar is a pnpm monorepo at{" "}
                <code className="font-mono text-[10px] bg-[rgba(10,10,15,0.06)] px-[5px] py-[1px]">
                  D:\The_Hangar
                </code>{" "}
                containing every project, pipeline, and experiment. It runs on
                Chonky — a Windows workstation with an RTX 3080 Ti. Aura, my
                digital twin, lives inside it at{" "}
                <code className="font-mono text-[10px] bg-[rgba(10,10,15,0.06)] px-[5px] py-[1px]">
                  localhost:5173
                </code>
                . She is always listening.
              </p>

              <div className="flex flex-wrap gap-[5px] mt-[14px]">
                {[
                  "WebGPU",
                  "Three.js 0.182",
                  "R3F 9",
                  "Python / FastAPI",
                  "Blender 5.1",
                  "Ollama local LLM",
                  "Elegoo Saturn 4",
                  "Azure Kinect",
                  "DaVinci Resolve 21β",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-[8px] tracking-[0.1em] uppercase py-[3px] px-[10px] border border-[rgba(10,10,15,0.18)] text-[var(--dim)] cursor-default transition-all duration-150 hover:border-[var(--acc)] hover:text-[var(--acc)]"
                  >
                    {tag}
                  </span>
                ))}
                <span className="text-[8px] tracking-[0.1em] uppercase py-[3px] px-[10px] border border-[rgba(10,10,15,0.18)] text-[var(--dim)] cursor-pointer transition-all duration-150 hover:border-[var(--acc)] hover:text-[var(--acc)]">
                  Chonky ↗
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[1px] bg-[rgba(10,10,15,0.1)]">
              <div className="bg-[var(--paper)] p-[28px_24px] transition-colors duration-150 relative overflow-hidden cursor-default hover:bg-[var(--warm)] group">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--acc)]" />
                <div className="text-[8px] tracking-[0.2em] uppercase text-[var(--dim)] mb-[10px]">
                  Visual work
                </div>
                <div className="font-syne text-[17px] font-bold mb-[8px] leading-[1.15]">
                  Gallery
                </div>
                <div className="text-[10px] leading-[1.85] text-[var(--dim)]">
                  Sculptures, jewellery renders, light paintings, poi trails,
                  system UIs.
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab !== "home" && (
          <div className="p-[44px_60px]">
            <h2 className="font-syne text-[clamp(26px,4vw,40px)] font-extrabold">
              {activeTab.toUpperCase()}
            </h2>
            <p className="text-[11px] text-[var(--dim)] mt-[10px]">
              Component breakdown coming next.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
