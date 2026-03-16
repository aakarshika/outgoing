import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';

type AuthHighlight = {
  icon: ReactNode;
  title: string;
  description: string;
};

type AuthStat = {
  label: string;
  value: string;
};

type AuthSimpleLayoutProps = {
  mode: 'signin' | 'signup';
  heroEyebrow: string;
  heroTitle: ReactNode;
  heroDescription: string;
  heroChips: string[];
  highlights: AuthHighlight[];
  stats: AuthStat[];
  formEyebrow: string;
  formTitle: string;
  formDescription: string;
  alternatePrompt: string;
  alternateLinkLabel: string;
  alternateLinkTo: string;
  children: ReactNode;
};

export const authFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '18px',
    background: '#fff',
    transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
    '& fieldset': {
      borderColor: 'rgba(87, 63, 38, 0.16)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(216, 90, 48, 0.45)',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 4px rgba(216, 90, 48, 0.10)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#D85A30',
      borderWidth: '1px',
    },
  },
  '& .MuiOutlinedInput-input': {
    px: 1.75,
    py: 1.65,
  },
  '& .MuiInputLabel-root': {
    color: 'var(--color-text-secondary)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#D85A30',
  },
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
    marginRight: 0,
  },
} as const;

function AuthFormPanel({
  formEyebrow,
  formTitle,
  formDescription,
  alternatePrompt,
  alternateLinkLabel,
  alternateLinkTo,
  children,
}: Pick<
  AuthSimpleLayoutProps,
  | 'formEyebrow'
  | 'formTitle'
  | 'formDescription'
  | 'alternatePrompt'
  | 'alternateLinkLabel'
  | 'alternateLinkTo'
  | 'children'
>) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          width: '100%',
          border: '0.5px solid var(--color-border-tertiary)',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 30px 80px rgba(73, 46, 21, 0.10)',
          p: { xs: 3, md: 4 },
        }}
      >
        <Typography
          onClick={() => (window.location.href = '/')}
          sx={{
            cursor: 'pointer',
            flexDirection: 'row',
            display: 'flex',
            alignItems: 'center',
            mt: 2,
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: { xs: 24, sm: 32 },
            letterSpacing: '-0.03em',
            color: '#D85A30',
            whiteSpace: 'nowrap',
            maxWidth: 580,
            mx: 'auto',
            lineHeight: 1.65,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Syne, sans-serif',
              fontSize: { xs: 24, sm: 32 },
              fontWeight: 800,
              color: '#4e4542',
              marginRight: '4px',
            }}
          >
            {formTitle}
          </Typography>
          out
          <Box
            component="span"
            aria-label="go"
            role="img"
            sx={{
              display: 'inline-block',
              width: { xs: 30, md: 36 },
              height: { xs: 30, md: 35 },
              // pt: 7,
              // mx: 0.5,
              transform: 'translateY(10px)',
              backgroundColor: 'currentColor',
              maskImage: "url('/assets/go-symbol.png')",
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              maskSize: 'contain',
              WebkitMaskImage: "url('/assets/go-symbol.png')",
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              WebkitMaskSize: 'contain',
            }}
          />
          {''}
          <strong>ing</strong>
        </Typography>
        <Box sx={{ mt: 3 }}>{children}</Box>

        <Typography
          sx={{
            mt: 3,
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: 14,
          }}
        >
          {alternatePrompt}{' '}
          <Box
            component={RouterLink}
            to={alternateLinkTo}
            sx={{
              color: '#D85A30',
              fontSize: 20,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {alternateLinkLabel}
            <ArrowOutwardIcon sx={{ fontSize: 16 }} />
          </Box>
        </Typography>
      </Box>
    </Box>
  );
}

function AuthInfoPanel({
  heroEyebrow,
  heroTitle,
  heroDescription,
  heroChips,
  highlights,
  stats,
}: Pick<
  AuthSimpleLayoutProps,
  'heroEyebrow' | 'heroTitle' | 'heroDescription' | 'heroChips' | 'highlights' | 'stats'
>) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 3, md: 4.5 },
        background: 'linear-gradient(180deg, #D85A30 0%, #C44B21 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: { xs: 'auto', lg: 720 },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          top: -90,
          right: -40,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          bottom: -120,
          left: -70,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography
          sx={{
            fontFamily: 'Syne, sans-serif',
            fontSize: { xs: 34, md: 52 },
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: '-0.05em',
            maxWidth: 620,
          }}
        >
          {heroTitle}
        </Typography>
        <Typography
          sx={{
            mt: 2,
            maxWidth: 560,
            color: 'rgba(255,255,255,0.82)',
            fontSize: { xs: 15, md: 17 },
            lineHeight: 1.65,
          }}
        >
          {heroDescription}
        </Typography>

        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 3 }}>
          {heroChips.map((chip) => (
            <Chip
              key={chip}
              label={chip}
              sx={{
                background: 'rgba(255,255,255,0.14)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
            />
          ))}
        </Stack>
      </Box>

      <Stack spacing={1.5} sx={{ position: 'relative', zIndex: 1, mt: 4 }}>
        {highlights.map((highlight) => (
          <Box
            key={highlight.title}
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-start',
              p: 2,
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '16px',
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(255,255,255,0.16)',
                flexShrink: 0,
              }}
            >
              {highlight.icon}
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: 16,
                  mb: 0.5,
                }}
              >
                {highlight.title}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
                {highlight.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: `repeat(${stats.length}, 1fr)` },
          gap: 1.25,
          mt: 4,
        }}
      >
        {stats.map((stat) => (
          <Box
            key={stat.label}
            sx={{
              p: 2,
              borderRadius: '22px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: 24,
                letterSpacing: '-0.03em',
              }}
            >
              {stat.value}
            </Typography>
            <Typography sx={{ mt: 0.5, color: 'rgba(255,255,255,0.76)' }}>
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function AuthSimpleLayout({
  mode,
  heroEyebrow,
  heroTitle,
  heroDescription,
  heroChips,
  highlights,
  stats,
  formEyebrow,
  formTitle,
  formDescription,
  alternatePrompt,
  alternateLinkLabel,
  alternateLinkTo,
  children,
}: AuthSimpleLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, var(--color-background-primary) 0%, #FFF8F1 52%, var(--color-background-secondary) 100%)',
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: 1200 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'minmax(420px, 0.92fr) minmax(0, 1.08fr)',
            },
            alignItems: 'stretch',
          }}
        >
          <AuthFormPanel
            formEyebrow={formEyebrow}
            formTitle={formTitle}
            formDescription={formDescription}
            alternatePrompt={alternatePrompt}
            alternateLinkLabel={alternateLinkLabel}
            alternateLinkTo={alternateLinkTo}
          >
            {children}
          </AuthFormPanel>

          <AuthInfoPanel
            heroEyebrow={heroEyebrow}
            heroTitle={heroTitle}
            heroDescription={heroDescription}
            heroChips={heroChips}
            highlights={highlights}
            stats={stats}
          />
        </Box>
      </Container>
    </Box>
  );
}
