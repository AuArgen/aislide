import { UserRole } from '@/types/auth';

export interface UserLimit {
    maxPresentations: number;
    label: string;
}

/**
 * Returns the presentation limits for a given user role.
 * 
 * Logic:
 * - admin: Unlimited (Infinity)
 * - teacher (External Subscription): 1 (as per user request)
 * - user (Free/Default): 3
 */
export function getRoleLimits(role: UserRole | string): UserLimit {
    const normalizedRole = role.toLowerCase();

    if (normalizedRole === 'admin') {
        return {
            maxPresentations: Infinity,
            label: 'Администратор (Чексиз)'
        };
    }

    if (normalizedRole === 'teacher') {
        return {
            maxPresentations: 1,
            label: 'Мугалим (Подписка: 1 жолу)'
        };
    }

    // Default for 'user' or unknown roles
    return {
        maxPresentations: 3,
        label: 'Акысыз (3 презентация)'
    };
}

/**
 * Checks if a user can create another presentation based on their current count.
 */
export function canCreatePresentation(currentCount: number, role: UserRole | string, hasCustomApiKey: boolean = false): boolean {
    if (hasCustomApiKey) return true
    const { maxPresentations } = getRoleLimits(role)
    return currentCount < maxPresentations
}
