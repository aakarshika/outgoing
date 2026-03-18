import { Box, IconButton } from '@mui/material';
import { ArrowLeft, Heart, Share2 } from 'lucide-react';

interface NormalNavigationModuleProps {
  event: any;
  isAuthenticated: boolean;
  isInterested: boolean;
  onBack?: () => void;
  onToggleInterest?: () => void;
  disableInterestToggle?: boolean;
}

export function NormalNavigationModule({
  event,
  isAuthenticated,
  isInterested,
  onBack,
  onToggleInterest,
  disableInterestToggle = false,
}: NormalNavigationModuleProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
      }}
    >
      <IconButton
        onClick={onBack}
        sx={{
          width: 34,
          height: 34,
          bgcolor: 'rgba(255,255,255,0.85)',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
        }}
      >
        <ArrowLeft size={18} />
      </IconButton>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton
          onClick={onToggleInterest}
          disabled={disableInterestToggle}
          sx={{
            width: 34,
            height: 34,
            bgcolor: 'rgba(255,255,255,0.85)',
            color: isInterested ? '#D85A30' : 'inherit',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.7)', color: '#94a3b8' },
          }}
        >
          <Heart size={18} fill={isInterested ? '#D85A30' : 'none'} />
        </IconButton>
        <IconButton
          onClick={handleShare}
          sx={{
            width: 34,
            height: 34,
            bgcolor: 'rgba(255,255,255,0.85)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
          }}
        >
          <Share2 size={18} />
        </IconButton>
      </Box>
    </Box>
  );
}
