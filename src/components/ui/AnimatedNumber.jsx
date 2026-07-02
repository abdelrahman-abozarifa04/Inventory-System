import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * AnimatedNumber — the "telemetry" instrument readout.
 *
 * Two distinct motions, both purposeful (never decorative):
 *   1. Boot count-up: the first time a real value arrives (after the
 *      skeleton), the digit rolls up from 0 — instruments coming online.
 *      Fires once per mount.
 *   2. Change pulse: on every subsequent live value change (Firestore
 *      onSnapshot), the number rolls to its new value and a single cyan
 *      ring blooms out and settles — "the control room acknowledges a
 *      change, then goes calm." This is the one signature motion the
 *      design system reserves cyan glow for (Glow-Is-A-State).
 *
 * Reduced motion: value updates instantly, no roll, no pulse. Honors the
 * OS setting via useReducedMotion (also wired app-wide by MotionConfig).
 *
 * @param {number} value        current value (may change over time)
 * @param {(n:number)=>string|number} [format]  render transform, e.g. locale grouping
 * @param {string} [pulseColor] telemetry ring color (default Live Cyan)
 */
const AnimatedNumber = ({ value, format = (n) => n, className, pulseColor = "rgba(6, 182, 212, 0.9)" }) => {
  const reduce = useReducedMotion();
  const safeValue = Number.isFinite(value) ? value : 0;

  const [display, setDisplay] = useState(safeValue);
  const [pulseKey, setPulseKey] = useState(0);
  const prev = useRef(safeValue);
  const isFirst = useRef(true);

  useEffect(() => {
    const from = prev.current;
    if (from === safeValue) return;

    const firstArrival = isFirst.current;
    isFirst.current = false;
    prev.current = safeValue;

    // Instant for reduced-motion users — no roll, no pulse.
    if (reduce) {
      setDisplay(safeValue);
      return;
    }

    // Acknowledge live changes only; the boot count-up isn't a "change".
    if (!firstArrival) setPulseKey((k) => k + 1);

    const delta = Math.abs(safeValue - from);
    const controls = animate(from, safeValue, {
      // Short, bounded: ~250ms floor, never past the 800ms entrance ceiling.
      duration: Math.min(0.8, 0.25 + delta * 0.03),
      ease: [0.16, 1, 0.3, 1], // ease-out-expo — confident, decisive
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [safeValue, reduce]);

  const rendered = format(Math.round(display));

  return (
    <span className={cn("relative inline-flex items-center justify-center tabular-nums", className)}>
      {/* Telemetry ring — remounts on each change so the bloom retriggers cleanly. */}
      {pulseKey > 0 && (
        <span
          key={pulseKey}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 rounded-full"
          style={{
            boxShadow: `0 0 0 2px ${pulseColor}`,
            animation: "telemetry-pulse 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        />
      )}
      <span>{rendered}</span>
    </span>
  );
};

export default AnimatedNumber;
