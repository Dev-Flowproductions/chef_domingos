import { lkmCall } from './client';

export interface Milestone {
  pts:   number;
  label: string;
}

export interface PointsData {
  balance:       number;
  converted:     number;
  milestones:    Milestone[];
  nextMilestone: Milestone | null;
  progress:      number;
  ptsToNext:     number;
}

export async function getPointsBalance(): Promise<PointsData> {
  return lkmCall<PointsData>('lkm-points');
}
