// components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200",
        destructive: "bg-red-500/90 text-neutral-50 hover:bg-red-500 dark:bg-red-900/90 dark:hover:bg-red-900",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-white/10 dark:hover:border-white/20 dark:text-white",
        secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-100 dark:hover:bg-white/20",
        ghost: "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-white/5 dark:hover:text-neutral-100",
        link: "text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };