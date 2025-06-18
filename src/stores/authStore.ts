import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { users } from './usersStore';
import type { User } from './types';

// Define a type for User without password
type UserWithoutPassword = Omit<User, 'password'>;

// Création du store avec l'utilisateur initial
export const currentUser = writable<UserWithoutPassword | null>(null);

// Vérifie si localStorage est disponible et charge l'utilisateur enregistré
function loadUser() {
    if (browser) {
        try {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                users.setCurrentUser(userData.login);
                return userData;
            }
        } catch (error) {
            console.warn('Could not load user from localStorage:', error);
        }
    }
    return null;
}

// Initialisation de l'utilisateur
if (browser) {
    currentUser.set(loadUser());
}

// Fonction de connexion
export function login(login: string, password: string): boolean {
    try {
        const foundUser = users.getUserByLogin(login);
        if (!foundUser) {
            console.warn('User not found:', login);
            return false;
        }
        
        if (foundUser.password !== password) {
            console.warn('Invalid password for user:', login);
            return false;
        }

        // Supprimer le mot de passe avant de stocker l'utilisateur
        const { password: _, ...userData } = foundUser;
        currentUser.set(userData);
        
        // Marquer l'utilisateur comme courant dans la liste des utilisateurs
        users.setCurrentUser(login);

        if (browser) {
            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('currentUserLogin', login);
        }

        return true;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

// Fonction de déconnexion
export function logout(): void {
    currentUser.set(null);
    users.setCurrentUser(null);
    if (browser) {
        try {
            localStorage.removeItem('currentUser');
        } catch (error) {
            console.warn('Logout error:', error);
        }
    }
} 