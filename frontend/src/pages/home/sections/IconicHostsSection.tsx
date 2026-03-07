import { Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

import { HostCard } from '@/components/ui/HostCard';
import { useIconicHostsFeed } from '@/features/events/hooks';

// --- Iconic Hosts ---
export const IconicHostsSection = () => {
  const { data, isLoading } = useIconicHostsFeed();
  const hosts = data?.data || [];
  const navigate = useNavigate();

  if (!isLoading && hosts.length === 0) return null;

  return (
    <section className="py-8 relative bg-[#fdfaf6] border-y border-dashed border-gray-300">
      <Box
        sx={{
          position: 'absolute',
          top: 40,
          right: '10%',
          width: 120,
          height: 30,
          bgcolor: 'rgba(16, 185, 129, 0.3)',
          transform: 'rotate(8deg)',
        }}
      />
      <Box
        sx={{
          mb: 6,
          px: { xs: 2, sm: 4, lg: 8 },
          relative: 'z-10',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div>
          <h2
            className="text-3xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: '"Permanent Marker"' }}
          >
            🌟 Iconic Hosts
          </h2>
          <p className="text-sm font-serif text-muted-foreground mt-2 italic">
            Discover the creators throwing the best parties right now.
          </p>
        </div>
        <Link
          to="/hosts"
          style={{
            fontFamily: '"Permanent Marker"',
            fontSize: '0.85rem',
            color: '#1a1a1a',
            textDecoration: 'underline',
          }}
        >
          View all →
        </Link>
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          px: { xs: 2, sm: 4, lg: 8 },
          pb: 12,
          pt: 8,
          scrollSnapType: 'x mandatory',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {hosts.map((host: any, index: number) => (
          <div
            key={host.id}
            onClick={() => navigate(`/user/${host.username}`)}
            className="flex-none snap-start group cursor-pointer w-[280px]"
          >
            <HostCard
              host={host}
              rating={host.avg_rating || 0}
              tag={host.review_count ? `${host.review_count} Reviews` : 'New Host'}
              rotation={index % 2 === 0 ? 2 : -2}
            />
          </div>
        ))}
      </Box>
    </section>
  );
};
