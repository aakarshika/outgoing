import {
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { Edit3, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Media } from '@/components/ui/media';
import { PostItNote } from '@/components/ui/PostItNote';
import { ProprietorCard } from '@/components/ui/ProprietorCard';
import { useAuth } from '@/features/auth/hooks';
import { EventCard } from '@/features/events/EventCard';
import { useMyEvents } from '@/features/events/hooks';
import { useVendorService } from '@/features/vendors/hooks';

const CATEGORY_GROUPS: Record<string, string> = {
  DJ: 'Music & Entertainment',
  Band: 'Music & Entertainment',
  Musician: 'Music & Entertainment',
  Singer: 'Music & Entertainment',
  MC: 'Music & Entertainment',
  Catering: 'Food & Beverage',
  Chef: 'Food & Beverage',
  Bartender: 'Food & Beverage',
  Barist: 'Food & Beverage',
  Bakery: 'Food & Beverage',
  Photographer: 'Photography & Media',
  Videographer: 'Photography & Media',
  Photography: 'Photography & Media',
  'Content Creator': 'Photography & Media',
  Venue: 'Venue & Decor',
  Studio: 'Venue & Decor',
  Florist: 'Venue & Decor',
  Decor: 'Venue & Decor',
  Logistics: 'Event Logistics',
  Security: 'Event Logistics',
  Transport: 'Event Logistics',
  Valet: 'Event Logistics',
};

const THEMES: Record<string, any> = {
  'Music & Entertainment': {
    paper: { bgcolor: '#fff', border: '3px solid #1a1a1a' },
    title: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 900,
      textTransform: 'uppercase',
    },
    halftone: 0.08,
    borderStyle: '3px solid #1a1a1a',
    tagColor: '#1a1a1a',
  },
  'Food & Beverage': {
    paper: { bgcolor: '#fffcf2', border: '1px solid #d4a373' },
    title: {
      fontFamily: '"Playfair Display", serif',
      fontStyle: 'italic',
      fontWeight: 700,
    },
    halftone: 0.03,
    borderStyle: '1px solid #d4a373',
    tagColor: '#d4a373',
  },
  'Photography & Media': {
    paper: { bgcolor: '#1a1a1a', color: '#fff', border: '5px solid #333' },
    title: {
      fontFamily: 'monospace',
      fontWeight: 900,
      textTransform: 'uppercase',
      color: '#fff',
    },
    halftone: 0,
    borderStyle: '2px solid #555',
    tagColor: '#fff',
    labelBg: '#fff',
    labelColor: '#000',
  },
  'Venue & Decor': {
    paper: {
      bgcolor: '#fff',
      border: '1px solid #ccc',
      backgroundImage:
        'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    },
    title: {
      fontFamily: '"Playfair Display", serif',
      letterSpacing: '2px',
      fontWeight: 800,
    },
    halftone: 0.02,
    borderStyle: '1px solid #ccc',
    tagColor: '#666',
  },
  'Event Logistics': {
    paper: { bgcolor: '#fef3c7', border: '2px dashed #92400e' },
    title: {
      fontFamily: '"Courier New", monospace',
      fontWeight: 900,
      textTransform: 'uppercase',
    },
    halftone: 0.05,
    borderStyle: '2px dashed #92400e',
    tagColor: '#92400e',
  },
  Other: {
    paper: { bgcolor: '#fff', border: '1px solid #1a1a1a' },
    title: { fontFamily: '"Playfair Display", serif', fontWeight: 900 },
    halftone: 0.05,
    borderStyle: '1px solid #1a1a1a',
    tagColor: '#1a1a1a',
  },
};

const getCategoryGroup = (cat: string) => {
  const found = Object.entries(CATEGORY_GROUPS).find(([key]) =>
    (cat || '').toLowerCase().includes(key.toLowerCase()),
  );
  return found ? found[1] : 'Other';
};

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: serviceResponse, isLoading, isError } = useVendorService(Number(id));
  const service = serviceResponse?.data;

  // For "Attach a Need" flow
  const [isNeedDialogOpen, setIsNeedDialogOpen] = useState(false);
  const { data: myEventsResponse } = useMyEvents();
  const myEventsWithNeeds =
    myEventsResponse?.data?.filter((e: any) => e.needs?.length > 0) || [];

  if (isLoading) {
    return <Box sx={{ p: 8, textAlign: 'center' }}>Loading the Classifieds...</Box>;
  }

  if (isError || !service) {
    return (
      <Box sx={{ p: 8, textAlign: 'center', fontFamily: '"Playfair Display", serif' }}>
        <Typography
          variant="h4"
          sx={{ mb: 2, fontWeight: 900, textTransform: 'uppercase' }}
        >
          Classified Ad Not Found
        </Typography>
        <Typography sx={{ mb: 4, fontStyle: 'italic', fontFamily: 'serif' }}>
          We couldn't locate the requested service in our records.
        </Typography>
        <Button
          component={Link}
          to="/vendors"
          sx={{
            color: '#1a1a1a',
            borderBottom: '1px solid #1a1a1a',
            borderRadius: 0,
            fontWeight: 'bold',
          }}
        >
          RETURN TO DIRECTORY
        </Button>
      </Box>
    );
  }

  const isOwner = user?.id === service.vendor_id;
  const rating = service.avg_rating || 5;

  const group = getCategoryGroup(service.category);
  const theme = THEMES[group];

  return (
    <Box
      sx={{
        bgcolor: '#e5e5e0', // Aged paper color
        minHeight: '100vh',
        py: 6,
        fontFamily: 'serif',
      }}
    >
      <Container maxWidth="lg">
        {/* Newspaper Header */}
        <Box
          sx={{ textAlign: 'center', mb: 6, borderBottom: '4px solid #1a1a1a', pb: 2 }}
        >
          <Typography
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 900,
              fontSize: { xs: '2.5rem', sm: '4rem' },
              letterSpacing: '-2px',
              textTransform: 'uppercase',
              lineHeight: 1,
              color: '#1a1a1a',
            }}
          >
            The Outgoing Gazette
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid #1a1a1a',
              mt: 1,
              py: 0.5,
            }}
          >
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
              VOL. LXXXIV ... NO. 28,492
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
              {new Date()
                .toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
                .toUpperCase()}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
              PRICE: TWO CENTS
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {/* Main Content: The Classified Ad */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Paper
              sx={{
                p: 6,
                minHeight: '80vh',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '10px 10px 0px rgba(0,0,0,0.05)',
                ...theme.paper,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  opacity: theme.halftone,
                  pointerEvents: 'none',
                  backgroundImage: 'radial-gradient(circle, #000 1px, transparent 0)',
                  backgroundSize: '3px 3px',
                  zIndex: 0,
                }}
              />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                {/* Top Bar of the Ad */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 4,
                    borderBottom: '1px solid #eee',
                    pb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      bgcolor: theme.labelBg || '#1a1a1a',
                      color: theme.labelColor || '#fff',
                      px: 2,
                      py: 0.5,
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      border:
                        group === 'Photography & Media' ? '1px solid #fff' : 'none',
                    }}
                  >
                    CLASSIFIED AD #{400 + Number(id)}-B
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}
                    >
                      Section: {service.category}
                    </Typography>
                    {isOwner && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit3 size={14} />}
                        sx={{
                          borderColor: '#1a1a1a',
                          color: '#1a1a1a',
                          borderRadius: 0,
                          fontWeight: 'bold',
                        }}
                      >
                        EDIT AD
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Service Title */}
                <Typography
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    mb: 4,
                    lineHeight: 1,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '-1px',
                    ...theme.title,
                  }}
                >
                  {service.title}
                </Typography>

                <Grid container spacing={6}>
                  {/* Left Column: Vendor Profile (Internal to Ad) */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <ProprietorCard
                      vendor={{
                        vendor_name: service.vendor_name,
                        vendor_avatar: service.vendor_avatar,
                      }}
                      rating={rating}
                      tag={service.category}
                    />

                    <Box sx={{ mt: 3 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={() => setIsNeedDialogOpen(true)}
                        sx={{
                          bgcolor: theme.labelBg || '#1a1a1a',
                          color: theme.labelColor || '#fff',
                          borderRadius: 0,
                          fontWeight: 'bold',
                          mb: 1,
                          '&:hover': { bgcolor: theme.labelBg ? '#eee' : '#333' },
                        }}
                      >
                        HIRE ME
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Mail size={16} />}
                        sx={{
                          borderColor: theme.labelBg || '#1a1a1a',
                          color: theme.labelBg || '#1a1a1a',
                          borderRadius: 0,
                          fontWeight: 'bold',
                        }}
                      >
                        INQUIRE
                      </Button>
                    </Box>

                    {/* Vintage Decorations */}
                    <Box
                      sx={{
                        mt: 4,
                        pt: 4,
                        borderTop: '1px solid #1a1a1a',
                        opacity: 0.6,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.65rem',
                          fontStyle: 'italic',
                          textAlign: 'center',
                        }}
                      >
                        "A name you can trust for all your {service.category} needs.
                        Quality guaranteed by the Gazette's Seal of Approval."
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Right Column: Description & Media */}
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        sx={{
                          fontSize: '1.25rem',
                          lineHeight: 1.6,
                          fontFamily: 'serif',
                          mb: 4,
                          columnCount: { xs: 1, md: 1 },
                        }}
                      >
                        {service.description}
                      </Typography>

                      <Box
                        sx={{
                          width: '100%',
                          aspectRatio: '16/9',
                          border: `5px double ${theme.tagColor}`,
                          p: 0.5,
                          mb: 2,
                          filter:
                            group === 'Photography & Media'
                              ? 'none'
                              : 'grayscale(100%) contrast(110%) brightness(95%)',
                        }}
                      >
                        <Media
                          src={service.portfolio_image || ''}
                          alt={service.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          textAlign: 'center',
                          color: '#666',
                          fontStyle: 'italic',
                        }}
                      >
                        PLATE 1. A demonstration of the `{service.title}` in practice.
                      </Typography>
                    </Box>

                    {/* Review Section */}
                    <Box sx={{ mt: 8 }}>
                      <Typography
                        sx={{
                          fontFamily: '"Playfair Display", serif',
                          fontWeight: 900,
                          fontSize: '1.5rem',
                          borderBottom: '2px solid #1a1a1a',
                          mb: 6,
                          pb: 1,
                          textTransform: 'uppercase',
                        }}
                      >
                        Public Testimony & Reviews
                      </Typography>

                      <Grid container spacing={4}>
                        {service.reviews && service.reviews.length > 0 ? (
                          service.reviews.map((review, idx) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={review.id}>
                              <PostItNote
                                username={review.reviewer_username}
                                avatar={review.reviewer_avatar || undefined}
                                rating={review.rating}
                                comment={review.text}
                                color={
                                  ['#fff740', '#ffc0cb', '#add8e6', '#90ee90'][idx % 4]
                                }
                              />
                            </Grid>
                          ))
                        ) : (
                          <Box
                            sx={{
                              p: 4,
                              textAlign: 'center',
                              width: '100%',
                              opacity: 0.5,
                            }}
                          >
                            <Typography sx={{ fontStyle: 'italic' }}>
                              No public testimony available yet.
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>

                {/* Event History Section */}
                {service.past_events && service.past_events.length > 0 && (
                  <Box
                    sx={{ mt: 10, pt: 6, borderTop: `4px double ${theme.tagColor}` }}
                  >
                    <Typography
                      sx={{
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 900,
                        fontSize: '1.8rem',
                        mb: 4,
                        textTransform: 'uppercase',
                        textAlign: 'center',
                      }}
                    >
                      Service History & Accepted Applications
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        mb: 6,
                        fontStyle: 'italic',
                        maxWidth: '600px',
                        mx: 'auto',
                      }}
                    >
                      A record of events where this service was formally accepted and
                      performed.
                    </Typography>
                    <Grid container spacing={4}>
                      {service.past_events.map((event) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={event.id}>
                          <EventCard event={event} />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Attach a Need Dialog */}
      <Dialog
        open={isNeedDialogOpen}
        onClose={() => setIsNeedDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 0, border: '4px solid #1a1a1a' } }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#1a1a1a',
            color: '#fff',
            textAlign: 'center',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}
        >
          Select an Event Need
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, bgcolor: '#f5f5f5' }}>
            <Typography sx={{ fontSize: '0.9rem', mb: 2 }}>
              To hire <b>{service.vendor_name}</b>, please select which unfilled
              position they will be taking in your event.
            </Typography>

            {myEventsWithNeeds.length > 0 ? (
              <List sx={{ bgcolor: '#fff', border: '1px solid #ddd' }}>
                {myEventsWithNeeds.map((event: any) => (
                  <React.Fragment key={event.id}>
                    <Box sx={{ px: 2, py: 1, bgcolor: '#eee' }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {event.title}
                      </Typography>
                    </Box>
                    {event.needs
                      .filter((n: any) => n.status === 'open')
                      .map((need: any) => (
                        <ListItemButton key={need.id} divider sx={{ py: 1.5 }}>
                          <ListItemText
                            primary={need.title}
                            secondary={`Salary: $${need.salary || 'Negotiable'}`}
                            primaryTypographyProps={{ fontWeight: 'bold' }}
                          />
                          <Button
                            size="small"
                            variant="contained"
                            sx={{ bgcolor: '#1a1a1a', color: '#fff', borderRadius: 0 }}
                          >
                            ATTACH
                          </Button>
                        </ListItemButton>
                      ))}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 4,
                  bgcolor: '#fff',
                  border: '1px dashed #ccc',
                }}
              >
                <Typography sx={{ fontStyle: 'italic', color: '#666' }}>
                  No open needs found for your upcoming events.
                </Typography>
                <Button
                  component={Link}
                  to="/events/create"
                  sx={{ mt: 2, color: '#1a1a1a', textDecoration: 'underline' }}
                >
                  Create an Event Need First
                </Button>
              </Box>
            )}
          </Box>
          <Box sx={{ p: 2, textAlign: 'right', bgcolor: '#fff' }}>
            <Button onClick={() => setIsNeedDialogOpen(false)} sx={{ color: '#666' }}>
              CANCEL
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
