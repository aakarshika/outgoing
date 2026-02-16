export type CSSVariables = Record<string, string>;

// Route themes only override accent colors (e.g. primary). Do NOT override
// --background or --foreground so light/dark mode from index.css is preserved.
export const GlobalThemes: Record<string, CSSVariables> = {
    default: {},
    'profile-theme': {
        '--primary': '262.1 83.3% 57.8%', // Purple primary for profile
    },
    'auth-theme': {
        '--primary': '24.6 95% 53.1%', // Orange primary for auth
    },
};
