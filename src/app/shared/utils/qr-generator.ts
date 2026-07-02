/**
 * QR Code URL generator.
 * Uses the free QR Server API to generate QR codes as image URLs.
 * No dependencies required — just an <img> tag with the URL.
 */

const QR_API_BASE = 'https://api.qrserver.com/v1/create-qr-code/';

/**
 * Generate a QR code image URL for the given data.
 * @param data - The URL or text to encode in the QR code
 * @param size - Size in pixels (width x height). Default 200.
 * @returns URL to the QR code image (PNG)
 */
export function generateQrUrl(data: string, size = 200): string {
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data,
    format: 'png',
    margin: '10',
  });
  return `${QR_API_BASE}?${params.toString()}`;
}

/**
 * Generate a QR code URL for a public match view.
 * @param matchId - The match ID
 * @param baseUrl - The frontend base URL (default: window.location.origin)
 */
export function generateMatchQrUrl(matchId: string, baseUrl?: string): string {
  const origin = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200');
  const matchUrl = `${origin}/p/match/${matchId}`;
  return generateQrUrl(matchUrl, 300);
}

/**
 * Generate a QR code URL for a public tournament view.
 * @param tournamentId - The tournament ID
 * @param baseUrl - The frontend base URL
 */
export function generateTournamentQrUrl(tournamentId: string, baseUrl?: string): string {
  const origin = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200');
  const url = `${origin}/p/tournament/${tournamentId}`;
  return generateQrUrl(url, 300);
}

/**
 * Generate a QR code URL for the public enrollment form.
 */
export function generateEnrollmentQrUrl(tournamentId: string, baseUrl?: string): string {
  const origin = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200');
  const url = `${origin}/p/tournament/${tournamentId}/enroll`;
  return generateQrUrl(url, 300);
}
