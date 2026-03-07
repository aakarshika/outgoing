import { Box, Paper, ThemeProvider, Typography } from '@mui/material';
import {
  BellRing,
  Calendar,
  DollarSign,
  MapPin,
  PlusCircle,
  Search,
  Send,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ApplyToNeedModal } from '@/components/events/ApplyToNeedModal';
import { Button } from '@/components/ui/button';
import { getCategoryLabel } from '@/constants/categories';
import { scrapbookTheme } from '@/features/events/theme/scrapbookTheme';
import {
  useMyPotentialOpportunities,
  useMyVendorOpportunities,
} from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';
import type { VendorOpportunity } from '@/types/needs';

const CRITICALITY_STYLES: Record<string, { border: string; text: string; bg: string }> =
  {
    essential: { border: '#dc2626', text: '#dc2626', bg: 'rgba(220, 38, 38, 0.06)' },
    non_substitutable: {
      border: '#ea580c',
      text: '#ea580c',
      bg: 'rgba(234, 88, 12, 0.06)',
    },
    replaceable: { border: '#2563eb', text: '#2563eb', bg: 'rgba(37, 99, 235, 0.06)' },
  };

const CRITICALITY_LABELS: Record<string, string> = {
  essential: 'Essential',
  non_substitutable: 'Non-Substitutable',
  replaceable: 'Replaceable',
};

function formatBudget(min: string | null, max: string | null) {
  if (!min && !max) return 'Budget not specified';
  const left = min ? `$${Number(min).toLocaleString()}` : '$0';
  const right = max ? `$${Number(max).toLocaleString()}` : 'Flexible';
  return `${left} - ${right}`;
}

function formatStartsIn(start: string) {
  const ms = new Date(start).getTime() - Date.now();
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  if (hours <= 0) return 'Starting soon';
  if (hours < 24) return `Starts in ${hours}h`;
  const days = Math.ceil(hours / 24);
  return `Starts in ${days} day${days === 1 ? '' : 's'}`;
}

/* ---- Scrapbook Decorations ---- */

const WashiTape = ({
  color = 'rgba(251, 191, 36, 0.5)',
  rotate = '3deg',
  width = 80,
}) => (
  <Box
    sx={{
      position: 'absolute',
      top: -10,
      left: '50%',
      transform: `translateX(-50%) rotate(${rotate})`,
      width,
      height: 20,
      bgcolor: color,
      opacity: 0.8,
      zIndex: 2,
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      pointerEvents: 'none',
    }}
  />
);

/* ---- NeedCard as Classified Ad ---- */

interface NeedCardProps {
  opportunity: VendorOpportunity;
  isPotential?: boolean;
  onApply?: (o: VendorOpportunity) => void;
}

