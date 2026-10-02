/**
 * Utility functions for Vietnamese search with tone removal and whitespace tolerance
 * Handles: TC07 (unaccented / accented search) & TC08 (whitespace tolerance & multi-word tokens)
 */

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function matchVietnameseSearch(target: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  // Normalize multi spaces and trim
  const cleanQuery = query.trim().replace(/\s+/g, ' ');
  const normQuery = removeVietnameseTones(cleanQuery).toLowerCase();
  const normTarget = removeVietnameseTones(target).toLowerCase();

  // 1. Direct contains match
  if (normTarget.includes(normQuery)) return true;

  // 2. Tokenized multi-word match (e.g., "sh 160" or "motul 300v" or "honda abs")
  const tokens = normQuery.split(' ').filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every(token => normTarget.includes(token));
  }

  return false;
}
