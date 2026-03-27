import { Box, ClickAwayListener, Popover } from '@mui/material';
import { AnyUserCard, type FriendAvatarPopoverProps } from './AnyUserCard';

export type { FriendAvatarPopoverProps };

export function FriendAvatarPopover({
  userId,
  open,
  anchorEl,
  onClose,
}: FriendAvatarPopoverProps) {
  const isOpen = Boolean(open && anchorEl);

  return (
    <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            className: 'overflow-visible bg-transparent shadow-none border-0',
            sx: { mt: 1, maxWidth: 'min(320px, calc(100vw - 24px))' },
          },
        }}
        disableRestoreFocus
      >
        <ClickAwayListener disableReactTree onClickAway={onClose}>
          <Box>
            <AnyUserCard
              userId={userId}
              open={isOpen}
              anchorEl={anchorEl}
              onClose={onClose}
            />
          </Box>
        </ClickAwayListener>
      </Popover>
  );
}