function NeedCard({ opportunity, isPotential = false, onApply }: NeedCardProps) {
  const navigate = useNavigate();
  const rotation = useMemo(() => (Math.random() * 2 - 1).toFixed(1), []);
  const critStyle =
    CRITICALITY_STYLES[opportunity.criticality] || CRITICALITY_STYLES.replaceable;

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: isPotential ? '#f0fdf4' : '#fdfdfd',
          backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px)',
          border: isPotential ? '1px dashed #16a34a' : '1px solid #333',
          outline: '3px solid transparent',
          position: 'relative',
          transform: `rotate(${rotation}deg)`,
          transition: 'all 0.3s ease',
          overflow: 'visible',
          '&:hover': {
            transform: `rotate(0deg) translateY(-3px)`,
            boxShadow: '5px 5px 15px rgba(0,0,0,0.12)',
            zIndex: 5,
          },
        }}
      >
        {/* Washi tape */}
        <WashiTape
          color={isPotential ? 'rgba(22, 163, 74, 0.35)' : 'rgba(37, 99, 235, 0.35)'}
          rotate={`${Math.random() * 10 - 5}deg`}
          width={60}
        />

        {/* Headline */}
        <Typography
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 900,
            textTransform: 'uppercase',
            borderBottom: '2px solid #333',
            mb: 1,
            fontSize: '0.95rem',
            lineHeight: 1.3,
            color: 'inherit',
          }}
        >
          HELP WANTED: {opportunity.need_title}
        </Typography>

        {/* Event link + badges row */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1,
            mb: 1.5,
          }}
        >
          <Typography
            component={Link}
            to={`/events/${opportunity.event_id}`}
            sx={{
              fontSize: '0.75rem',
              fontFamily: 'serif',
              fontStyle: 'italic',
              color: '#2563eb',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            📌 {opportunity.event_title}
          </Typography>

          {/* Category sticker */}
          <Box
            sx={{
              px: 1,
              py: 0.25,
              border: '1px dashed #ccc',
              bgcolor: '#fff',
              transform: 'rotate(2deg)',
              boxShadow: '1px 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.6rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {getCategoryLabel(opportunity.category)}
            </Typography>
          </Box>

          {/* Criticality stamp */}
          <Box
            sx={{
              px: 1,
              py: 0.25,
              border: `1.5px solid ${critStyle.border}`,
              borderRadius: '2px',
              transform: 'rotate(-1deg)',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.55rem',
                fontFamily: '"Permanent Marker", cursive',
                color: critStyle.text,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {CRITICALITY_LABELS[opportunity.criticality] || 'Replaceable'}
            </Typography>
          </Box>

          {opportunity.is_invited && (
            <Box
              sx={{
                px: 1,
                py: 0.25,
                border: '2px solid rgba(22, 163, 74, 0.5)',
                borderRadius: '2px',
                transform: 'rotate(3deg)',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.55rem',
                  fontFamily: '"Permanent Marker", cursive',
                  color: '#16a34a',
                  letterSpacing: 1,
                }}
              >
                ✨ INVITED
              </Typography>
            </Box>
          )}
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'serif',
            fontStyle: 'italic',
            mb: 2,
            lineHeight: 1.4,
            fontSize: '0.85rem',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {opportunity.need_description || 'No additional brief provided.'}
        </Typography>

        {/* Meta info row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1,
            mb: 2,
            p: 1.5,
            bgcolor: 'rgba(0,0,0,0.02)',
            border: '1px dashed rgba(0,0,0,0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Calendar size={12} />
            <Typography
              sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#555' }}
            >
              {new Date(opportunity.event_start_time).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <MapPin size={12} />
            <Typography
              sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#555' }}
            >
              {opportunity.event_location_name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <DollarSign size={12} />
            <Typography
              sx={{ fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace' }}
            >
              {formatBudget(opportunity.budget_min, opportunity.budget_max)}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: '0.7rem',
              fontWeight: 'bold',
              fontFamily: '"Permanent Marker", cursive',
              color: '#ea580c',
            }}
          >
            {formatStartsIn(opportunity.event_start_time)}
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" asChild>
            <Link
              to={`/events/${opportunity.event_id}`}
              style={{ textDecoration: 'none' }}
            >
              View Event
            </Link>
          </Button>
          {isPotential ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/vendors/create')}
              className="gap-1.5 border-emerald-500 text-emerald-700 hover:bg-emerald-50"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Create Service
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onApply?.(opportunity)}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Apply Now
            </Button>
          )}
        </Box>
      </Paper>

      {/* Potential opportunity stamp overlay */}
      {isPotential && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            px: 1.5,
            py: 0.5,
            border: '2px solid rgba(22, 163, 74, 0.6)',
            borderRadius: '2px',
            transform: 'rotate(5deg)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Permanent Marker", cursive',
              fontSize: '0.6rem',
              color: 'rgba(22, 163, 74, 0.8)',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            NEW CATEGORY
          </Typography>
        </Box>
      )}
    </Box>
  );
}

type Tab = 'relevant' | 'potential';

export function OpportunitiesTab() {
  const { data: opportunitiesResponse, isLoading } = useMyVendorOpportunities();
  const { data: potentialResponse, isLoading: isLoadingPotential } =
    useMyPotentialOpportunities();
  const { data: myServicesResponse, isLoading: isLoadingServices } = useMyServices();

  const opportunities = opportunitiesResponse?.data || [];
  const potentialOpportunities = potentialResponse?.data || [];
  const myServices = myServicesResponse?.data || [];

  const [selectedNeed, setSelectedNeed] = useState<VendorOpportunity | null>(null);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('relevant');

  const filterItems = (items: VendorOpportunity[]) =>
    query
      ? items.filter((o) => {
          const normalized = query.toLowerCase();
          return (
            o.need_title.toLowerCase().includes(normalized) ||
            o.event_title.toLowerCase().includes(normalized) ||
            o.category.toLowerCase().includes(normalized) ||
            o.event_location_name.toLowerCase().includes(normalized)
          );
        })
      : items;

  const filteredRelevant = filterItems(opportunities);
  const filteredPotential = filterItems(potentialOpportunities);

  const serviceCategories = Array.from(
    new Set(myServices.map((service) => getCategoryLabel(service.category))),
  );
  const invitedCount = filteredRelevant.filter((o) => o.is_invited).length;

  const isTabLoading = activeTab === 'relevant' ? isLoading : isLoadingPotential;
  const activeList = activeTab === 'relevant' ? filteredRelevant : filteredPotential;

  return (
    <ThemeProvider theme={scrapbookTheme}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {/* ── Hero Banner ── */}
        <Paper
          elevation={2}
          sx={{
            mb: 5,
            p: { xs: 3, sm: 4 },
            bgcolor: '#fff',
            position: 'relative',
            overflow: 'visible',
            border: '1px solid #e5e7eb',
          }}
        >
          <WashiTape color="rgba(37, 99, 235, 0.4)" rotate="-3deg" width={100} />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { sm: 'flex-start' },
              gap: 3,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: '#2563eb',
                  fontFamily: 'monospace',
                  mb: 1,
                }}
              >
                Vendor Match Feed
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Permanent Marker", cursive',
                  fontSize: { xs: '1.8rem', sm: '2.5rem' },
                  transform: 'rotate(-1deg)',
                  lineHeight: 1.1,
                  mb: 1,
                }}
              >
                Opportunities for You
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontFamily: 'serif', fontStyle: 'italic', color: '#666' }}
              >
                Curated event needs based on your active service categories.
              </Typography>
            </Box>
            <Button asChild variant="outline" size="sm">
              <Link to="/vendors/create">+ Create New Service</Link>
            </Button>
          </Box>

          {/* Stats stickers */}
          <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                border: '1px solid #333',
                transform: 'rotate(-1deg)',
                bgcolor: '#fff',
              }}
            >
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                {filteredRelevant.length} matched needs
              </Typography>
            </Box>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                border: '1px dashed #16a34a',
                transform: 'rotate(1deg)',
                bgcolor: '#f0fdf4',
              }}
            >
              <Typography
                sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#16a34a' }}
              >
                {filteredPotential.length} potential
              </Typography>
            </Box>
            {invitedCount > 0 && (
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  border: '2px solid rgba(234, 179, 8, 0.5)',
                  transform: 'rotate(2deg)',
                  bgcolor: '#fefce8',
                }}
              >
                <Typography
                  sx={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#a16207' }}
                >
                  {invitedCount} host invites ✨
                </Typography>
              </Box>
            )}
            {serviceCategories.slice(0, 4).map((category) => (
              <Box
                key={category}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  border: '1px dashed #ccc',
                  transform: `rotate(${(Math.random() * 4 - 2).toFixed(1)}deg)`,
                  bgcolor: '#fff',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#2563eb',
                  }}
                >
                  {category}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* ── Search strip ── */}
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ position: 'relative', width: '100%', maxWidth: { sm: 420 } }}>
            <Search
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 16,
                height: 16,
                color: '#999',
              }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by need, event, location..."
              style={{
                width: '100%',
                height: 42,
                paddingLeft: 36,
                paddingRight: 12,
                fontSize: '0.875rem',
                fontFamily: 'serif',
                border: '1px solid #333',
                borderRadius: 0,
                background: '#fff',
                outline: 'none',
              }}
            />
          </Box>
          <Typography
            sx={{ fontFamily: '"Caveat", cursive', color: '#888', fontSize: '0.9rem' }}
          >
            Apply early to land the gig! ☝️
          </Typography>
        </Box>

        {/* ── Tabs — washi tape style ── */}
        <Box sx={{ mb: 4, display: 'flex', gap: 0 }}>
          <Box
            onClick={() => setActiveTab('relevant')}
            sx={{
              px: 3,
              py: 1.5,
              cursor: 'pointer',
              bgcolor:
                activeTab === 'relevant'
                  ? 'rgba(37, 99, 235, 0.35)'
                  : 'rgba(37, 99, 235, 0.1)',
              borderBottom:
                activeTab === 'relevant'
                  ? '3px solid #2563eb'
                  : '3px solid transparent',
              transition: 'all 0.2s ease',
              transform: 'rotate(-1deg)',
              '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.25)' },
            }}
          >
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontFamily: '"Permanent Marker", cursive',
                color: activeTab === 'relevant' ? '#1d4ed8' : '#6b7280',
              }}
            >
              Relevant {filteredRelevant.length > 0 && `(${filteredRelevant.length})`}
            </Typography>
          </Box>
          <Box
            onClick={() => setActiveTab('potential')}
            sx={{
              px: 3,
              py: 1.5,
              cursor: 'pointer',
              bgcolor:
                activeTab === 'potential'
                  ? 'rgba(22, 163, 74, 0.3)'
                  : 'rgba(22, 163, 74, 0.08)',
              borderBottom:
                activeTab === 'potential'
                  ? '3px solid #16a34a'
                  : '3px solid transparent',
              transition: 'all 0.2s ease',
              transform: 'rotate(1deg)',
              '&:hover': { bgcolor: 'rgba(22, 163, 74, 0.2)' },
            }}
          >
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontFamily: '"Permanent Marker", cursive',
                color: activeTab === 'potential' ? '#16a34a' : '#6b7280',
              }}
            >
              Potential{' '}
              {filteredPotential.length > 0 && `(${filteredPotential.length})`}
            </Typography>
          </Box>
        </Box>

        {/* Potential tab callout */}
        {activeTab === 'potential' && (
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              p: 3,
              bgcolor: '#f0fdf4',
              border: '1px dashed #16a34a',
              transform: 'rotate(-0.5deg)',
              position: 'relative',
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Caveat", cursive',
                fontSize: '1.1rem',
                color: '#15803d',
              }}
            >
              <strong>These are opportunities outside your current services.</strong>{' '}
              Create a service in that category to apply — it only takes a minute! ✍️
            </Typography>
          </Paper>
        )}

        {!isLoadingServices && myServices.length === 0 && activeTab === 'relevant' && (
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              p: 3,
              bgcolor: '#fff9e6',
              border: '1px solid #e0d8c0',
              transform: 'rotate(0.5deg)',
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Caveat", cursive',
                fontSize: '1.1rem',
                color: '#92400e',
              }}
            >
              Add at least one vendor service category to see matching opportunities. 📋
            </Typography>
          </Paper>
        )}

        {/* ── Cards ── */}
        {isTabLoading ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: 3,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  height: 240,
                  bgcolor: '#fff',
                  border: '1px solid #e5e7eb',
                  opacity: 0.5,
                  animation: 'pulse 2s infinite',
                }}
              />
            ))}
          </Box>
        ) : activeList.length === 0 ? (
          <Paper
            elevation={1}
            sx={{
              p: 6,
              textAlign: 'center',
              bgcolor: '#fff9e6',
              border: '1px solid #e0d8c0',
              position: 'relative',
            }}
          >
            <WashiTape color="rgba(0,0,0,0.08)" rotate="5deg" width={70} />
            <BellRing
              style={{
                width: 40,
                height: 40,
                margin: '0 auto 12px',
                color: '#d97706',
                opacity: 0.7,
              }}
            />
            <Typography
              sx={{
                fontFamily: '"Permanent Marker", cursive',
                fontSize: '1.3rem',
                mb: 1,
              }}
            >
              {activeTab === 'relevant'
                ? 'No matching opportunities right now'
                : 'No potential opportunities found'}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: 'serif', fontStyle: 'italic', color: '#888' }}
            >
              {activeTab === 'relevant'
                ? 'Check back soon or expand your service categories.'
                : 'All open needs match your existing services — great coverage!'}
            </Typography>
          </Paper>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: 3,
            }}
          >
            {activeList.map((opportunity) => (
              <NeedCard
                key={opportunity.need_id}
                opportunity={opportunity}
                isPotential={activeTab === 'potential'}
                onApply={(o) => setSelectedNeed(o)}
              />
            ))}
          </Box>
        )}

        {selectedNeed && (
          <ApplyToNeedModal
            isOpen={!!selectedNeed}
            onClose={() => setSelectedNeed(null)}
            needId={selectedNeed.need_id}
            needTitle={selectedNeed.need_title}
          />
        )}
      </Box>
    </ThemeProvider>
  );
}
