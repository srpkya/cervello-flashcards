'use client';

import React from 'react';
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Clock, GraduationCap } from "lucide-react";
import { StudySessionStats } from '@/lib/db';
import StudyStatsChart from './StudyStatsChart';

export default function DashboardClient() {
  const { data: session } = useSession();
  const [stats, setStats] = React.useState<StudySessionStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/stats?userId=${session.user.id}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [session?.user?.id]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const formatStudyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return { hours, minutes };
  };

  const studyTime = formatStudyTime(stats?.studyTimeToday || 0);

  const dailyGoal = 100;
  const progressPercentage = Math.min(
    ((stats?.totalCardsToday || 0) / dailyGoal) * 100,
    100
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="md:col-span-1 dark:glass-card dark:border-white/5">
        <CardHeader>
          <CardTitle>Today's Progress</CardTitle>
          <CardDescription>Your learning progress for today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-medium">Daily Review Progress</span>
              </div>
              <span className="text-sm text-neutral-500">
                {stats?.totalCardsToday || 0}/{dailyGoal} cards
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2 dark:bg-white/5" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-medium">Cards Studied</span>
              </div>
              <p className="text-2xl font-light">{stats?.totalCardsToday || 0}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-medium">Study Time</span>
              </div>
              <p className="text-2xl font-light">
                {studyTime.hours}h {studyTime.minutes}m
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="md:col-span-1">
        <StudyStatsChart 
          data={stats?.lastThirtyDays || []}
          cardCount={stats?.totalCardsToday || 0}
          studyTime={stats?.studyTimeToday || 0}
        />
      </div>
    </div>
  );
}