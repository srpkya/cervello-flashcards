'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'

const Navbar = () => {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className={`${pathname === '/' ? 'text-primary' : ''}`}>
            <h3 className='font-bold'>Home</h3>
          </Link>
          {status === 'authenticated' && (
            <>
              <Link href="/dashboard" className={`${pathname === '/dashboard' ? 'text-primary' : ''}`}>
                <h3 className='font-bold'>Dashboard</h3>
              </Link>
              <Link href="/decks" className={`${pathname === '/decks' ? 'text-primary' : ''}`} >
                <h3 className='font-bold'>Decks</h3>
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <ModeToggle />
          {status === 'authenticated' ? (
            <Button onClick={() => signOut()}>Sign Out</Button>
          ) : status === 'unauthenticated' ? (
            <Button onClick={() => signIn()}>Sign In</Button>
          ) : null}
        </div>
      </div>
    </nav>
  )
}

export default Navbar