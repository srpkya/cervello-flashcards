'use client'

import { signIn } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SignInPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Sign In
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button 
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full"
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}