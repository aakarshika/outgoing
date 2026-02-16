import { Label as RadixLabel } from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

const Label = React.forwardRef<
  React.ElementRef<typeof RadixLabel>,
  React.ComponentPropsWithoutRef<typeof RadixLabel> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => {
  return <RadixLabel ref={ref} className={cn(labelVariants(), className)} {...props} />;
});
Label.displayName = RadixLabel.displayName;

export { Label };
