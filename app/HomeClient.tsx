'use client'

import { SignInButton } from '@/components/SignInButton'
import { motion } from 'framer-motion'
import { Brain, Sparkles, RefreshCw, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomeClient() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 px-4 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="container max-w-6xl mx-auto pt-20 md:pt-32"
          >
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-neutral-900 dark:text-white mb-6">
                Learn Smarter, 
                <span className="text-neutral-500 dark:text-neutral-400"> Not Harder</span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-3xl mx-auto">
                Master any subject with our intelligent flashcard system. Built for students, professionals, and lifelong learners.
              </p>
              <div className="flex justify-center gap-4">
                <SignInButton className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200" />
                <Button 
                  variant="outline"
                  className="dark:border-white/10 dark:hover:border-white/20 dark:text-white group"
                >
                  Learn More
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 rounded-2xl blur-xl transition-all duration-500 group-hover:scale-110" />
                <div className="relative p-8 dark:glass-card rounded-2xl border border-neutral-200/50 dark:border-white/5">
                  <div className="w-12 h-12 bg-neutral-900 dark:bg-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Brain className="w-6 h-6 text-white dark:text-black" />
                  </div>
                  <h3 className="text-xl font-medium mb-3 text-neutral-900 dark:text-white">Smart Learning</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Our spaced repetition system adapts to your learning pace, ensuring optimal retention.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/5 dark:to-emerald-500/5 rounded-2xl blur-xl transition-all duration-500 group-hover:scale-110" />
                <div className="relative p-8 dark:glass-card rounded-2xl border border-neutral-200/50 dark:border-white/5">
                  <div className="w-12 h-12 bg-neutral-900 dark:bg-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 text-white dark:text-black" />
                  </div>
                  <h3 className="text-xl font-medium mb-3 text-neutral-900 dark:text-white">Beautiful Interface</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    A clean, minimalist design that helps you focus on what matters most: learning.
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-500/5 dark:to-red-500/5 rounded-2xl blur-xl transition-all duration-500 group-hover:scale-110" />
                <div className="relative p-8 dark:glass-card rounded-2xl border border-neutral-200/50 dark:border-white/5">
                  <div className="w-12 h-12 bg-neutral-900 dark:bg-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <RefreshCw className="w-6 h-6 text-white dark:text-black" />
                  </div>
                  <h3 className="text-xl font-medium mb-3 text-neutral-900 dark:text-white">Active Recall</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Strengthen your memory through proven active recall techniques and spaced repetition.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-white/[0.02] border-t border-neutral-200 dark:border-white/5 py-16 md:py-24"
        >
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-light text-neutral-900 dark:text-white mb-4">
                Start Learning Today
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                Join thousands of students who've improved their learning with our system.
              </p>
              <SignInButton className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}