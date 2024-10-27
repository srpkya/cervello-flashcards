'use client'
import React from 'react';
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock } from "lucide-react";
import { StudySessionStats } from '@/lib/types';
import { Heatmap, formatStudyTime } from './Heatmap';
import { toast } from '@/hooks/use-toast';
import StudyStatsChart from './StudyStatsChart';

export default function DashboardClient() {
  const { data: session } = useSession();
  const [stats, setStats] = React.useState<StudySessionStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchStats = React.useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/stats?userId=${session.user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load statistics. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-neutral-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-neutral-600 dark:text-neutral-400">No data available</div>
      </div>
    );
  }

  const studyTimeFormatted = formatStudyTime(stats.studyTimeToday);
  const dailyGoal = 100;
  const progressPercentage = Math.min(((stats?.totalCardsToday || 0) / dailyGoal) * 100, 100);

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-light text-neutral-800 dark:text-white">Welcome back</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Track your progress and keep up the momentum</p>
      </div>

      <div className="grid gap-6">
        <Card className="dark:glass-card dark:border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-light">Today's Progress</CardTitle>
            <CardDescription>
              {studyTimeFormatted.hours}h {studyTimeFormatted.minutes}m spent studying
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Daily Goal</span>
                <span className="font-medium">{stats.totalCardsToday}/{dailyGoal} cards</span>
              </div>
              <Progress value={progressPercentage} className="h-2 dark:bg-white/5" />
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <Brain className="w-4 h-4" />
                  Cards Reviewed
                </div>
                <p className="text-2xl font-light">{stats.totalCardsToday}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <Clock className="w-4 h-4" />
                  Study Time
                </div>
                <p className="text-2xl font-light">
                  {studyTimeFormatted.hours}h {studyTimeFormatted.minutes}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:glass-card dark:border-white/5">
          <CardContent className="pt-6">
            <Heatmap data={stats.lastThirtyDays} />
          </CardContent>
        </Card>
        <StudyStatsChart data={stats.lastThirtyDays} />
      </div>
    </div>
  );
}