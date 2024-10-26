import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import HomeClient from './HomeClient'

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect('/decks')
  }

  return <HomeClient />
}