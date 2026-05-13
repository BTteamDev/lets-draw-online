export type UserRole = 'admin' | 'owner' | 'editor' | 'viewer';

export interface UserProfile {
    id: string;
    username: string;
    avatarUrl: string;
    role: UserRole;
    isOnline: boolean;
    isMuted?: boolean;
}