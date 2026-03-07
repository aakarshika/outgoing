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

// Add custom scrapbook style tokens for use with spread operator in SX/styles
// We use 'as any' here to bypass MUI's Theme interface restrictions for custom properties
(scrapbookTheme as any).paperCard = {
    backgroundColor: '#fdfdfd',
    backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    border: '1px solid #333',
    boxShadow: '4px 4px 0px #333',
    position: 'relative',
};

(scrapbookTheme as any).stickyNote = {
    backgroundColor: '#fff9e6',
    backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.01) 1px, transparent 1px)',
    backgroundSize: '100% 20px',
    border: '1px solid #eab308',
    boxShadow: '3px 3px 10px rgba(0,0,0,0.1)',
    position: 'relative',
    padding: '1rem',
};

(scrapbookTheme as any).border = {
    border: '2px solid #333',
    boxShadow: '3px 4px 0px #333',
};
