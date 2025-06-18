import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { switchPhase } from './gameStore';
import { gameState } from './gameStore';

interface TimerState {
  timer: number;
  initialTimer: number;
  running: boolean;
  subTimers: Record<string, number>;
}

const initialTimer = 3600; // 1 heure en secondes

const defaultState: TimerState = {
  timer: initialTimer,
  initialTimer: initialTimer,
  running: false,
  subTimers: {}
};

const timerState = writable<TimerState>(defaultState);

if (browser) {
  const saved = localStorage.getItem('timerState');
  if (saved) {
    try {
      const savedState = JSON.parse(saved);
      const isGameRunning = JSON.parse(localStorage.getItem('gameState') || '{}')?.gameStarted;
      if (!isGameRunning) {
        timerState.set(defaultState);
      } else {
        timerState.set(savedState);
      }
    } catch (e) {
      console.error('Erreur lors du chargement du timer:', e);
    }
  }

  timerState.subscribe(state => {
    localStorage.setItem('timerState', JSON.stringify(state));
  });
}

let interval: ReturnType<typeof setInterval> | null = null;

export function startTimer() {
  stopTimer();

  timerState.update(state => ({ ...state, running: true }));

  interval = setInterval(() => {
    timerState.update(state => {
      if (state.timer > 0) {
        return { ...state, timer: state.timer - 1 };
      } else {
        stopTimer();
        switchPhase();
        setTimeout(() => startTimer(), 100);
        return { ...state, timer: state.initialTimer };
      }
    });
  }, 1000);
}

export function updateInitialTimer(newTime: number) {
  timerState.update(state => ({
    ...state,
    initialTimer: newTime,
    timer: newTime
  }));
}

export function addSubTimer(role: string, duration: number) {
  timerState.update(state => ({
    ...state,
    subTimers: { ...state.subTimers, [role]: duration }
  }));
}

export function startSubTimer(role: string) {
  const subTimer = get(timerState).subTimers[role];
  if (!subTimer) return;

  stopTimer();

  const subInterval = setInterval(() => {
    timerState.update(state => {
      if (state.subTimers[role] > 0) {
        return {
          ...state,
          subTimers: {
            ...state.subTimers,
            [role]: state.subTimers[role] - 1
          }
        };
      } else {
        clearInterval(subInterval);
        return state;
      }
    });
  }, 1000);
}

export function stopTimer() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  timerState.update(state => ({ ...state, running: false }));
}

export const timer = {
  subscribe: timerState.subscribe,
  start: startTimer,
  stop: stopTimer,
  updateInitial: updateInitialTimer,
  addSubTimer,
  startSubTimer,
  reset: () => {
    stopTimer();
    timerState.update(state => ({
      ...state,
      timer: state.initialTimer,
      running: false,
      subTimers: {}
    }));
  }
};
