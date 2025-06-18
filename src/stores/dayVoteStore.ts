import { writable, derived, get } from 'svelte/store';

// Type pour stocker les votes : login du votant → login de la cible
type VoteMap = Record<string, string>;

export const dayVotes = writable<VoteMap>({});
export const isSecondRound = writable<boolean>(false);
export const secondRoundCandidates = writable<string[]>([]);

// Enregistrer ou modifier un vote
export function setDayVote(voterLogin: string, targetLogin: string) {
    let isValidTarget = true;
    
    // Vérifier si on est au second tour
    if (get(isSecondRound)) {
        const candidates = get(secondRoundCandidates);
        isValidTarget = candidates.includes(targetLogin);
    }

    // Vérifier que le votant et la cible existent et que la cible est valide au second tour
    if (!voterLogin || !targetLogin || !isValidTarget) {
        console.warn('Vote invalide');
        return;
    }
    
    dayVotes.update(votes => ({ ...votes, [voterLogin]: targetLogin }));
}

// Réinitialiser les votes du jour
export function resetDayVotes() {
    dayVotes.set({});
}

// Réinitialiser tous les votes et le second tour
export function resetAll() {
    dayVotes.set({});
    isSecondRound.set(false);
    secondRoundCandidates.set([]);
}

// Store dérivé : comptage des voix par joueur
export const voteCounts = derived(dayVotes, $votes => {
    const counts: Record<string, number> = {};
    Object.values($votes).forEach(target => {
        counts[target] = (counts[target] || 0) + 1;
    });
    return counts;
});

// Obtenir les candidats à égalité avec le plus de voix
function getTopTiedCandidates(voteCountMap: Record<string, number>): string[] {
    const sorted = Object.entries(voteCountMap).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return [];
    
    const maxVotes = sorted[0][1];
    return sorted
        .filter(([_, votes]) => votes === maxVotes)
        .map(([login, _]) => login);
}

// Obtenir le résultat du vote et détecter les égalités
export function getVoteResult(): { winner: string | null, isTie: boolean, tiedCandidates: string[] } {
    const voteCountMap: Record<string, number> = {};
    const votesSnapshot = get(dayVotes);

    for (const target of Object.values(votesSnapshot)) {
        voteCountMap[target] = (voteCountMap[target] || 0) + 1;
    }

    const sorted = Object.entries(voteCountMap).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) return { winner: null, isTie: false, tiedCandidates: [] };
    
    if (sorted.length > 1 && sorted[0][1] === sorted[1][1]) {
        const tiedCandidates = getTopTiedCandidates(voteCountMap);
        return { winner: null, isTie: true, tiedCandidates };
    }

    return { winner: sorted[0][0], isTie: false, tiedCandidates: [] };
}

// Démarrer un second tour avec les candidats donnés
export function startSecondRound(candidates: string[]) {
    resetDayVotes();  // Réinitialiser les votes
    isSecondRound.set(true);  // Activer le mode second tour
    secondRoundCandidates.set(candidates);  // Définir les candidats éligibles
}
