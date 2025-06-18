export interface User {
    login: string;
    password: string;
    firstName: string;
    lastName?: string;
    isAdmin: boolean;
    isCurrentUser?: boolean;
    isAlive: boolean;
    role?: string;
    photoUrl?: string;
    photoPlaceholder?: string;
    isMayor?: boolean;
  }
  