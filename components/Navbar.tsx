'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { Menu, X, BookOpen, LayoutDashboard, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: "/",
      redirect: true
    })
  }

  const NavLink = ({ 
    href, 
    children, 
    icon: Icon 
  }: { 
    href: string; 
    children: React.ReactNode;
    icon: React.ElementType;
  }) => {
    const isActive = pathname === href
    
    return (
      <button
        onClick={() => router.push(href)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
          isActive 
            ? 'dark:bg-white/10 dark:text-white bg-neutral-100 text-neutral-900' 
            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5'
        }`}
      >
        <Icon size={18} />
        <span className="font-light">{children}</span>
      </button>
    )
  }

  return (
    <nav className="fixed top-0 w-full dark:nav-blur bg-[#F5F2EA]/90 backdrop-blur-sm border-b border-neutral-200 dark:border-white/5 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-light tracking-wider text-neutral-800 dark:text-white">
              cervello<span className="text-neutral-400 dark:text-neutral-500">flashcards</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            {status === 'authenticated' && (
              <div className="flex items-center mr-4 bg-white dark:glass-card rounded-lg shadow-sm">
                <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                <NavLink href="/decks" icon={BookOpen}>Collections</NavLink>
                <NavLink href="/review" icon={RefreshCw}>Review</NavLink>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <ModeToggle />
              {status === 'authenticated' ? (
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600 dark:text-white"
                >
                  Sign Out
                </Button>
              ) : (
                <Button
                  onClick={() => signIn('google')}
                  className="dark:bg-white dark:text-black dark:hover:bg-neutral-200 bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-neutral-200 dark:border-white/5 mt-4"
            >
              <div className="py-4 flex flex-col space-y-2">
                {status === 'authenticated' && (
                  <>
                    <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                    <NavLink href="/decks" icon={BookOpen}>Collections</NavLink>
                    <NavLink href="/review" icon={RefreshCw}>Review</NavLink>
                  </>
                )}
                <div className="flex items-center space-x-3 px-4 pt-4">
                  <ModeToggle />
                  {status === 'authenticated' ? (
                    <Button 
                      onClick={handleSignOut}
                      variant="outline"
                      className="border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600 dark:text-white"
                    >
                      Sign Out
                    </Button>
                  ) : (
                    <Button
                      onClick={() => signIn('google')}
                      className="dark:bg-white dark:text-black dark:hover:bg-neutral-200 bg-neutral-900 text-white hover:bg-neutral-800"
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

export default Navbar