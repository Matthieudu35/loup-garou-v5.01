import { writable, derived, get } from 'svelte/store';
import { users } from './usersStore';
import { currentUser } from './authStore';
import { eliminationStore } from './eliminationStore';
import { browser } from '$app/environment';
import type { User } from './types';

interface EnfantSauvageState {
  login: string;
  masterLogin: string | null;
  hasSwitched: boolean;
}

// Store pour suivre l'état de TOUS les Enfants Sauvages (clé = login)
export const enfantSauvageStates = writable<Record<string, EnfantSauvageState>>({});

// Fonction pour définir le maître d'un Enfant Sauvage
export function setEnfantSauvageMaster(login: string, masterLogin: string) {
  enfantSauvageStates.update(states => ({
    ...states,
    [login]: { login, masterLogin, hasSwitched: false }
  }));

  // Sauvegarder dans le localStorage
  if (browser) {
    const savedStates = localStorage.getItem('enfantSauvageStates');
    const states = savedStates ? JSON.parse(savedStates) : {};
    states[login] = { login, masterLogin, hasSwitched: false };
    localStorage.setItem('enfantSauvageStates', JSON.stringify(states));
  }
}

// Fonction pour vérifier si le maître est mort et mettre à jour l'état
export function checkMasterDeath() {
  const currentEliminationStore = get(eliminationStore);
  const eliminatedPlayers = currentEliminationStore.map((e: { playerLogin: string }) => e.playerLogin);
  
  enfantSauvageStates.update(states => {
    const newStates = { ...states };
    const currentUsers = get(users);

    Object.entries(states).forEach(([login, state]) => {
      if (state.masterLogin && eliminatedPlayers.includes(state.masterLogin) && !state.hasSwitched) {
        newStates[login] = {
          ...state,
          hasSwitched: true
        };

        // Changer le rôle de l'Enfant Sauvage en Loup solitaire
        users.update(usersList =>
          usersList.map(user => {
            if (user.login === login) {
              return { ...user, role: 'Loup solitaire' };
            }
            return user;
          })
        );
      }
    });

    // Sauvegarder dans le localStorage
    if (browser) {
      localStorage.setItem('enfantSauvageStates', JSON.stringify(newStates));
    }

    return newStates;
  });
}

// Fonction pour réinitialiser l'état de tous les Enfants Sauvages
export function resetEnfantSauvageStates() {
  enfantSauvageStates.set({});
  if (browser) {
    localStorage.removeItem('enfantSauvageStates');
  }
}

// Store dérivé pour obtenir l'état de l'Enfant Sauvage courant
export const currentEnfantSauvageState = derived(
  [currentUser, enfantSauvageStates],
  ([$currentUser, $enfantSauvageStates]) =>
    $currentUser ? $enfantSauvageStates[$currentUser.login] : undefined
);

// Store dérivé pour vérifier si le joueur courant est un Enfant Sauvage qui n'a pas choisi son maître
export const isCurrentPlayerEnfantSauvage = derived(
  [currentUser, enfantSauvageStates],
  ([$currentUser, $enfantSauvageStates]) => {
    if (!$currentUser) return false;
    return $currentUser.role === 'Enfant sauvage' && !$enfantSauvageStates[$currentUser.login]?.masterLogin;
  }
);

// Store dérivé pour vérifier si le joueur courant est un loup (après avoir switché)
export const isCurrentPlayerWolf = derived(
  [currentUser, enfantSauvageStates],
  ([$currentUser, $enfantSauvageStates]) => {
    if (!$currentUser) return false;
    const state = $enfantSauvageStates[$currentUser.login];
    return state?.hasSwitched || $currentUser.role === 'Loup solitaire';
  }
);

// Fonction pour obtenir le camp actuel d'un joueur
export function getCurrentTeam(login: string): 'village' | 'loups' {
  const currentEnfantSauvageStates = get(enfantSauvageStates);
  const currentUsers = get(users);
  
  const state = currentEnfantSauvageStates[login];
  if (!state) return 'village';
  
  if (state.hasSwitched) return 'loups';
  
  const master = currentUsers.find((u: User) => u.login === state.masterLogin);
  return master?.isAlive ? 'village' : 'loups';
}

// Charger l'état depuis le localStorage au démarrage
if (browser) {
  const savedStates = localStorage.getItem('enfantSauvageStates');
  if (savedStates) {
    try {
      enfantSauvageStates.set(JSON.parse(savedStates));
    } catch (e) {
      console.error('Erreur lors du chargement des états des Enfants Sauvages:', e);
    }
  }
}

// Fonction pour obtenir le rôle d'affichage d'un joueur
export function getDisplayRole(user: User): string {
  if (user.role === 'Enfant sauvage') {
    const state = get(enfantSauvageStates)[user.login];
    if (state?.masterLogin) {
      const master = get(users).find(u => u.login === state.masterLogin);
      if (master && get(eliminationStore).some(e => e.playerLogin === master.login)) {
        return 'Enfant sauvage';
      }
    }
  }
  return user.role || '';
}

// Fonction pour obtenir l'équipe d'un joueur
export function getTeam(user: User): 'village' | 'loups' {
  if (user.role === 'Enfant sauvage') {
    const state = get(enfantSauvageStates)[user.login];
    if (state?.masterLogin) {
      const master = get(users).find(u => u.login === state.masterLogin);
      if (master && get(eliminationStore).some(e => e.playerLogin === master.login) && state.hasSwitched) {
        return 'loups';
      }
    }
  }
  return 'village';
} 