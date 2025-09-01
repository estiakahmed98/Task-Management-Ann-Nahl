// Shared avatar utilities for colorful initial placeholders

export function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0; // Convert to 32bit integer
  }
  return Math.abs(h);
}

export function nameToColor(key: string): string {
  const safeKey = key.trim() || "user";
  const hue = hashString(safeKey) % 360;
  const saturation = 65;
  const lightness = 55;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export function getInitialsFromName(name: string): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

export function getInitialsFromParts(firstName?: string, lastName?: string, fallbackName?: string): string {
  const f = (firstName ?? "").trim();
  const l = (lastName ?? "").trim();
  if (f || l) {
    const fi = f ? f[0]!.toUpperCase() : "";
    const li = l ? l[0]!.toUpperCase() : "";
    return (fi + li) || f.slice(0, 2).toUpperCase();
  }
  return getInitialsFromName(fallbackName ?? "");
}
