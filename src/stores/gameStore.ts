import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { users, selectedPlayers, setMayor } from './usersStore';
import { rolesAssigned } from './rolesStore';
import { timer } from './timerStore';
import { eliminationStore } from './eliminationStore';
import { getVoteResult, resetDayVotes, startSecondRound, resetAll, isSecondRound } from './dayVoteStore';
import { resetEnfantSauvageStates } from './enfantSauvageStore';
import { resetChienLoupStates } from './chienLoupStore';

interface GameState {
    phase: 'jour' | 'nuit' | null;
    cycleCount: number;
    showMayorElection: string | null;
    mayor: string | null;
    gameStarted: boolean;
    showSecondRoundAnnouncement: boolean;
    showVoteCountdown: boolean;
}

// État initial du jeu
const initialState: GameState = {
    phase: null,
    cycleCount: 0,
    showMayorElection: null,
    mayor: null,
    gameStarted: false,
    showSecondRoundAnnouncement: false,
    showVoteCountdown: false
};

// Création du store avec l'état initial
export const gameState = writable<GameState>(initialState);

// Restaurer l'état du jeu depuis le localStorage
if (browser) {
	const savedState = localStorage.getItem('gameState');
	if (savedState) {
		try {
			const parsedState = JSON.parse(savedState);
			const restoredGameState: GameState = {
				phase: parsedState.phase || 'nuit',
				cycleCount: parsedState.cycleCount || 0,
				gameStarted: parsedState.gameStarted || false,
				showMayorElection: null,
				mayor: parsedState.mayor || null,
				showSecondRoundAnnouncement: parsedState.showSecondRoundAnnouncement || false,
				showVoteCountdown: parsedState.showVoteCountdown || false
			};
			gameState.set(restoredGameState);
			updateTheme(restoredGameState.phase);
		} catch (error) {
			console.error('Error restoring game state:', error);
		}
	}
}

// La subscription pour sauvegarder l'état du jeu
if (browser) {
    gameState.subscribe(state => {
        // On sauvegarde une version sans showMayorElection
        const { showMayorElection, ...stateToSave } = state;
        localStorage.setItem('gameState', JSON.stringify(stateToSave));
    });
}

// Fonction pour mettre à jour le thème
function updateTheme(phase: string | null) {
    if (typeof document === 'undefined' || phase === null) return;
    const html = document.documentElement;
    html.setAttribute('data-theme', phase);
}

// Fonction pour démarrer la partie
export function startGame() {
    gameState.update(state => ({
        ...state,
        phase: 'nuit',
        cycleCount: 0,
        gameStarted: true,
        showMayorElection: null,
        mayor: null
    }));
    updateTheme('nuit');
}

// Fonction pour changer de phase
export const switchPhase = () => {
    gameState.update(state => {
        const currentPhase = state.phase;
        const newPhase = currentPhase === 'jour' ? 'nuit' : 'jour';
        let newCycle = state.cycleCount;

        // Si on passe de la nuit au jour, on incrémente le cycle
        if (currentPhase === 'nuit' && newPhase === 'jour') {
            newCycle++;
        }

        // Gestion des votes du jour
        if (currentPhase === 'jour' && newPhase === 'nuit') {
            const voteResult = getVoteResult();

            // Afficher le décompte des votes
            state.showVoteCountdown = true;

            // Attendre que le décompte soit terminé avant de continuer
            setTimeout(() => {
                gameState.update(s => {
                    // Jour 1 : Élection du maire
                    if (s.cycleCount === 1) {
                        if (voteResult.isTie && voteResult.tiedCandidates) {
                            // Si on est déjà au second tour et qu'il y a encore une égalité, on passe à la nuit #1
                            if (get(isSecondRound)) {
                                // Réinitialiser l'état du second tour
                                resetAll();
                                // On ne change pas le cycle car on veut rester à la nuit #1
                                updateTheme('nuit');
                                return {
                                    ...s,
                                    phase: 'nuit',
                                    showVoteCountdown: false
                                };
                            }
                            // Sinon, on démarre le second tour
                            startSecondRound(voteResult.tiedCandidates);
                            // Afficher l'animation du second tour
                            s.showSecondRoundAnnouncement = true;
                            return {
                                ...s,
                                phase: 'jour',
                                showVoteCountdown: false
                            };
                        }
                        // Nommer le maire
                        if (voteResult.winner) {
                            const player = users.getUserByLogin(voteResult.winner);
                            if (player) {
                                s.mayor = player.login;
                                s.showMayorElection = player.login;
                                setTimeout(() => {
                                    gameState.update(s => ({ ...s, showMayorElection: null }));
                                }, 5000);
                            }
                        }
                    } 
                    // Jours suivants : Élimination normale
                    else if (s.cycleCount > 1) {
                        if (voteResult.winner) {
                            eliminationStore.eliminate(voteResult.winner, 'vote', 'vote');
                        }
                    }

                    // Réinitialiser les votes après chaque phase de jour
                    resetDayVotes();
                    // Mettre à jour le thème avant de retourner le nouvel état
                    updateTheme('nuit');
                    return {
                        ...s,
                        phase: 'nuit',
                        showVoteCountdown: false
                    };
                });
            }, 5000); // Attendre 5 secondes pour le décompte

            return state;
        }

        // Réinitialiser l'état du second tour si on passe de nuit à jour
        if (currentPhase === 'nuit' && newPhase === 'jour') {
            resetAll();
        }

        updateTheme(newPhase);
        return {
            ...state,
            phase: newPhase,
            cycleCount: newCycle
        };
    });
    timer.reset();
    timer.start();
};

// Fonction pour réinitialiser la partie
export function resetGame() {
    gameState.set({
        phase: 'nuit',
        cycleCount: 0,
        gameStarted: false,
        showMayorElection: null,
        mayor: null,
        showSecondRoundAnnouncement: false,
        showVoteCountdown: false
    });

    rolesAssigned.set(false);
    selectedPlayers.set([]);
    resetEnfantSauvageStates();
    resetChienLoupStates();

    users.update(usersList => 
        usersList.map(user => ({ ...user, role: '' }))
    );

    timer.reset();
    eliminationStore.reset();

    if (browser) {
        localStorage.removeItem('gameState');
        localStorage.removeItem('users');
        localStorage.removeItem('timerState');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('eliminations');
        localStorage.removeItem('enfantSauvageStates');
        localStorage.removeItem('chienLoupStates');

        // Supprimer tous les mémos
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
            if (key.startsWith('role_') || key.startsWith('memos-')) {
                localStorage.removeItem(key);
            }
        });
    }

    window.location.reload();
}

