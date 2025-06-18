import { writable, derived } from 'svelte/store';
import { eliminationStore } from './eliminationStore';
import { Team, getTeamByRoleName } from './teams';

export interface Association {
	login: string;         // Login du joueur ciblé
	role: string;          // Rôle supposé
	isWolf: boolean;       // Est-ce un rôle de loup ?
	author: string;        // Login du joueur qui a fait l'association
	timestamp: number;     // Pour tri si besoin
}

const initial: Association[] = [];
export const allies = writable<Association[]>(initial);

// ➕ Ajouter une association
export function addAssociation(author: string, login: string, role: string, isWolf: boolean) {
	const newEntry: Association = {
		login,
		role,
		isWolf,
		author,
		timestamp: Date.now()
	};

	allies.update(list => {
		// Supprime toute assoc déjà faite par ce joueur vers cette cible ET ce rôle
		return [
			...list.filter(a => !(a.author === author && a.login === login && a.role === role)),
			newEntry
		];
	});
}

// ❌ Supprimer une association
export function removeAssociation(author: string, login: string, role: string) {
	allies.update(list => list.filter(a => !(a.author === author && a.login === login && a.role === role)));
}

// 🔄 Récupérer toutes les associations faites par un joueur
export function getAssociationsFor(login: string) {
	return derived(allies, $allies =>
		$allies.filter(a => a.author === login)
	);
}

// 🧠 Associations triées pour affichage (colonnes, rôles rouges, cliquables, etc.)
export function getStructuredAssociations(currentLogin: string, isWolf: boolean) {
	return derived(
		[allies, eliminationStore],
		([$allies, $eliminated]) => {
			const result = { gauche: [], droite: [] } as Record<
				'gauche' | 'droite',
				{
					login: string;
					role: string;
					estLaMienne: boolean;
					estElimine: boolean;
					estClickable: boolean;
					estRouge: boolean;
				}[]
			>;

			const eliminatedLogins = $eliminated.map(e => e.playerLogin);

			$allies.forEach(a => {
				const estLaMienne = a.author === currentLogin;
				const estElimine = eliminatedLogins.includes(a.author);
				const team = getTeamByRoleName(a.role);
				const estRouge = team === Team.WEREWOLVES || team === Team.SOLO;
				const estClickable = !estLaMienne && !estElimine;

				const formatted = {
					login: a.login,
					role: a.role,
					estLaMienne,
					estElimine,
					estClickable,
					estRouge
				};

				// Placement selon perspective
				if (isWolf) {
					if (a.isWolf) {
						result.gauche.push(formatted); // alliés loups
					} else {
						result.droite.push(formatted); // villageois repérés
					}
				} else {
					if (!a.isWolf) {
						result.gauche.push(formatted); // villageois identifiés
					} else {
						result.droite.push(formatted); // loups suspects
					}
				}
			});

			return result;
		}
	);
}
