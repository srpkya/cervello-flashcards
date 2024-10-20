'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardClient() {
  const { data: session } = useSession();

  if (!session) {
    return <div>Please sign in to view your dashboard.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Study Progress</CardTitle>
          <CardDescription>Your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Progress visualization will go here.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Study Calendar</CardTitle>
          <CardDescription>Track your study sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Calendar component will go here.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Start studying or create new decks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/review">Start Review Session</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}