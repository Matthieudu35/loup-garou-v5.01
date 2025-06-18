import { writable, derived } from 'svelte/store';
import { users } from './usersStore';
import { currentUser } from './authStore';
import { Team, getTeamByRoleName } from './teams';

interface ChienLoupState {
  login: string;
  camp: 'loups' | 'village' | null;
  hasChosen: boolean;
}

// Store pour suivre l'état de TOUS les Chien-Loups (clé = login)
export const chienLoupStates = writable<Record<string, ChienLoupState>>({});

// Fonction pour mettre à jour le camp du Chien-Loup
export function setChienLoupCamp(login: string, camp: 'loups' | 'village') {
  chienLoupStates.update(states => ({
    ...states,
    [login]: { login, camp, hasChosen: true }
  }));

  // Mettre à jour l'équipe du joueur
  if (camp === 'loups') {
    // Mettre à jour l'équipe pour qu'il soit considéré comme un loup
    users.update(usersList =>
      usersList.map(user => 
        user.login === login 
          ? { ...user, team: Team.WEREWOLVES }
          : user
      )
    );
  }
}

// Fonction pour réinitialiser l'état de tous les Chien-Loups
export function resetChienLoupStates() {
  chienLoupStates.set({});
}

// Store dérivé pour obtenir l'état du chien-loup courant
export const currentChienLoupState = derived(
  [currentUser, chienLoupStates],
  ([$currentUser, $chienLoupStates]) =>
    $currentUser ? $chienLoupStates[$currentUser.login] : undefined
);

// Store dérivé pour vérifier si le joueur courant est un Chien-Loup
export const isCurrentPlayerChienLoup = derived(
  [currentUser],
  ([$currentUser]) => {
    if (!$currentUser) return false;
    const roleLC = $currentUser.role?.toLowerCase() || '';
    return (roleLC === 'chien-loup' || roleLC === 'chienloup' || roleLC === 'chien loup');
  }
);

// Fonction utilitaire pour vérifier si un rôle est celui d'un loup
export function isWolfRole(role: string): boolean {
  if (!role) return false;
  const roleLC = role.toLowerCase();
  const isWolf = /loup[\s-]?garou|loup[\s-]?blanc|grand[\s-]?m[ée]chant[\s-]?loup|infect[\s-]?p[èe]re[\s-]?des[\s-]?loups|loup[\s-]?solitaire/i.test(roleLC);
  
  console.log('isWolfRole Debug:', {
    role,
    roleLC,
    isWolf
  });
  
  return isWolf;
}

// Store dérivé pour vérifier si le joueur courant est un loup (après avoir choisi)
export const isCurrentPlayerWolf = derived(
  [currentUser, chienLoupStates],
  ([$currentUser, $chienLoupStates]) => {
    if (!$currentUser) return false;
    
    // Vérifier si le joueur est un chien-loup qui a choisi
    const isChienLoup = ($currentUser.role?.toLowerCase() === 'chien-loup' || 
                       $currentUser.role?.toLowerCase() === 'chienloup' || 
                       $currentUser.role?.toLowerCase() === 'chien loup');
    
    if (isChienLoup) {
      const state = $chienLoupStates[$currentUser.login];
     
      
      if (state?.hasChosen) {
        return state.camp === 'loups';
      }
      return false; // Si le chien-loup n'a pas choisi, il n'est pas encore un loup
    }
    
    // Si ce n'est pas un chien-loup, vérification normale du rôle
    const team = getTeamByRoleName($currentUser.role || '');
    const isWolf = team === Team.WEREWOLVES || team === Team.SOLO;
    
    
    
    return isWolf;
  }
); 