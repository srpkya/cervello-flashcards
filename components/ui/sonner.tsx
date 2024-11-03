'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';
import { cn } from "@/lib/utils";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        className: cn(
          'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          'flex flex-row gap-2 items-center',
          'group-[.toast]:bg-white dark:group-[.toast]:bg-zinc-950',
          'group-[.toast]:text-zinc-950 dark:group-[.toast]:text-zinc-50',
          'group-[.toast]:border-zinc-200 dark:group-[.toast]:border-zinc-800',
          'group-[.toast]:shadow-lg'
        ),
        duration: 4000,
      }}
      {...props}
    />
  );
};

export { Toaster };