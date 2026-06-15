import { create } from 'zustand';
import { getPointsBalance, PointsData, Milestone } from '../services/lkm/points';

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

const DEFAULT: Pick<PointsState, 'balance' | 'converted' | 'milestones' | 'nextMilestone' | 'progress' | 'ptsToNext'> = {
  balance:       0,
  converted:     0,
  milestones:    [
    { pts: 300, label: 'Café Grátis' },
    { pts: 600, label: 'Sobremesa Grátis' },
    { pts: 900, label: 'Refeição Grátis' },
  ],
  nextMilestone: { pts: 300, label: 'Café Grátis' },
  progress:      0,
  ptsToNext:     300,
};

export const usePointsStore = create<PointsState>((set) => ({
  ...DEFAULT,
  loading: false,
  error:   null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const data: PointsData = await getPointsBalance();
      set({ ...data, loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message, balance: 0, converted: 0, progress: 0, ptsToNext: 300 });
    }
  },

  reset: () => set({ ...DEFAULT, loading: false, error: null }),
}));
