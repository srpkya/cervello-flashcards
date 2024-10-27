import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from "@/components/SessionProvider"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from '@/components/Navbar'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Flashcards',
  description: 'Modern spaced repetition learning',
}

function NavbarWrapper() {
  return (
    <SessionProvider>
      <Navbar />
    </SessionProvider>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#F5F2EA] min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NavbarWrapper />
          <SessionProvider>
            <main className="pt-20 min-h-[calc(100vh-4rem)]">
              {children}
            </main>
          </SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}