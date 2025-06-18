import { writable, derived } from 'svelte/store';
import { users, eliminatePlayer as updateUserAlive } from './usersStore';
import { gameState } from './gameStore';
import { browser } from '$app/environment';
import { checkMasterDeath } from './enfantSauvageStore';

// Types
export type EliminationSource = 'admin' | 'vote' | 'loup-garou' | 'sorcière' | 'chasseur' | 'other';
export type EliminationReason = 'vote' | 'attaque' | 'pouvoir' | 'admin' | 'other';

export interface Elimination {
    playerLogin: string;
    source: EliminationSource;
    reason: EliminationReason;
    timestamp: number;
    details?: string;
}

// Store pour la liste des éliminations
const createEliminationStore = () => {
    // Charger les éliminations depuis le localStorage
    const loadEliminations = (): Elimination[] => {
        if (!browser) return [];
        try {
            const saved = localStorage.getItem('eliminations');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Erreur lors du chargement des éliminations:', e);
            return [];
        }
    };

    const { subscribe, set, update } = writable<Elimination[]>(loadEliminations());

    // Sauvegarder automatiquement dans le localStorage
    if (browser) {
        subscribe(eliminations => {
            localStorage.setItem('eliminations', JSON.stringify(eliminations));
        });
    }

    return {
        subscribe,
        eliminate: (playerLogin: string, source: EliminationSource, reason: EliminationReason, details?: string) => {
            // Vérifier si le joueur est déjà éliminé
            const isAlreadyEliminated = loadEliminations().some(e => e.playerLogin === playerLogin);
            if (isAlreadyEliminated) {
                console.warn(`Le joueur ${playerLogin} est déjà éliminé`);
                return false;
            }

            // Vérifier si l'élimination est valide selon la phase du jeu
            if (!isValidElimination(playerLogin, source, reason)) {
                console.warn(`Élimination invalide pour ${playerLogin} (${source}, ${reason})`);
                return false;
            }

            // Créer la nouvelle élimination
            const elimination: Elimination = {
                playerLogin,
                source,
                reason,
                timestamp: Date.now(),
                details
            };

            // Mettre à jour les stores
            update(eliminations => [...eliminations, elimination]);
            updateUserAlive(playerLogin);

            // Gérer les conséquences de l'élimination
            handleEliminationConsequences(playerLogin, source, reason);

            // Appeler la vérification de l'enfant sauvage
            checkMasterDeath();

            return true;
        },
        resurrect: (playerLogin: string) => {
            update(eliminations => eliminations.filter(e => e.playerLogin !== playerLogin));
            users.update(userList =>
                userList.map(user => ({
                    ...user,
                    isAlive: user.login === playerLogin ? true : user.isAlive
                }))
            );
            return true;
        },
        reset: () => {
            set([]);
            if (browser) {
                localStorage.removeItem('eliminations');
            }
        }
    };
};

// Fonction pour vérifier si une élimination est valide
function isValidElimination(playerLogin: string, source: EliminationSource, reason: EliminationReason): boolean {
    // On ne peut pas utiliser $gameState directement ici
    if (source === 'admin') return true; // L'admin peut toujours éliminer
    return true; // Pour l'instant, on autorise toutes les éliminations
}

// Fonction pour gérer les conséquences d'une élimination
function handleEliminationConsequences(playerLogin: string, source: EliminationSource, reason: EliminationReason) {
    // TODO: Implémenter les conséquences spécifiques
    // - Vérifier la victoire
    // - Gérer les pouvoirs spéciaux (chasseur, etc.)
    // - Notifier les autres joueurs
    // - Mettre à jour les statistiques
}

// Création du store
export const eliminationStore = createEliminationStore();

// Store dérivé pour les joueurs éliminés
export const eliminatedPlayers = derived(eliminationStore, $eliminationStore => 
    $eliminationStore.map(e => e.playerLogin)
);

// Store dérivé pour les éliminations par source
export const eliminationsBySource = derived(eliminationStore, $eliminationStore => {
    const bySource: Record<EliminationSource, Elimination[]> = {
        'admin': [],
        'vote': [],
        'loup-garou': [],
        'sorcière': [],
        'chasseur': [],
        'other': []
    };
    
    $eliminationStore.forEach(elimination => {
        bySource[elimination.source].push(elimination);
    });
    
    return bySource;
});

// Store dérivé pour les éliminations par raison
export const eliminationsByReason = derived(eliminationStore, $eliminationStore => {
    const byReason: Record<EliminationReason, Elimination[]> = {
        'vote': [],
        'attaque': [],
        'pouvoir': [],
        'admin': [],
        'other': []
    };
    
    $eliminationStore.forEach(elimination => {
        byReason[elimination.reason].push(elimination);
    });
    
    return byReason;
}); 