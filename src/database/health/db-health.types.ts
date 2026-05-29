export interface DependencyHealth { name: string; status: 'up' | 'down'; latencyMs?: number; error?: string; }
