export type SystemRole = 'superadmin' | 'admin' | 'dev' | 'mod' | 'editor' | 'viewer';
export type RoomRole = 'owner' | 'editor' | 'viewer';
export type ToolType = 'brush' | 'eraser' | 'rect' | 'circle' | 'line' | 'picker';
export type NotifyType = 'error' | 'warning' | 'info' | 'success';

export interface UserTag {
    id: string;
    name: string;
    label: string;
    color: string;
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatarUrl: string;
    systemRole: SystemRole;
    roomRole: RoomRole;
    color?: string;
    tags?: UserTag[];
    isOnline: boolean;
    note?: string;
    isBanned?: boolean;
    isMuted?: boolean;
    isShadowed?: boolean;
}

export interface AdminUser {
    _id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    role: string;
    note?: string;
    isBanned?: boolean;
    isMuted?: boolean;
}

export interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    text: string;
    timestamp: string;
    role: SystemRole;
}

export interface DrawPoint {
    x: number;
    y: number;
}

export interface StrokeSettings {
    color: string;
    width: number;
}

export interface Line {
    points: DrawPoint[];
    color: string;
    width: number;
    tool: ToolType;
    opacity: number;
}

export interface CanvasState {
    lines: Line[];
    isDrawing: boolean;
    currentColor: string;
    currentWidth: number;
}

export interface BoardPreview {
    _id: string;
    title: string;
    isPrivate: boolean;
    creator: {
        _id: string;
        username: string;
        avatarUrl?: string;
        systemRole: SystemRole;
    };
    createdAt: string;
    updatedAt: string,
    previewUrl?: string;
    likes?: string[];
    usersCount?: number;
}

export interface Notification {
    id: string;
    type: NotifyType;
    message: string;
    timeout?: number;
}