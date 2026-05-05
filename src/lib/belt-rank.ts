export const BELT_RANK_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'white', label: 'White Belt (9th Kyu)' },
  { value: 'yellow', label: 'Yellow Belt (8th Kyu)' },
  { value: 'orange', label: 'Orange Belt (7th Kyu)' },
  { value: 'green', label: 'Green Belt (6th Kyu)' },
  { value: 'blue', label: 'Blue Belt (5th Kyu)' },
  { value: 'red', label: 'Red Belt (4th Kyu)' },
  { value: 'brown_kyu3', label: 'Brown Belt (3rd Kyu)' },
  { value: 'brown_kyu2', label: 'Brown Belt (2nd Kyu)' },
  { value: 'brown_kyu1', label: 'Brown Belt (1st Kyu)' },
  { value: 'black', label: 'Black Belt' },
];

const BELT_RANK_LABELS: Record<string, string> = {
  white: 'White Belt (9th Kyu)',
  yellow: 'Yellow Belt (8th Kyu)',
  orange: 'Orange Belt (7th Kyu)',
  green: 'Green Belt (6th Kyu)',
  blue: 'Blue Belt (5th Kyu)',
  red: 'Red Belt (4th Kyu)',
  brown_kyu3: 'Brown Belt (3rd Kyu)',
  brown_kyu2: 'Brown Belt (2nd Kyu)',
  brown_kyu1: 'Brown Belt (1st Kyu)',
  brown: 'Brown Belt (1st Kyu)',
  black: 'Black Belt',
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
