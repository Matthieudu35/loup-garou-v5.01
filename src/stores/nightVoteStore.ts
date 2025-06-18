import { writable } from 'svelte/store';

// À définir plus tard : votes des loups, pouvoirs nocturnes...

export const nightVotes = writable<Record<string, string>>({});

// Tu ajouteras ici les fonctions : setNightVote, resetNightVotes, getNightResult, etc.
