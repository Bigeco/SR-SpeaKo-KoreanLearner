// Zustand로 상태 관리 (애플리케이션에서 데이터를 관리하는 방식)
import { create } from 'zustand';

interface SubtitleState {
  currentText: string;
  isPlaying: boolean;
  setCurrentText: (text: string) => void;
  togglePlaying: () => void;
}

export const useSubtitleStore = create<SubtitleState>((set) => ({
  currentText: '',
  isPlaying: false,
  setCurrentText: (text) => set({ currentText: text }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
}));