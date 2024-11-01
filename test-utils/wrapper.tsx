import React from 'react';
import { render } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';

interface WrapperProps {
  children: React.ReactNode;
}

const mockSession = {
  user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
};

export const Wrapper = ({ children }: WrapperProps) => {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={false} 
      disableTransitionOnChange
    >
      <SessionProvider session={mockSession}>
        {children}
        <Toaster />
      </SessionProvider>
    </ThemeProvider>
  );
};

const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, { wrapper: Wrapper, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };