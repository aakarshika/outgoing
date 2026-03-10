import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const comicButtonVariants = cva(
  'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-bold',
  {
    variants: {
      variant: {
        solid: '',
        ghost: 'bg-transparent border-none',
      },
      size: {
        default: 'h-10 min-h-10 px-4 py-2 text-sm',
        sm: 'h-8 min-h-8 px-3 py-1.5 text-xs',
        lg: 'h-12 min-h-12 px-5 py-3 text-base',
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

const iconSizeClass = {
  default: 'h-4 w-4 min-w-[16px] min-h-[16px]',
  sm: 'h-3.5 w-3.5 min-w-[14px] min-h-[14px]',
  lg: 'h-5 w-5 min-w-[20px] min-h-[20px]',
} as const;

export interface ComicButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof comicButtonVariants> {
  asChild?: boolean;
  Icon?: React.ElementType;
  iconProps?: React.SVGProps<SVGSVGElement> & { className?: string };
  iconClassName?: string;
  color?: string;
  accentColor?: string;
  reverseMotion?: boolean;
  /** Button label (text). When asChild, use this; otherwise children is the label. */
  label?: React.ReactNode;
}

const ComicButton = React.forwardRef<HTMLButtonElement, ComicButtonProps>(
  (
    {
      className,
      variant,
      size = 'default',
      shape = 'square',
      asChild = false,
      Icon,
      iconProps,
      iconClassName,
      children,
      label,
      color = '#000000',
      accentColor = '#ffffff',
      reverseMotion = true,
      style,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    const textContent = label ?? children;

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

    const iconCls = iconSizeClass[size ?? 'default'];

    const renderIcon = (extraProps: Record<string, any> = {}) => {
      if (!Icon) return null;
      return (
        <Icon
          className={cn(
            'shrink-0 transition-all',
            iconCls,
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
      <span className="relative flex shrink-0 items-center justify-center">
        <span className="absolute inset-0 flex items-center justify-center">
          {renderIcon({
            strokeWidth: 5,
            style: {
              color: 'var(--accent-color)',
              fill: isTransparent ? 'none' : 'var(--accent-color)',
            },
          })}
        </span>
        <span className="relative flex items-center justify-center">
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
      <span className="relative flex shrink-0 items-center justify-center">
        {renderIcon({
          strokeWidth: 4,
          style: {
            color: 'var(--comic-color)',
            fill: 'var(--comic-color)',
          },
        })}
      </span>
    );

    const iconContent = Icon ? (isGhost ? renderFrontGhostIcon() : renderIcon()) : null;

    const overlayContent =
      asChild && React.isValidElement(children) ? children.props.children : null;

    const paddingClass = cn(
      'px-4 py-2',
      size === 'sm' && 'px-3 py-1.5',
      size === 'lg' && 'px-5 py-3',
    );

    const layeredContent = (
      <>
        {/* Invisible sizer so the button gets correct dimensions; layers are in the absolute wrapper below */}
        <span
          aria-hidden
          className={cn('invisible flex items-center justify-center gap-2')}
        >
          {iconContent}
          {textContent != null && <span className="leading-none">{textContent}</span>}
        </span>
        <span className="absolute inset-0">
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-0 transition-all duration-150 ease-out',
              'translate-x-[var(--depth-x)] translate-y-[var(--depth-y)]',
              'scale-[var(--shadow-rest-scale)] group-hover:scale-[var(--shadow-hover-scale)] origin-bottom-right',
              shape === 'square' && 'rounded-none',
              shape === 'round' && 'rounded-full',
              shape === 'rounded' && 'rounded-md',
              !isGhost &&
                'border-2 border-[var(--comic-color)] bg-[var(--comic-color)]',
            )}
          >
            {isGhost && Icon ? (
              <span
                className={cn(
                  'flex h-full w-full items-center justify-center gap-2',
                  // paddingClass,
                )}
              >
                {renderShadowGhostIcon()}
              </span>
            ) : null}
          </span>

          <span
            className={cn(
              'absolute inset-0 z-[1] flex items-center justify-center gap-2 transition-all duration-150 ease-out',
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
              // paddingClass,
            )}
          >
            {iconContent}
            {textContent != null && <span className="leading-none">{textContent}</span>}
            {overlayContent}
          </span>
        </span>
      </>
    );

    if (asChild && React.isValidElement(children)) {
      return (
        <Comp
          className={cn(comicButtonVariants({ variant, size, shape, className }))}
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
        className={cn(comicButtonVariants({ variant, size, shape, className }))}
        ref={ref}
        style={dynamicStyles}
        {...props}
      >
        {layeredContent}
      </Comp>
    );
  },
);
ComicButton.displayName = 'ComicButton';

export { ComicButton, comicButtonVariants };
