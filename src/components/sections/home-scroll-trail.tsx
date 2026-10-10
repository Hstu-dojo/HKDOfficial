"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type Geometry = { width: number; height: number; path: string };

// Original curves stay in the page gutters and cross between sections.
function buildTrail(width: number, height: number, boundaries: number[]) {
  const gutter = Math.max(16, (width - 1280) / 2);
  const radius = width < 640 ? 4 : Math.min(80, Math.max(18, gutter * 0.45));
  const inset = width < 640 ? 6 : Math.max(12, gutter / 2) + radius;
  const sideX = (right: boolean) => (right ? width - inset : inset);
  let right = true;
  let path = `M ${sideX(right)} 110`;
  const stops = [
    ...boundaries.filter((y) => y > 180 && y < height - 100),
    height,
  ];
  let start = 110;
  for (const end of stops) {
    const span = end - start;
    if (span < 100 && end !== height) continue;
    const x = sideX(right);
    const inward = right ? -1 : 1;
    const at = (amount: number) => x + inward * radius * amount;
    path += ` C ${at(1.8)} ${start + span * 0.12}, ${at(-0.65)} ${start + span * 0.25}, ${at(0.8)} ${start + span * 0.36}`;
    path += ` C ${at(2.3)} ${start + span * 0.48}, ${at(-0.7)} ${start + span * 0.5}, ${at(0)} ${start + span * 0.34}`;
    path += ` C ${at(-0.75)} ${start + span * 0.2}, ${at(1.7)} ${start + span * 0.65}, ${x} ${end === height ? height : end - 24}`;
    if (end < height - 20) {
      right = !right;
      const next = sideX(right);
      path += ` C ${x} ${end + 16}, ${next} ${end - 16}, ${next} ${end + 24}`;
      start = end + 24;
    }
  }
  return path;
}

export default function HomeScrollTrail({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const stroke = useRef<SVGPathElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const gradientId = `homepage-trail-${useId().replace(/:/g, "")}`;
  const [geometry, setGeometry] = useState<Geometry>({
    width: 1000,
    height: 4000,
    path: "",
  });

  useEffect(() => {
    const root = container.current;
    if (!root) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = root.clientWidth;
        const height = root.offsetHeight;
        if (!width || !height) return;
        const top = root.getBoundingClientRect().top;
        const boundaries = Array.from(
          root.querySelectorAll<HTMLElement>(
            ":scope > section, :scope > main > [data-home-sections] > section",
          ),
        )
          .slice(1)
          .map((section) => section.getBoundingClientRect().top - top);
        const path = buildTrail(width, height, boundaries);
        setGeometry((previous) =>
          previous.width === width &&
          previous.height === height &&
          previous.path === path
            ? previous
            : { width, height, path },
        );
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root
      .querySelectorAll(
        ":scope > section, :scope > main > [data-home-sections] > section",
      )
      .forEach((section) => observer.observe(section));
    window.addEventListener("resize", measure);
    measure();
    let active = true;
    document.fonts?.ready.then(() => {
      if (active) measure();
    });
    return () => {
      active = false;
      observer.disconnect();
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const root = container.current;
    const path = stroke.current;
    if (!root || !path || !geometry.path) return;
    const length = path.getTotalLength();
    // Arc length is not proportional to height: loops must finish where they appear.
    // Map the path's downward frontier to its drawn length so its head stays in view.
    const samples = Array.from({ length: 1201 }, (_, i) => ({
      progress: i / 1200,
      y: path.getPointAtLength((length * i) / 1200).y,
    }));
    let frontier = 0;
    samples.forEach((sample) => {
      frontier = Math.max(frontier, sample.y);
      sample.y = frontier;
    });
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const paint = () => {
      frame = 0;
      const scrollTop = Math.max(0, window.scrollY);
      const maxScroll = Math.max(
        0,
        (document.scrollingElement?.scrollHeight ??
          document.documentElement.scrollHeight) - window.innerHeight,
      );
      const pageProgress =
        maxScroll > 0 ? Math.min(1, scrollTop / maxScroll) : 0;
      // Start with no drawn length, then reach the final point at page bottom.
      const readHead =
        samples[0].y + pageProgress * (geometry.height - samples[0].y);
      let progress = 0;
      if (scrollTop > 0 && (media.matches || scrollTop >= maxScroll - 1))
        progress = 1;
      else if (scrollTop > 0 && readHead > samples[0].y) {
        let low = 0,
          high = samples.length - 1;
        while (low < high) {
          const middle = Math.floor((low + high) / 2);
          if (samples[middle].y < readHead) low = middle + 1;
          else high = middle;
        }
        const current = samples[low];
        const previous = samples[Math.max(0, low - 1)];
        const fraction =
          current.y > previous.y
            ? (readHead - previous.y) / (current.y - previous.y)
            : 1;
        progress =
          previous.progress + (current.progress - previous.progress) * fraction;
      }
      progress = Math.max(0, Math.min(1, progress));
      path.style.strokeDashoffset = String(1 - progress);
      path.dataset.scrollTrailProgress = progress.toFixed(4);
      if (overlay.current)
        overlay.current.style.visibility = progress > 0 ? "visible" : "hidden";
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    paint();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
      cancelAnimationFrame(frame);
    };
  }, [geometry]);

  return (
    <div ref={container} className="relative isolate" data-home-scroll-trail>
      {children}
      <div
        ref={overlay}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        style={{ visibility: "hidden" }}
      >
        <svg
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          preserveAspectRatio="none"
          fill="none"
          className="h-full w-full"
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0"
              y1="0"
              x2="0"
              y2={geometry.height}
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="hsl(var(--primary))" />
              <stop offset="0.5" stopColor="hsl(var(--secondary))" />
              <stop offset="1" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>
          <path
            d={geometry.path}
            stroke={`url(#${gradientId})`}
            strokeWidth="2"
            opacity="0.08"
          />
          <path
            ref={stroke}
            d={geometry.path}
            pathLength="1"
            stroke={`url(#${gradientId})`}
            strokeWidth={geometry.width < 640 ? 5 : 10}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1 1"
            style={{ strokeDashoffset: 1 }}
            opacity="0.8"
          />
        </svg>
      </div>
    </div>
  );
}
