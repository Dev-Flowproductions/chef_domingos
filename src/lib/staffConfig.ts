/** 4-digit staff PIN for Modo Staff (override via EXPO_PUBLIC_STAFF_PIN). */
export const STAFF_PIN =
  (process.env.EXPO_PUBLIC_STAFF_PIN ?? '1234').replace(/\D/g, '').slice(0, 4) || '1234';

export function isStaffPinValid(pin: string): boolean {
  return pin.replace(/\D/g, '') === STAFF_PIN;
}
