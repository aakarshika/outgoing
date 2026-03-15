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
          borderRadius: '32px',
          border: '0.5px solid var(--color-border-tertiary)',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 30px 80px rgba(73, 46, 21, 0.10)',
          p: { xs: 3, md: 4 },
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 700,
            color: '#D85A30',
          }}
        >
          {formEyebrow}
        </Typography>
        <Typography
          sx={{
            mt: 1,
            fontFamily: 'Syne, sans-serif',
            fontSize: { xs: 28, md: 36 },
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.04em',
            color: 'var(--color-text-primary)',
          }}
        >
          {formTitle}
        </Typography>
        <Typography
          sx={{
            mt: 1.25,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.65,
            maxWidth: 460,
          }}
        >
          {formDescription}
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
        borderRadius: '36px',
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
        <Chip
          label={heroEyebrow}
          sx={{
            mb: 2.5,
            background: 'rgba(255,255,255,0.18)',
            color: '#fff',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        />
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
      <Box
        component="nav"
        sx={{
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          background: 'rgba(255, 253, 249, 0.82)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Container
          maxWidth={false}
          sx={{ maxWidth: 1200, px: { xs: 2, md: 4 }, py: 2 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Box
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: 22,
                  color: '#D85A30',
                  letterSpacing: '-0.03em',
                }}
              >
                outgoing
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.25}>
              <Button
                component={RouterLink}
                to="/signin"
                variant={mode === 'signin' ? 'contained' : 'outlined'}
                sx={{
                  borderRadius: '999px',
                  px: 2.25,
                  textTransform: 'none',
                  borderColor:
                    mode === 'signin' ? '#D85A30' : 'var(--color-border-secondary)',
                  background: mode === 'signin' ? '#D85A30' : 'transparent',
                  color: mode === 'signin' ? '#fff' : 'var(--color-text-primary)',
                  boxShadow: 'none',
                }}
              >
                Log in
              </Button>
              <Button
                component={RouterLink}
                to="/signup"
                variant={mode === 'signup' ? 'contained' : 'outlined'}
                sx={{
                  borderRadius: '999px',
                  px: 2.25,
                  textTransform: 'none',
                  borderColor:
                    mode === 'signup' ? '#D85A30' : 'var(--color-border-secondary)',
                  background: mode === 'signup' ? '#D85A30' : 'transparent',
                  color: mode === 'signup' ? '#fff' : 'var(--color-text-primary)',
                  boxShadow: 'none',
                }}
              >
                Join free
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container
        maxWidth={false}
        sx={{ maxWidth: 1200, px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'minmax(420px, 0.92fr) minmax(0, 1.08fr)',
            },
            gap: 3,
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
