import { create } from 'zustand';
import { getPointsBalance, PointsData, Milestone } from '../services/lkm/points';
import { PROGRESS_VOUCHERS } from '../lib/loyaltyRules';

interface PointsState {
  balance:       number;
  converted:     number;
  milestones:    Milestone[];
  nextMilestone: Milestone | null;
  progress:      number;
  ptsToNext:     number;
  loading:       boolean;
  error:         string | null;
  fetch:         () => Promise<void>;
  reset:         () => void;
}

const DEFAULT_MILESTONES: Milestone[] = PROGRESS_VOUCHERS.map((v) => ({
  pts: v.pts,
  label: `Vale ${v.euros}€`,
}));

const DEFAULT: Pick<PointsState, 'balance' | 'converted' | 'milestones' | 'nextMilestone' | 'progress' | 'ptsToNext'> = {
  balance:       0,
  converted:     0,
  milestones:    DEFAULT_MILESTONES,
  nextMilestone: DEFAULT_MILESTONES[0],
  progress:      0,
  ptsToNext:     DEFAULT_MILESTONES[0].pts,
};

export const usePointsStore = create<PointsState>((set) => ({
  ...DEFAULT,
  loading: false,
  error:   null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const data: PointsData = await getPointsBalance();
      const next = DEFAULT_MILESTONES.find((m) => data.balance < m.pts) ?? null;
      set({
        balance: data.balance,
        converted: data.converted,
        milestones: DEFAULT_MILESTONES,
        nextMilestone: next,
        progress: next ? Math.min((data.balance / next.pts) * 100, 100) : 100,
        ptsToNext: next ? next.pts - data.balance : 0,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: (err as Error).message,
        balance: 0,
        converted: 0,
        progress: 0,
        ptsToNext: DEFAULT_MILESTONES[0].pts,
      });
    }
  },

  reset: () => set({ ...DEFAULT, loading: false, error: null }),
}));
