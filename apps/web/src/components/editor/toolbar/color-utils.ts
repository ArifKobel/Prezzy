export function parseColorToRgb(val: string): [number, number, number] | null {
  const rgbMatch = val.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) return [+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]];
  const c = val.replace("#", "");
  if (c.length === 3) return [parseInt(c[0]+c[0], 16), parseInt(c[1]+c[1], 16), parseInt(c[2]+c[2], 16)];
  if (c.length >= 6) return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  return null;
}

export function isLightColor(val: string): boolean {
  const rgb = parseColorToRgb(val);
  if (!rgb) return false;
  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 > 180;
}
