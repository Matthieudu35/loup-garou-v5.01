// src/stores/usersStore.ts

import { writable, derived, get } from 'svelte/store';
import type { User } from './types';
import { initialUsers } from './usersData';

export const users = (() => {
	const { subscribe, set, update } = writable<User[]>(initialUsers);

	function getUserByLogin(login: string): User | undefined {
		const userList = get({ subscribe });
		return userList.find(user => user.login === login);
	}

	function getCurrentUser(): User | undefined {
		const userList = get({ subscribe });
		return userList.find(user => user.isCurrentUser);
	}

	function setCurrentUser(login: string | null) {
		update(userList =>
			userList.map(user => ({
				...user,
				isCurrentUser: login ? user.login === login : false
			}))
		);
	}

	return {
		subscribe,
		set,
		update,
		getUserByLogin,
		setCurrentUser,
		getCurrentUser
	};
})();

// Joueurs sélectionnés (ceux qui participent à la partie)
export const selectedPlayers = writable<string[]>([]);

// Fonction utilitaire pour les initiales et la couleur
export function getPhotoPlaceholder(user: User) {
	if (!user.firstName || !user.lastName) return null;

	const initials = `${user.firstName[0]}${user.lastName[0]}`;
	const backgroundColor = stringToColor(initials);
	return { initials, backgroundColor };
}

function stringToColor(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	const color = Math.floor((Math.abs(hash) % 16777215));
	return `#${color.toString(16).padStart(6, '0')}`;
}

// Exemple de fonction pour nommer un maire
export function setMayor(login: string, isMayor: boolean) {
	users.update(userList =>
		userList.map(user =>
			user.login === login ? { ...user, isMayor } : { ...user, isMayor: false }
		)
	);
}

// Fonction pour marquer un joueur comme éliminé
export function eliminatePlayer(login: string) {
	users.update(userList =>
		userList.map(user =>
			user.login === login ? { ...user, isAlive: false } : user
		)
	);
}
