"use client";

/**
 * The scrolling feature strip.
 *
 * Animation is a single CSS transform on a duplicated track, paused when the
 * reader prefers reduced motion or hovers. No layout properties are animated,
 * which is what keeps it off the main thread.
 */

const ITEMS = [
  { label: "ORM", detail: "models, relations, migrations" },
  { label: "Auth", detail: "JWT sessions, scoped tokens" },
  { label: "Cache", detail: "content-addressed, verified" },
  { label: "Queue", detail: "durable jobs" },
  { label: "Scheduler", detail: "cron in the language" },
  { label: "Metrics", detail: "counters, latency, health" },
  { label: "WebSockets", detail: "socket, connect, message" },
  { label: "Registry", detail: "publish, sign, mirror" },
  { label: "Docker", detail: "one static binary" },
  { label: "Incremental", detail: "reparse only what changed" },
];

export function FeatureMarquee() {
  return (
    <section className="relative overflow-hidden py-14" aria-label="Platform features">
      <div
        className="flex w-max animate-[marquee_38s_linear_infinite] gap-3 hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)" }}
      >
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 gap-3" aria-hidden={copy === 1}>
            {ITEMS.map((item) => (
              <li
                key={`${copy}-${item.label}`}
                className="flex w-max items-baseline gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
              >
                <span className="text-[13px] font-semibold">{item.label}</span>
                <span className="text-[13px] text-[var(--ink-subtle)]">{item.detail}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </section>
  );
}
