// app/page.tsx
import { SignInButton } from '@/components/SignInButton'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { motion } from 'framer-motion'
import { Brain, Sparkles, RefreshCw } from 'lucide-react'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/decks')
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-light tracking-tight text-neutral-900 mb-6">
            Learn Smarter, Not Harder
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 mb-12">
            Master any subject with our intelligent flashcard system. 
            Built for students, professionals, and lifelong learners.
          </p>
          <SignInButton />
        </motion.div>
      </div>

      <div className="bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-medium mb-3">Smart Learning</h3>
              <p className="text-neutral-600">
                Our spaced repetition system adapts to your learning pace, 
                ensuring optimal retention.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-medium mb-3">Beautiful Interface</h3>
              <p className="text-neutral-600">
                A clean, minimalist design that helps you focus on what matters most: learning.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-medium mb-3">Active Recall</h3>
              <p className="text-neutral-600">
                Strengthen your memory through proven active recall techniques and spaced repetition.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}