export const BELT_RANK_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'white', label: 'White (9th Kyu)' },
  { value: 'yellow', label: 'Yellow (8th Kyu)' },
  { value: 'orange', label: 'Orange (7th Kyu)' },
  { value: 'green', label: 'Green (6th Kyu)' },
  { value: 'blue', label: 'Blue (5th Kyu)' },
  { value: 'red', label: 'Red (4th Kyu)' },
  { value: 'brown_kyu3', label: 'Brown (3rd Kyu)' },
  { value: 'brown_kyu2', label: 'Brown (2nd Kyu)' },
  { value: 'brown_kyu1', label: 'Brown (1st Kyu)' },
  { value: 'black', label: 'Black' },
];

const BELT_RANK_LABELS: Record<string, string> = {
  white: 'White (9th Kyu)',
  yellow: 'Yellow (8th Kyu)',
  orange: 'Orange (7th Kyu)',
  green: 'Green (6th Kyu)',
  blue: 'Blue (5th Kyu)',
  red: 'Red (4th Kyu)',
  brown_kyu3: 'Brown (3rd Kyu)',
  brown_kyu2: 'Brown (2nd Kyu)',
  brown_kyu1: 'Brown (1st Kyu)',
  brown: 'Brown (1st Kyu)',
  black: 'Black',
};

export function formatBeltRankLabel(rank?: string | null, emptyFallback = '—'): string {
  if (!rank) return emptyFallback;

  const normalized = rank.trim().toLowerCase();
  const mapped = BELT_RANK_LABELS[normalized];
  if (mapped) return mapped;

  return normalized
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
