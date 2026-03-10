import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const comicIconButtonVariants = cva(
  'group relative inline-flex items-center justify-center whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-w-[40px] min-h-[40px]',
  {
    variants: {
      variant: {
        solid: '',
        ghost: 'bg-transparent border-none',
      },
      size: {
        default: 'h-10 w-10',
        sm: 'h-8 w-8',
        lg: 'h-12 w-12',
        icon: 'h-[55px] w-[55px]',
      },
      shape: {
        square: 'rounded-none',
        round: 'rounded-full',
        rounded: 'rounded-md',
      },
    },
    defaultVariants: {
      variant: 'solid',
      size: 'default',
      shape: 'square',
    },
  },
);

export interface ComicIconButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof comicIconButtonVariants> {
  asChild?: boolean;
  Icon?: React.ElementType;
  iconProps?: any;
  iconClassName?: string;
  color?: string;
  accentColor?: string;
  reverseMotion?: boolean;
}

const ComicIconButton = React.forwardRef<HTMLButtonElement, ComicIconButtonProps>(
  (
    {
      className,
      variant,
      size = 'icon',
      shape = 'square',
      asChild = false,
      Icon,
      iconProps,
      children,
      iconClassName,
      color = '#000000',
      accentColor = '#ffffff',
      reverseMotion = true,
      style,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    const isGhost = variant === 'ghost';
    const isTransparent = accentColor === 'transparent';

    const depthX = 2;
    const depthY = 3;
    const frontRestX = reverseMotion ? depthX : 0;
    const frontRestY = reverseMotion ? depthY : 0;
    const frontHoverX = reverseMotion ? 0 : depthX;
    const frontHoverY = reverseMotion ? 0 : depthY;
    const shadowHoverScale = reverseMotion ? 0.95 : 1;
    const shadowRestScale = reverseMotion ? 1 : 0.95;

    const iconPaddingClass = {
      default: 'p-0',
      sm: 'p-1',
      lg: 'p-3',
      icon: 'p-3',
    }[size ?? 'default'];

    const dynamicStyles: React.CSSProperties = {
      '--comic-color': color,
      '--accent-color': accentColor,
      '--depth-x': `${depthX}px`,
      '--depth-y': `${depthY}px`,
      '--front-rest-x': `${frontRestX}px`,
      '--front-rest-y': `${frontRestY}px`,
      '--front-hover-x': `${frontHoverX}px`,
      '--front-hover-y': `${frontHoverY}px`,
      '--shadow-rest-scale': shadowRestScale,
      '--shadow-hover-scale': shadowHoverScale,
      fontFamily: '"Permanent Marker"',
      ...style,
    } as React.CSSProperties;

    const renderIcon = (extraProps: any = {}) => {
      if (!Icon) return null;
      return (
        <Icon
          className={cn(
            'h-full w-full min-w-[20px] min-h-[20px] transition-all',
            iconClassName,
            extraProps.className,
          )}
          style={{
            color: 'var(--comic-color)',
            ...iconProps?.style,
            ...extraProps.style,
          }}
          {...iconProps}
          {...extraProps}
        />
      );
    };

    const renderFrontGhostIcon = () => (
      <span className="relative flex h-full w-full items-center justify-center">
        <span className={cn('absolute inset-0 flex items-center justify-center')}>
          {renderIcon({
            strokeWidth: 5,
            style: {
              margin: '6px',
              color: 'var(--accent-color)',
              fill: isTransparent ? 'none' : 'var(--accent-color)',
            },
          })}
        </span>
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center ',
            iconPaddingClass,
          )}
        >
          {renderIcon({
            style: {
              color: 'var(--comic-color)',
              fill: isTransparent ? 'none' : 'var(--accent-color)',
            },
          })}
        </span>
      </span>
    );

    const renderShadowGhostIcon = () => (
      <span className="relative flex h-full w-full items-center justify-center">
        <span className="absolute inset-0 flex items-center justify-center">
          {renderIcon({
            strokeWidth: 4,
            style: {
              margin: '6px',
              color: 'var(--comic-color)',
              fill: 'var(--comic-color)',
            },
          })}
        </span>
      </span>
    );

    const mainContent = Icon ? (isGhost ? renderFrontGhostIcon() : renderIcon()) : null;

    const overlayContent =
      asChild && React.isValidElement(children) ? children.props.children : children;

    const layeredContent = (
      <>
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 transition-all duration-150 ease-out',
            'translate-x-[var(--depth-x)] translate-y-[var(--depth-y)]',
            'scale-[var(--shadow-rest-scale)] group-hover:scale-[var(--shadow-hover-scale)] origin-bottom-right',
            shape === 'square' && 'rounded-none',
            shape === 'round' && 'rounded-full',
            shape === 'rounded' && 'rounded-md',
            !isGhost && 'border-2 border-[var(--comic-color)] bg-[var(--comic-color)]',
          )}
        >
          {isGhost ? (
            <span
              className={cn(
                'flex h-full w-full items-center justify-center',
                !isGhost ? iconPaddingClass : '',
              )}
            >
              {renderShadowGhostIcon()}
            </span>
          ) : null}
        </span>

        <span
          className={cn(
            'relative z-[1] flex h-full w-full items-center justify-center transition-all duration-150 ease-out',
            'translate-x-[var(--front-rest-x)] translate-y-[var(--front-rest-y)]',
            'group-hover:translate-x-[var(--front-hover-x)] group-hover:translate-y-[var(--front-hover-y)]',
            shape === 'square' && 'rounded-none',
            shape === 'round' && 'rounded-full',
            shape === 'rounded' && 'rounded-md',
            !isGhost &&
              'border-2 border-[var(--comic-color)] text-[var(--comic-color)]',
            !isGhost &&
              (isTransparent
                ? 'bg-white/20 backdrop-blur-md'
                : 'bg-[var(--accent-color)]'),
            isGhost && 'text-[var(--comic-color)]',
            !isGhost ? iconPaddingClass : '',
          )}
        >
          {mainContent}
          {overlayContent}
        </span>
      </>
    );

    if (asChild && React.isValidElement(children)) {
      return (
        <Comp
          className={cn(comicIconButtonVariants({ variant, size, shape, className }))}
          ref={ref}
          style={dynamicStyles}
          {...props}
        >
          {React.cloneElement(children as React.ReactElement<any>, {
            children: layeredContent,
          })}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(comicIconButtonVariants({ variant, size, shape, className }))}
        ref={ref}
        style={dynamicStyles}
        {...props}
      >
        {layeredContent}
      </Comp>
    );
  },
);
ComicIconButton.displayName = 'ComicIconButton';

export { ComicIconButton, comicIconButtonVariants };
