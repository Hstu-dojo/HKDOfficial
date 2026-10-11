import type { CSSProperties } from "react";
export function orgTheme(hex?: string | null): CSSProperties | undefined {
  if (!hex || !/^#(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(hex)) return;
  let raw = hex.slice(1);
  if (raw.length === 3)
    raw = raw
      .split("")
      .map((c) => c + c)
      .join("");
  const [r, g, b] = [0, 2, 4].map(
      (i) => parseInt(raw.slice(i, i + 2), 16) / 255,
    ),
    max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min,
    l = (max + min) / 2;
  const s = delta ? delta / (1 - Math.abs(2 * l - 1)) : 0;
  const h = !delta
    ? 0
    : max === r
      ? 60 * ((g - b) / delta + (g < b ? 6 : 0))
      : max === g
        ? 60 * ((b - r) / delta + 2)
        : 60 * ((r - g) / delta + 4);
  // Bright hues (especially yellow) need more than a fixed lightness cap for white button text.
  let light = Math.min(l, 0.38);
  const luminance = (level: number) => {
    const chroma = (1 - Math.abs(2 * level - 1)) * s,
      x = chroma * (1 - Math.abs(((h / 60) % 2) - 1)),
      m = level - chroma / 2;
    const rgb =
      h < 60
        ? [chroma, x, 0]
        : h < 120
          ? [x, chroma, 0]
          : h < 180
            ? [0, chroma, x]
            : h < 240
              ? [0, x, chroma]
              : h < 300
                ? [x, 0, chroma]
                : [chroma, 0, x];
    return rgb
      .map((v) => v + m)
      .map((v) =>
        v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
      )
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  };
  while (light > 0.05 && 1.05 / (luminance(light) + 0.05) < 4.8) light -= 0.01;
  // Keep tenant hue while maintaining readable text in both light and dark themes.
  return {
    "--org-primary-light": `${h} ${s * 100}% ${light * 100}%`,
    "--org-primary-dark": `${h} ${s * 100}% ${Math.max(l * 100, 72)}%`,
  } as CSSProperties;
}
