'use client';
import React from 'react';
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock, Activity, Calendar } from "lucide-react";
import { StudySessionStats } from '@/lib/types';
import { formatStudyTime, formatTimeString } from 'lib/utils'
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

  const studyTimeFormatted = React.useMemo(() => {
    return stats ? formatTimeString(formatStudyTime(stats.studyTimeToday)) : '0h 0m';
  }, [stats?.studyTimeToday]);

  const dailyGoal = 100;
  const progressPercentage = Math.min(((stats?.totalCardsToday || 0) / dailyGoal) * 100, 100);

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

  return (
    <div className="container max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col items-start gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-light text-neutral-800 dark:text-white">
            Welcome back
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Track your progress and keep up the momentum
          </p>
        </div>

        <div className="w-full flex flex-col gap-6">
          <Card className="dark:glass-card dark:border-white/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-xl font-light">Today's Progress</CardTitle>
                <div>
                  <CardDescription>
                    {stats.studyTimeToday > 0
                      ? `${studyTimeFormatted} spent studying`
                      : 'No study time recorded today'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Daily Goal</span>
                  <span className="font-medium">{stats.totalCardsToday}/100 cards</span>
                </div>
                <Progress
                  value={progressPercentage}
                  className="h-2 dark:bg-white/5"
                />
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
                    {studyTimeFormatted}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>



          <StudyStatsChart data={stats.lastThirtyDays} streak={stats.streak} />
        </div>
      </div>
    </div>
  );
}
