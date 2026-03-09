import { Box, IconButton, Typography } from '@mui/material';
import { Heart, MessageCircle, Star } from 'lucide-react';
import { useMemo } from 'react';

import { Hostname } from './Hostname';
import { UserAvatar } from './UserAvatar';

interface VendorReview {
  vendorName: string;
  vendorAvatar?: string;
  rating: number;
  comment?: string;
}

interface PostItNoteProps {
  username: string;
  rating: number;
  comment: string;
  avatar?: string;
  vendorReviews?: VendorReview[];
  color?: string;
  rotation?: string;
  datetime?: string;
  likesCount?: number;
  commentsCount?: number;
  userHasLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
}

export const PostItNote = ({
  username,
  rating,
  comment,
  avatar,
  vendorReviews = [],
  color = '#fff740',
  rotation,
  datetime,
  likesCount = 0,
  commentsCount = 0,
  userHasLiked = false,
  onLike,
  onComment,
}: PostItNoteProps) => {
  const rot = useMemo(() => rotation || (Math.random() * 6 - 3).toFixed(1), [rotation]);

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 180,
        p: 3,
        bgcolor: color,
        boxShadow: '5px 5px 7px rgba(33,33,33,.3)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        mb: 4,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -5,
          left: '45%',
          width: 40,
          height: 15,
          bgcolor: 'rgba(0,0,0,0.1)',
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Hostname
          username={username}
          avatarSrc={avatar}
          datetime={datetime}
          mode="normal"
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5, mb: 1, color: '#d4af37' }}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill={i < rating ? 'currentColor' : 'none'} />
        ))}
      </Box>

      <Typography
        sx={{
          fontFamily: '"Caveat", cursive',
          fontSize: '1.4rem',
          lineHeight: 1.2,
          color: '#222',
          mb: vendorReviews.length > 0 ? 2 : 0,
        }}
      >
        {comment}
      </Typography>

      {vendorReviews.length > 0 && (
        <Box
          sx={{
            mt: 'auto',
            pt: 2,
            borderTop: '1px dashed rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.65rem',
              fontWeight: 'bold',
              color: 'text.secondary',
              letterSpacing: 0.5,
            }}
          >
            VENDOR SHOUTOUTS
          </Typography>
          {vendorReviews.map((v, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <UserAvatar src={v.vendorAvatar} username={v.vendorName} size="xs" />
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {v.vendorName}
                  </Typography>
                  <Box sx={{ display: 'flex', color: '#d4af37' }}>
                    {[...Array(5)].map((_, si) => (
                      <Star
                        key={si}
                        size={8}
                        fill={si < v.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </Box>
                </Box>
                {v.comment && (
                  <Typography
                    sx={{
                      fontFamily: '"Caveat", cursive',
                      fontSize: '0.9rem',
                      lineHeight: 1,
                      color: '#444',
                      mt: 0.5,
                    }}
                  >
                    "{v.comment}"
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Interactions */}
      <Box
        sx={{
          mt: vendorReviews.length > 0 ? 2 : 'auto',
          pt: 1,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          color: 'text.secondary',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={onLike}
            sx={{ p: 0.5, color: userHasLiked ? 'error.main' : 'inherit' }}
          >
            <Heart size={18} fill={userHasLiked ? 'currentColor' : 'none'} />
          </IconButton>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {likesCount}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={onComment}
            sx={{ p: 0.5, color: 'inherit' }}
          >
            <MessageCircle size={18} />
          </IconButton>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {commentsCount}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
