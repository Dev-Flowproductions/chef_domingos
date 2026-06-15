/**
 * Value encoded in the customer QR shown on the Ganhar screen.
 * POS / LKM scanners read the loyalty card id (CodCartao).
 */
export function buildLoyaltyQrPayload(cardCode: string): string {
  return cardCode.trim();
}
