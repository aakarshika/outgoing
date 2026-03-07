import {
    Box,
    Button as MuiButton,
    Typography,
} from '@mui/material';

import { PostItNote } from '@/components/ui/PostItNote';

export const ReviewsSection = ({
    reviews,
    setIsReviewOpen,
}: {
    reviews: any[];
    setIsReviewOpen: (v: boolean) => void;
}) => (
    <Box>
        <Typography variant="h3" sx={{ mb: 4 }}>
            What people said
        </Typography>
        {reviews.length > 0 ? (
            reviews.map((rev: any, idx: number) => (
                <PostItNote
                    key={rev.id}
                    username={rev.username}
                    rating={rev.rating}
                    comment={rev.comment}
                    avatar={rev.avatar}
                    vendorReviews={rev.vendorReviews}
                    color={['#fff740', '#ff7eb9', '#7afcff'][idx % 3]}
                />
            ))
        ) : (
            <Typography
                sx={{
                    fontStyle: 'italic',
                    color: 'text.secondary',
                    textAlign: 'center',
                }}
            >
                No sticky notes yet.
            </Typography>
        )}

        <MuiButton
            fullWidth
            variant="contained"
            onClick={() => setIsReviewOpen(true)}
            sx={{
                bgcolor: 'warning.main',
                color: 'black',
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#f59e0b' },
                mt: 2,
            }}
        >
            Leave a Review
        </MuiButton>
    </Box>
);
