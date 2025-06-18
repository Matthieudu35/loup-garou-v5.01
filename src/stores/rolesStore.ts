import { writable, derived, get } from 'svelte/store';
import { users, selectedPlayers } from './usersStore';
import { browser } from '$app/environment';

export interface RolesConfig {
  loupGarou: number;
  loupSolitaire: number;
  infectPereDesLoups: number;
  grandMechantLoup: number;
  loupBlanc: number;
  enfantSauvage: number;
  chienLoup: number;
  voyante: number;
  sorciere: number;
  chasseur: number;
  soeurRouge: number;
  soeurBleue: number;
  frereVert: number;
  frereJaune: number;
  ancien: number;
  villageois: number;
}

const initialRoles: RolesConfig = {
  loupGarou: 5,
  loupSolitaire: 3,
  infectPereDesLoups: 1,
  grandMechantLoup: 1,
  loupBlanc: 1,
  enfantSauvage: 1,
  chienLoup: 1,
  voyante: 2,
  sorciere: 2,
  chasseur: 6,
  soeurRouge: 2,
  soeurBleue: 2,
  frereVert: 3,
  frereJaune: 3,
  ancien: 1,
  villageois: 33
};

export const rolesConfig = writable<RolesConfig>(initialRoles);

export const totalPlayers = derived(rolesConfig, $rolesConfig =>
  Object.values($rolesConfig).reduce((sum, count) => sum + count, 0)
);

export const isSelectionComplete = derived(
  [selectedPlayers, totalPlayers],
  ([$selectedPlayers, $totalPlayers]) => $selectedPlayers.length === $totalPlayers
);

const storedRolesAssigned = browser ? localStorage.getItem('rolesAssigned') === 'true' : false;
export const rolesAssigned = writable(storedRolesAssigned);

if (browser) {
  rolesAssigned.subscribe(value => {
    localStorage.setItem('rolesAssigned', value.toString());
  });
}

export function assignRoles() {
  const rolesToAssign: string[] = [];

  const roleDisplayNames: Record<keyof RolesConfig, string> = {
    loupGarou: 'Loup-garou',
    loupSolitaire: 'Loup solitaire',
    infectPereDesLoups: 'Infect Père des loups',
    grandMechantLoup: 'Grand Méchant Loup',
    loupBlanc: 'Loup blanc',
    enfantSauvage: 'Enfant sauvage',
    chienLoup: 'Chien-loup',
    voyante: 'Voyante',
    sorciere: 'Sorcière',
    chasseur: 'Chasseur',
    soeurRouge: 'Soeur rouge',
    soeurBleue: 'Soeur bleue',
    frereVert: 'Frère vert',
    frereJaune: 'Frère jaune',
    ancien: 'Ancien',
    villageois: 'Villageois'
  };

  Object.entries(get(rolesConfig)).forEach(([role, count]) => {
    for (let i = 0; i < count; i++) {
      rolesToAssign.push(roleDisplayNames[role as keyof RolesConfig] || role);
    }
  });

  // Mélanger aléatoirement les rôles
  for (let i = rolesToAssign.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolesToAssign[i], rolesToAssign[j]] = [rolesToAssign[j], rolesToAssign[i]];
  }

  const selectedPlayersList = get(selectedPlayers);

  // Mettre à jour les utilisateurs
  users.update(usersList =>
    usersList.map(user => {
      const index = selectedPlayersList.indexOf(user.login);
      if (index !== -1) {
        return { ...user, role: rolesToAssign[index] };
      }
      return user;
    })
  );

  // Afficher les rôles spéciaux
  const specialRoles = get(users)
    .filter(user => user.role && user.role !== 'Villageois')
    .map(user => `${user.login}: ${user.role}`);
  console.log('Rôles spéciaux:', specialRoles);

  // Log spécifique pour les Enfants Sauvages
  const enfantsSauvages = get(users)
    .filter(user => user.role === 'Enfant sauvage')
    .map(user => `${user.login}: ${user.role}`);
  console.log('%cENFANTS SAUVAGES:', 'background: #e74c3c; color: white; font-size: 16px; padding: 5px;');
  console.log('%c' + JSON.stringify(enfantsSauvages, null, 2), 'color: #e74c3c; font-size: 14px;');

  rolesAssigned.set(true);
}

export function resetRoles() {
  if (browser) {
    const usersList = get(users);
    usersList.forEach(user => {
      localStorage.removeItem(`role_${user.login}`);
    });
    localStorage.removeItem('rolesAssigned');
    rolesAssigned.set(false);
  }
}
