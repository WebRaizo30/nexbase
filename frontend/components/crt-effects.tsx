"use client";

/**
 * CRT overlays inside `.crt-content` (position relative). Scanlines + vignette sit under UI (`z-0`).
 */
export function CrtEffects() {
  return (
    <div className="crt-beam-flicker pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="crt-layer-inner crt-scanlines" />
      <div className="crt-layer-inner crt-vignette" />
      <div className="crt-layer-inner crt-noise" />
      <div className="crt-layer-inner crt-aberration" />
    </div>
  );
}
