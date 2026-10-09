"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Each scene owns only its marked elements; existing Framer controls stay intact. */
export function useEditorialScene(root: RefObject<HTMLElement>, kind: "hero" | "photos") {
  useEffect(() => {
    if (!root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add({ desktop: "(min-width: 1024px) and (min-height: 900px)", compact: "(max-width: 1023px), (max-height: 899px)", motion: "(prefers-reduced-motion: no-preference)" }, (context) => {
      if (!context.conditions?.motion) return;
      const scope = root.current!;
      if (kind === "hero") {
        const canvas = scope.querySelector<HTMLElement>("[data-scene-canvas]");
        const photo = scope.querySelector("[data-scene-photo]");
        const copy = scope.querySelector("[data-scene-copy]");
        if (!canvas || !photo || !copy) return;
        gsap.fromTo(canvas, { clipPath: "inset(4% 3% 4% 3% round 32px)" }, { clipPath: "inset(0% 0% 0% 0% round 24px)", duration: 1.1, ease: "power3.out", clearProps: "clipPath" });
        gsap.fromTo(copy.children, { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.9, ease: "power3.out", clearProps: "opacity,visibility" });
        const canPin = context.conditions?.desktop && canvas.offsetHeight < window.innerHeight - 136;
        if (canPin) {
          gsap.timeline({ scrollTrigger: { trigger: canvas, start: "top 112px", end: "+=420", pin: true, scrub: 0.8, invalidateOnRefresh: true } })
            .fromTo(photo, { scale: 1.24, yPercent: 0 }, { scale: 1, yPercent: -3, ease: "none" }, 0)
            .to(canvas, { scale: 0.95, borderRadius: "40px", ease: "none" }, 0)
            .to(copy, { y: -28, ease: "none" }, 0);
        } else {
          gsap.fromTo(photo, { scale: 1.18, yPercent: -3 }, { scale: 1.04, yPercent: 3, ease: "none", scrollTrigger: { trigger: scope, start: "top top", end: "bottom top", scrub: 0.8 } });
        }
      } else {
        const cards = scope.querySelectorAll<HTMLElement>("[data-scene-card]");
        cards.forEach((card, index) => {
          gsap.fromTo(card, { y: context.conditions?.desktop ? 60 + index * 24 : 30 }, { y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 92%", end: "top 45%", scrub: 0.8 } });
          const image = card.querySelector("[data-scene-photo]");
          if (image) gsap.fromTo(image, { scale: 1.14, yPercent: -3 }, { scale: 1.02, yPercent: 3, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 0.8 } });
        });
      }
    }, root.current);
    // Refresh after the bundled fonts have settled without keeping stale route effects.
    let mounted = true;
    document.fonts?.ready.then(() => { if (mounted) ScrollTrigger.refresh(); });
    return () => { mounted = false; media.revert(); };
  }, [root, kind]);
}
