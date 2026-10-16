/** Standard money vouchers that already exist as LKM/WinRest prizes. */
export const LKM_POS_MONEY_PRIZES = [
  { euroValue: 5, pointsCost: 500, lkmCode: 210, reference: '01' },
  { euroValue: 10, pointsCost: 900, lkmCode: 211, reference: '02' },
  { euroValue: 20, pointsCost: 1700, lkmCode: 212, reference: '03' },
  { euroValue: 30, pointsCost: 2500, lkmCode: 213, reference: '04' },
] as const;

export function isLkmPosMoneyPrize(item: {
  euroValue?: number | null;
  pointsCost?: number | null;
}): boolean {
  const pts = Number(item.pointsCost);
  if (!Number.isFinite(pts)) return false;
  const euro = item.euroValue == null ? null : Number(item.euroValue);
  return LKM_POS_MONEY_PRIZES.some(
    (prize) => prize.pointsCost === pts && (euro == null || euro === prize.euroValue),
  );
}
