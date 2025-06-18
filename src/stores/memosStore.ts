import { writable, get } from 'svelte/store';
import { currentUser } from './authStore';
import type { User } from './types';

function createMemosStore() {
    const { subscribe, set, update } = writable<string[]>([]);

    // Charger les mémos au démarrage
    currentUser.subscribe(user => {
        if (user) {
            const savedMemos = localStorage.getItem(`memos-${user.login}`);
            try {
                const memos = savedMemos ? JSON.parse(savedMemos) : [];
                set(memos);
            } catch {
                set([]);
            }
        } else {
            set([]);
        }
    });

    return {
        subscribe,
        addMemo: (memo: string) => {
            update(memos => {
                const newMemos = [...memos, memo];
                const user = get(currentUser);
                if (user) {
                    localStorage.setItem(`memos-${user.login}`, JSON.stringify(newMemos));
                }
                return newMemos;
            });
        },
        deleteMemo: (index: number) => {
            update(memos => {
                const newMemos = memos.filter((_, i) => i !== index);
                const user = get(currentUser);
                if (user) {
                    localStorage.setItem(`memos-${user.login}`, JSON.stringify(newMemos));
                }
                return newMemos;
            });
        }
    };
}

export const memos = createMemosStore(); 