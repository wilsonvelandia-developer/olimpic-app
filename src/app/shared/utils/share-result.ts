/**
 * Share result utilities.
 * Generates shareable content for match results on social media.
 */

export interface ShareableMatch {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  tournamentName: string;
  date?: string;
  venue?: string;
}

/**
 * Generate a text representation of a match result for sharing.
 */
export function generateResultText(match: ShareableMatch): string {
  const lines = [
    `⚽ ${match.tournamentName}`,
    '',
    `${match.homeTeamName} ${match.homeScore} - ${match.awayScore} ${match.awayTeamName}`,
    '',
  ];

  if (match.date) lines.push(`📅 ${match.date}`);
  if (match.venue) lines.push(`📍 ${match.venue}`);
  lines.push('', '🏆 OlimpicApp');

  return lines.join('\n');
}

/**
 * Share using the Web Share API (mobile native share sheet).
 * Falls back to clipboard copy on desktop.
 */
export async function shareResult(match: ShareableMatch, url?: string): Promise<boolean> {
  const text = generateResultText(match);

  if (navigator.share) {
    try {
      await navigator.share({
        title: `${match.homeTeamName} vs ${match.awayTeamName}`,
        text,
        url: url ?? window.location.href,
      });
      return true;
    } catch {
      // User cancelled or share failed
      return false;
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(`${text}\n${url ?? window.location.href}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a WhatsApp share URL.
 */
export function generateWhatsAppUrl(match: ShareableMatch, matchUrl?: string): string {
  const text = generateResultText(match);
  const fullText = matchUrl ? `${text}\n\n🔗 Ver en vivo: ${matchUrl}` : text;
  return `https://wa.me/?text=${encodeURIComponent(fullText)}`;
}

/**
 * Generate a Twitter/X share URL.
 */
export function generateTwitterUrl(match: ShareableMatch, matchUrl?: string): string {
  const text = `${match.homeTeamName} ${match.homeScore}-${match.awayScore} ${match.awayTeamName} | ${match.tournamentName} 🏆`;
  const params = new URLSearchParams({ text });
  if (matchUrl) params.set('url', matchUrl);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}
