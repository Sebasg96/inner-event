/**
 * Centralized permissions for the 4-role system:
 * SUPERADMIN > ADMIN > DIRECTOR > COLLABORATOR
 */

export type AppRole = 'SUPERADMIN' | 'ADMIN' | 'DIRECTOR' | 'COLLABORATOR';

// --- Role hierarchy (higher number = more permissions) ---
const ROLE_LEVEL: Record<AppRole, number> = {
    SUPERADMIN: 4,
    ADMIN: 3,
    DIRECTOR: 2,
    COLLABORATOR: 1,
};

/** Check if role has at least the given minimum level */
function hasMinRole(role: string | undefined | null, minRole: AppRole): boolean {
    if (!role) return false;
    const level = ROLE_LEVEL[role as AppRole];
    const minLevel = ROLE_LEVEL[minRole];
    if (level === undefined || minLevel === undefined) return false;
    return level >= minLevel;
}

// --- Permission functions ---

/** Can manage users (invite, change roles, delete) — ADMIN+ */
export function canManageUsers(role: string | undefined | null): boolean {
    return hasMinRole(role, 'ADMIN');
}

/** Can edit strategy (create/edit/delete Purpose, Mega, Objectives, KRs, Axes, Initiatives, Weights) — DIRECTOR+ */
export function canEditStrategy(role: string | undefined | null): boolean {
    return hasMinRole(role, 'DIRECTOR');
}

/** Can record KR updates — ALL roles */
export function canUpdateKR(role: string | undefined | null): boolean {
    return hasMinRole(role, 'COLLABORATOR');
}

/** Modules accessible by each role */
const MODULE_ACCESS: Record<AppRole, string[]> = {
    SUPERADMIN: ['dashboard', 'strategy', 'capacities', 'analytics', 'reports', 'emergent', 'rituals', 'admin'],
    ADMIN: ['dashboard', 'strategy', 'capacities', 'analytics', 'reports', 'emergent', 'rituals', 'admin'],
    DIRECTOR: ['dashboard', 'strategy', 'capacities', 'analytics', 'reports', 'emergent', 'rituals'],
    COLLABORATOR: ['dashboard', 'strategy'],
};

/** Check if a role can access a given module */
export function canAccessModule(role: string | undefined | null, module: string): boolean {
    if (!role) return false;
    const modules = MODULE_ACCESS[role as AppRole];
    if (!modules) return false;
    return modules.includes(module);
}

/** Get the list of accessible modules for a role */
export function getAccessibleModules(role: string | undefined | null): string[] {
    if (!role) return [];
    return MODULE_ACCESS[role as AppRole] || [];
}

/** Map a URL path to a module name */
export function pathToModule(path: string): string | null {
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/strategy')) return 'strategy';
    if (path.startsWith('/capacities')) return 'capacities';
    if (path.startsWith('/analytics')) return 'analytics';
    if (path.startsWith('/reports')) return 'reports';
    if (path.startsWith('/emergent')) return 'emergent';
    if (path.startsWith('/rituals')) return 'rituals';
    if (path.startsWith('/admin')) return 'admin';
    return null;
}
