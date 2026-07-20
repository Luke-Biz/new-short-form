/** WCAG relative luminance of a #RRGGBB hex colour. */
function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between a #RRGGBB hex colour and white (1 = none, 21 = max). */
export function contrastRatioWithWhite(hex: string): number {
  return 1.05 / (relativeLuminance(hex) + 0.05);
}

/** WCAG minimum contrast for large text / UI components. */
export const MIN_UI_CONTRAST = 3;
