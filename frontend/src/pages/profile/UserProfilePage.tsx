import {
  Box,
  Chip,
  Grid,
  IconButton,
  Paper,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Award, Briefcase, Heart, MapPin, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { Media } from '@/components/ui/media';
import { PostItNote } from '@/components/ui/PostItNote';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';

import { ProfileService } from './Profile.service';

// Scrapbook components
const WashiTape = ({ color = 'rgba(251, 191, 36, 0.5)', rotate = '3deg' }) => (
  <Box
    sx={{
      position: 'absolute',
      top: -10,
      left: '20%',
      width: 100,
      height: 30,
      bgcolor: color,
      backdropFilter: 'blur(2px)',
      border: '1px solid rgba(0,0,0,0.05)',
      transform: `rotate(${rotate})`,
      zIndex: 1,
      pointerEvents: 'none',
    }}
  />
);

const PolaroidFrame = ({
  src,
  caption,
  rotation,
  onClick,
}: {
  src: string | null;
  caption?: string;
  rotation?: number;
  onClick?: () => void;
}) => {
  const rot = rotation ?? Math.random() * 8 - 4;
  return (
    <Paper
      elevation={3}
      onClick={onClick}
      sx={{
        p: 1.5,
        pb: 6,
        bgcolor: 'white',
        transform: `rotate(${rot}deg)`,
        transition: 'transform 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': { transform: 'scale(1.05) rotate(0deg)', zIndex: 10 },
        maxWidth: '100%',
        border: '1px solid #efefef',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          aspectRatio: '1/1',
          bgcolor: '#f0f0f0',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Media
          src={src || undefined}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Box>
      {caption && (
        <Typography
          sx={{
            fontFamily: '"Permanent Marker", cursive',
            fontSize: '1rem',
            mt: 2,
            textAlign: 'center',
            lineHeight: 1.2,
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}
        >
          {caption}
        </Typography>
      )}
    </Paper>
  );
};

const StickerBadge = ({ icon: Icon, label, color, rotation }: any) => {
  const rot = rotation ?? Math.random() * 10 - 5;
  return (
    <Paper
      elevation={2}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        py: 1,
        px: 2,
        bgcolor: color,
        borderRadius: '20px',
        transform: `rotate(${rot}deg)`,
        border: '2px solid white',
        fontFamily: '"Permanent Marker", cursive',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={18} />
      <Typography sx={{ fontFamily: 'inherit', fontSize: '0.9rem' }}>
        {label}
      </Typography>
    </Paper>
  );
};

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['publicProfile', username],
    queryFn: () => ProfileService.getPublicProfile(username!),
    enabled: !!username,
  });

  if (isLoading)
    return <Box sx={{ p: 4, textAlign: 'center' }}>Loading scrapbook...</Box>;
  if (error || !response?.data)
    return <Box sx={{ p: 4, textAlign: 'center' }}>User not found!</Box>;

  const profile = response.data;

  const getIconForBadge = (iconName: string) => {
    switch (iconName) {
      case 'star':
        return Star;
      case 'award':
        return Award;
      case 'heart':
        return Heart;
      case 'briefcase':
        return Briefcase;
      case 'users':
        return Award;
      default:
        return Star;
    }
  };

  return (
    <ThemeProvider theme={scrapbookTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#f4f1ea', // Classic notebook background
          backgroundImage: 'radial-gradient(#d1d5db 0.5px, #f4f1ea 0.5px)',
          backgroundSize: '15px 15px',
          backgroundAttachment: 'fixed',
          p: { xs: 2, sm: 4, md: 8 },
          color: 'inherit',
          fontFamily: 'serif',
          overflowX: 'hidden',
        }}
      >
        <Box sx={{ maxWidth: '1000px', mx: 'auto', position: 'relative' }}>
          {/* Top navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <IconButton
              onClick={() => navigate(-1)}
              sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f0f0f0' }, boxShadow: 1 }}
            >
              <ArrowLeft />
            </IconButton>
          </Box>

          {/* Notebook Header */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              mb: 6,
              position: 'relative',
              bgcolor: '#fff',
              backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 100%)',
              backgroundSize: '100% 30px',
              border: '1px solid #ccc',
              borderRadius: '2px',
            }}
          >
            <WashiTape color="rgba(239, 68, 68, 0.4)" rotate="-5deg" />
            <Grid container spacing={4} alignItems="center">
              <Grid
                size={{ xs: 12, md: 4 }}
                sx={{ textAlign: 'center', position: 'relative' }}
              >
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    mx: 'auto',
                    border: '10px solid white',
                    boxShadow: 3,
                    transform: 'rotate(-3deg)',
                    position: 'relative',
                    bgcolor: '#f0f0f0',
                    overflow: 'hidden',
                  }}
                >
                  {profile.avatar ? (
                    <Media
                      src={profile.avatar || undefined}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Typography
                      sx={{
                        lineHeight: '180px',
                        fontFamily: '"Permanent Marker"',
                        color: '#999',
                      }}
                    >
                      NO PHOTO
                    </Typography>
                  )}
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Permanent Marker", cursive',
                    fontSize: '1.5rem',
                    mt: 2,
                    transform: 'rotate(-2deg)',
                  }}
                >
                  @{profile.username}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: '"Permanent Marker", cursive',
                    mb: 2,
                    fontSize: { xs: '2rem', md: '3.5rem' },
                    lineHeight: 1.1,
                  }}
                >
                  {profile.first_name || profile.username}'s Story
                </Typography>

                {profile.headline && (
                  <Typography
                    sx={{
                      fontSize: '1.25rem',
                      fontFamily: 'serif',
                      fontStyle: 'italic',
                      mb: 3,
                      borderLeft: '4px solid #fcd34d',
                      pl: 2,
                    }}
                  >
                    "{profile.headline}"
                  </Typography>
                )}

                {profile.location_city && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: '#4b5563',
                      mb: 3,
                    }}
                  >
                    <MapPin size={18} />
                    <Typography
                      sx={{
                        fontFamily: '"Courier New", monospace',
                        fontWeight: 'bold',
                      }}
                    >
                      {profile.location_city}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 3 }}>
                  {profile.badges?.map((badge: any) => (
                    <StickerBadge
                      key={badge.id}
                      icon={getIconForBadge(badge.icon)}
                      label={badge.label}
                      color={badge.color}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Main Content Areas */}
          <Grid container spacing={6}>
            {/* Left Column: Bio & Reviews */}
            <Grid size={{ xs: 12, md: 5 }}>
              {profile.showcase_bio && (
                <Box sx={{ mb: 6 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: '"Permanent Marker", cursive',
                      mb: 3,
                      transform: 'rotate(-1deg)',
                    }}
                  >
                    About Me
                  </Typography>
                  <Paper
                    sx={{
                      p: 4,
                      bgcolor: '#fef3c7',
                      position: 'relative',
                      transform: 'rotate(1deg)',
                    }}
                  >
                    <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                      {profile.showcase_bio}
                    </Typography>
                    <WashiTape color="rgba(59, 130, 246, 0.4)" rotate="10deg" />
                  </Paper>
                </Box>
              )}

              {profile.testimonials?.length > 0 && (
                <Box sx={{ mb: 6 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: '"Permanent Marker", cursive',
                      mb: 3,
                      transform: 'rotate(-2deg)',
                    }}
                  >
                    Sweet Words
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {profile.testimonials.map((t: any, idx: number) => (
                      <PostItNote
                        key={t.id}
                        username={t.reviewer_name}
                        avatar={t.reviewer_avatar}
                        rating={t.rating}
                        comment={t.text}
                        color={['#fff740', '#ff7eb9', '#7afcff', '#b5e61d'][idx % 4]}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>

            {/* Right Column: Events & Services */}
            <Grid size={{ xs: 12, md: 7 }}>
              {/* Hosted Events */}
              {profile.hosted_events?.length > 0 && (
                <Box sx={{ mb: 8 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: '"Permanent Marker", cursive',
                      mb: 3,
                      transform: 'rotate(1deg)',
                    }}
                  >
                    Parties Thrown
                  </Typography>
                  <Grid container spacing={3}>
                    {profile.hosted_events.map((event: any, idx: number) => (
                      <Grid size={{ xs: 6 }} key={event.id}>
                        <PolaroidFrame
                          src={event.cover_image || ''}
                          caption={event.title}
                          rotation={idx % 2 === 0 ? -3 : 2}
                          onClick={() => navigate(`/events/${event.id}/new`)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Attended Events */}
              {profile.attended_events?.length > 0 && (
                <Box sx={{ mb: 8 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: '"Permanent Marker", cursive',
                      mb: 3,
                      transform: 'rotate(-1deg)',
                    }}
                  >
                    Good Times Had
                  </Typography>
                  <Grid container spacing={3}>
                    {profile.attended_events.map((event: any, idx: number) => (
                      <Grid size={{ xs: 6, sm: 4 }} key={event.id}>
                        <PolaroidFrame
                          src={event.cover_image || ''}
                          caption={event.title}
                          rotation={idx % 2 === 0 ? 3 : -2}
                          onClick={() => navigate(`/events/${event.id}/new`)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Vendor Services */}
              {profile.services?.length > 0 && (
                <Box sx={{ mb: 8 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: '"Permanent Marker", cursive',
                      mb: 3,
                      pl: 2,
                      borderLeft: '4px solid #10b981',
                    }}
                  >
                    My Hustle
                  </Typography>
                  <Grid container spacing={3}>
                    {profile.services.map((service: any) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={service.id}>
                        <Paper
                          elevation={2}
                          onClick={() => navigate(`/services/${service.id}`)}
                          sx={{
                            p: 2,
                            bgcolor: '#fff',
                            border: '2px dashed #34d399',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#f0fdf4', transform: 'scale(1.02)' },
                            transition: 'all 0.2s',
                          }}
                        >
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: '4px',
                                overflow: 'hidden',
                                bgcolor: '#eee',
                              }}
                            >
                              {service.portfolio_image && (
                                <Media
                                  src={service.portfolio_image || undefined}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                />
                              )}
                            </Box>
                            <Box>
                              <Typography
                                sx={{
                                  fontWeight: 'bold',
                                  fontFamily: '"Courier New", monospace',
                                }}
                              >
                                {service.title}
                              </Typography>
                              <Chip
                                label={service.category}
                                size="small"
                                sx={{ mt: 1, bgcolor: '#10b981', color: 'white' }}
                              />
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
