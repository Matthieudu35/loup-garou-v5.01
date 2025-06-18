import { writable, derived, get } from 'svelte/store';
import { users } from './usersStore';
import { eliminationStore } from './eliminationStore';
import { gameState } from './gameStore';

// Store pour les votes des loups
// Format: { [loginLoup]: loginVictime }
export const loupVotes = writable<Record<string, string>>({});

// Store pour la victime des loups
export const loupVictim = writable<string | null>(null);

// Fonction pour ajouter/modifier un vote
export function setLoupVote(loupLogin: string, victimeLogin: string) {
    loupVotes.update(votes => ({
        ...votes,
        [loupLogin]: victimeLogin
    }));
}

// Fonction pour réinitialiser les votes à chaque nuit
export function resetLoupVotes() {
    loupVotes.set({});
}

// Fonction pour obtenir la victime majoritaire
export function getMajorityVictim(): string | null {
    const votes = get(loupVotes);
    const voteCounts: Record<string, number> = {};
    
    // Compter les votes pour chaque victime
    Object.values(votes).forEach(victimeLogin => {
        voteCounts[victimeLogin] = (voteCounts[victimeLogin] || 0) + 1;
    });
    
    // Trouver la victime avec le plus de votes
    let maxVotes = 0;
    let majorityVictim: string | null = null;
    
    Object.entries(voteCounts).forEach(([victimeLogin, count]) => {
        if (count > maxVotes) {
            maxVotes = count;
            majorityVictim = victimeLogin;
        }
    });
    
    return majorityVictim;
}

// Store dérivé pour obtenir la liste des joueurs vivants (cibles potentielles)
export const alivePlayers = derived(
    [users, eliminationStore],
    ([$users, $eliminationStore]) => {
        return $users.filter(user => {
            // Filtrer les joueurs non éliminés
            return !$eliminationStore.some(e => e.playerLogin === user.login);
        });
    }
);

// Store dérivé pour obtenir le vote d'un loup spécifique
export const getLoupVote = (loupLogin: string) => {
    return derived(loupVotes, $loupVotes => $loupVotes[loupLogin] || null);
};

// Fonction pour définir la victime des loups
export function setLoupVictim(victimLogin: string | null) {
    loupVictim.set(victimLogin);
}

// Réinitialiser les votes au début de chaque nuit
gameState.subscribe(state => {
    if (state.phase === 'nuit' && state.cycleCount > 0) {
        resetLoupVotes();
        loupVictim.set(null); // Réinitialise la victime à chaque nuit
    }
});
