import { Dialog, DialogContent, DialogTitle, Typography, Button as MuiButton } from '@mui/material';

export const TermsDialog = ({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) => (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
            <Typography
                variant="h5"
                sx={{ fontFamily: '"Permanent Marker"', textAlign: 'center' }}
            >
                Terms & Conditions
            </Typography>
        </DialogTitle>
        <DialogContent>
            <Typography sx={{ mb: 2, fontFamily: 'serif', fontSize: '1rem' }}>
                By purchasing this ticket, you agree to:
            </Typography>
            <ul
                style={{ fontFamily: 'serif', lineHeight: 1.6, paddingLeft: '1.5rem' }}
            >
                <li>Follow all event rules and code of conduct.</li>
                <li>Arrive at the designated time and location.</li>
                <li>Be responsible for your own safety and belongings.</li>
                <li>Allow media capture (photos/videos) for scrapbook purposes.</li>
                <li>No refunds unless the curator cancels the event.</li>
            </ul>
            <MuiButton
                fullWidth
                onClick={onClose}
                variant="contained"
                sx={{
                    mt: 3,
                    bgcolor: '#333',
                    '&:hover': { bgcolor: '#000' },
                    fontFamily: '"Permanent Marker"',
                }}
            >
                I UNDERSTAND
            </MuiButton>
        </DialogContent>
    </Dialog>
);
