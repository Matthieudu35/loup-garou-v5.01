import { chienLoupStates } from './chienLoupStore';
import { get } from 'svelte/store';

export enum Team {
    WEREWOLVES = 'WEREWOLVES',
    VILLAGERS = 'VILLAGERS',
    SOLO = 'SOLO',
    SPECIAL = 'SPECIAL'
}

export interface Role {
    name: string;
    team: Team;
    description: string;
    variants?: string[]; // Variantes d'orthographe
}

export const ROLES: Role[] = [
    // Loups
    { 
        name: 'Loup-garou', 
        team: Team.WEREWOLVES, 
        description: 'Un loup-garou basique',
        variants: ['loup garou', 'loupgarou', 'loup', 'lg']
    },
    { 
        name: 'Infect Père des loups', 
        team: Team.WEREWOLVES, 
        description: 'Peut infecter un villageois',
        variants: ['infect père des loups', 'infectperedesloups', 'infect-père-des-loups', 'ippl']
    },
    { 
        name: 'Grand Méchant Loup', 
        team: Team.WEREWOLVES, 
        description: 'Peut tuer deux fois',
        variants: ['grand mechant loup', 'grand-méchant-loup', 'grandmechantloup', 'gml'] 
    },
    { 
        name: 'Loup blanc', 
        team: Team.WEREWOLVES, 
        description: 'Peut tuer un autre loup',
        variants: ['loup-blanc', 'loupblanc', 'lb'] 
    },
    { 
        name: 'Loup solitaire', 
        team: Team.SOLO, 
        description: 'Joue pour son compte',
        variants: ['loup-solitaire', 'loupsolitaire', 'ls']
    },
    
    // Villageois spéciaux
    { name: 'Voyante', team: Team.VILLAGERS, description: 'Peut voir les rôles' },
    { name: 'Sorcière', team: Team.VILLAGERS, description: 'Peut sauver ou tuer' },
    { name: 'Chasseur', team: Team.VILLAGERS, description: 'Peut tuer en mourant' },
    { name: 'Ancien', team: Team.VILLAGERS, description: 'Survit à une attaque' },
    
    // Sœurs
    { name: 'Sœur Rouge', team: Team.VILLAGERS, description: 'Sœur avec pouvoir spécial' },
    { name: 'Sœur Bleue', team: Team.VILLAGERS, description: 'Sœur avec pouvoir spécial' },
    { name: 'Frère Vert', team: Team.VILLAGERS, description: 'Frère avec pouvoir spécial' },
    { name: 'Frère Jaune', team: Team.VILLAGERS, description: 'Frère avec pouvoir spécial' },
    
    // Rôles spéciaux
    { 
        name: 'Chien-loup', 
        team: Team.VILLAGERS, // Par défaut, il est villageois
        description: 'Peut choisir son camp',
        variants: ['chien loup', 'chienloup', 'cl']
    },
    { 
        name: 'Enfant sauvage', 
        team: Team.VILLAGERS, // Par défaut, il est villageois
        description: 'Copie le rôle de son maître',
        variants: ['enfant-sauvage', 'enfantsauvage', 'es']
    },
    { name: 'Villageois', team: Team.VILLAGERS, description: 'Rôle basique' }
]; 

export function getTeamByRoleName(roleName: string, login?: string): Team | undefined {
    if (!roleName) {
        
        return undefined;
    }
    
    // Normaliser les deux chaînes pour la comparaison
    const normalizeString = (str: string) => 
        str.toLowerCase()
           .normalize('NFD')
           .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
           .replace(/œ/g, 'oe') // Remplacer œ par oe
           .trim();
    
    const normalizedRoleName = normalizeString(roleName);
    
    // Vérifier d'abord si c'est un Chien-Loup qui a choisi le camp des loups
    if (login && normalizedRoleName === 'chien-loup') {
        const chienLoupState = get(chienLoupStates)[login];
        if (chienLoupState?.hasChosen && chienLoupState.camp === 'loups') {
            return Team.WEREWOLVES;
        }
    }
    
    // Vérifier d'abord la correspondance exacte
    const exactMatch = ROLES.find(role => normalizeString(role.name) === normalizedRoleName);
    if (exactMatch) {
        return exactMatch.team;
    }
    
    // Ensuite vérifier les variantes
    const variantMatch = ROLES.find(role => 
        role.variants?.some(variant => normalizeString(variant) === normalizedRoleName)
    );
    if (variantMatch) {
        return variantMatch.team;
    }
    
    // Si toujours pas de correspondance, essayer de trouver un match partiel
    const partialMatch = ROLES.find(role => {
        // Vérifier si le rôle contient le texte normalisé
        if (normalizeString(role.name).includes(normalizedRoleName)) return true;
        
        // Vérifier les variantes également
        return role.variants?.some(variant => 
            normalizeString(variant).includes(normalizedRoleName)
        );
    });
    
    if (partialMatch) {
        console.log('getTeamByRoleName: Found partial match:', partialMatch);
    } else {
        console.log('getTeamByRoleName: No match found for role:', roleName);
    }
    
    return partialMatch?.team;
}