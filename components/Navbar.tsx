'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

  const NavLink = ({ href, children, icon: Icon }: { 
    href: string; 
    children: React.ReactNode;
    icon: React.ElementType;
  }) => {
    const isActive = pathname === href
    return (
      <Link 
        href={href} 
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          isActive 
            ? 'text-neutral-900 bg-neutral-100' 
            : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
        }`}
      >
        <Icon size={18} />
        <span className="font-light">{children}</span>
      </Link>
    )
  }

  return (
    <nav className="fixed top-0 w-full bg-[#F5F2EA]/90 backdrop-blur-sm border-b border-neutral-200 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-light tracking-wider text-neutral-800">
              flash<span className="text-neutral-400">cards</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            {status === 'authenticated' && (
              <div className="flex items-center mr-4 bg-white rounded-lg shadow-sm">
                <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                <NavLink href="/decks" icon={BookOpen}>Collections</NavLink>
                <NavLink href="/review" icon={RefreshCw}>Review</NavLink>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <ModeToggle />
              {status === 'authenticated' ? (
                <Button 
                  onClick={() => signOut()}
                  variant="outline"
                  className="border-neutral-300 hover:border-neutral-400"
                >
                  Sign Out
                </Button>
              ) : (
                <Button
                  onClick={() => signIn('google')}
                  className="bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
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
              className="md:hidden border-t border-neutral-200 mt-4"
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
                      onClick={() => signOut()}
                      variant="outline"
                      className="border-neutral-300 hover:border-neutral-400"
                    >
                      Sign Out
                    </Button>
                  ) : (
                    <Button
                      onClick={() => signIn('google')}
                      className="bg-neutral-900 text-white hover:bg-neutral-800"
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