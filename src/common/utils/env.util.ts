export const requiredEnv = (name: string): string => { const value = process.env[name]; if (!value) throw new Error(`Missing required env ${name}`); return value; };
export const optionalEnv = (name: string, fallback = ''): string => process.env[name] ?? fallback;
