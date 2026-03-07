import { createTheme } from '@mui/material/styles';

export const scrapbookTheme = createTheme({
    typography: {
        fontFamily: '"Inter", sans-serif',
        h1: {
            fontFamily: '"Permanent Marker", cursive',
            transform: 'rotate(-1deg)',
        },
        h2: {
            fontFamily: '"Permanent Marker", cursive',
        },
        h3: {
            fontFamily: '"Permanent Marker", cursive',
        },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '4px 4px 15px rgba(0,0,0,0.15)',
                    borderRadius: '2px', // Sharper corners like cut paper
                    border: '1px solid rgba(0,0,0,0.05)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '4px',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                },
            },
        },
    },
    palette: {
        primary: {
            main: '#2563eb', // Electric Blue for ticketing
        },
        success: {
            main: '#16a34a', // Vibrant Green for live
        },
        warning: {
            main: '#fbbf24', // Soft Amber for completed
        },
        error: {
            main: '#dc2626', // Crimson for cancelled
        },
    },
});
