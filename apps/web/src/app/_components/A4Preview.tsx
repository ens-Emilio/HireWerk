"use client";

import { useState } from "react";

export default function A4Preview() {
  const [zoom, setZoom] = useState<1 | 0.75>(1);

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setZoom(1)}
          className={`h-8 rounded-md border px-2 text-xs ${zoom === 1 ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"}`}
          aria-pressed={zoom === 1}
        >
          100%
        </button>
        <button
          type="button"
          onClick={() => setZoom(0.75)}
          className={`h-8 rounded-md border px-2 text-xs ${zoom === 0.75 ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"}`}
          aria-pressed={zoom === 0.75}
        >
          75%
        </button>
      </div>

      <div className="a4-preview">
        <div style={{ width: "100%", height: "100%", transform: `scale(${zoom})`, transformOrigin: "top left" }}>
          <div className="a4-page">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full" style={{ backgroundColor: "#e5e7eb" }} />
              <div>
                <h1>João Silva</h1>
                <div className="muted" style={{ fontSize: 11 }}>Desenvolvedor Frontend</div>
              </div>
            </div>

            <div className="mt-4 space-y-1 subtle" style={{ fontSize: 11 }}>
              <div>• 5+ anos construindo apps com React e TypeScript</div>
              <div>• Liderou migração para Next.js, reduzindo TTFB em 40%</div>
              <div>• Focado em performance, acessibilidade e DX</div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip">React</span>
              <span className="chip">Next.js</span>
              <span className="chip">TypeScript</span>
              <span className="chip">Tailwind</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div style={{ border: "1px solid #e5e7eb" }} className="rounded-md p-3">
                <h2>Experiência</h2>
                <div>Frontend Pleno — Acme</div>
                <div className="muted" style={{ fontSize: 11 }}>2022–Atual</div>
              </div>
              <div style={{ border: "1px solid #e5e7eb" }} className="rounded-md p-3">
                <h2>Educação</h2>
                <div>Bacharel em Sistemas de Informação</div>
                <div className="muted" style={{ fontSize: 11 }}>USP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
