'use client'
import React from 'react';
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock, Activity, Calendar, Settings2 } from "lucide-react";
import { StudySessionStats } from '@/lib/types';
import { formatStudyTime, formatTimeString } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import StudyStatsChart from './StudyStatsChart';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export default function DashboardClient() {
  const { data: session } = useSession();
  const [studyStats, setStudyStats] = React.useState<StudySessionStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [dailyGoal, setDailyGoal] = React.useState(100);
  const [dueCards, setDueCards] = React.useState(0);

  const fetchStats = React.useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/stats?userId=${session.user.id}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStudyStats(data);

      const dueResponse = await fetch(`/api/decks/due-count?userId=${session.user.id}`);
      if (dueResponse.ok) {
        const { count } = await dueResponse.json();
        setDueCards(count);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const studyTimeFormatted = React.useMemo(() => {
    return studyStats ? formatTimeString(formatStudyTime(studyStats.studyTimeToday)) : '0h 0m';
  }, [studyStats?.studyTimeToday]);

  const progressPercentage = Math.min(((studyStats?.totalCardsToday || 0) / dailyGoal) * 100, 100);
  const dueProgressPercentage = dueCards > 0 ? Math.min(((studyStats?.totalCardsToday || 0) / dueCards) * 100, 100) : 0;

  let content;

  if (isLoading) {
    content = (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-neutral-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  } else if (!studyStats) {
    content = (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-neutral-600 dark:text-neutral-400">No data available</div>
      </div>
    );
  } else {
    content = (
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-xl font-light">Today's Progress</CardTitle>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">Daily Goal</h4>
                          <p className="text-sm text-muted-foreground">
                            Set your daily review target
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="goal">Cards</Label>
                            <Slider
                              id="goal"
                              max={300}
                              min={10}
                              step={10}
                              value={[dailyGoal]}
                              onValueChange={(value) => setDailyGoal(value[0])}
                              className="col-span-2"
                            />
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            Target: {dailyGoal} cards
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <CardDescription>
                  {studyStats.studyTimeToday > 0
                    ? `${studyTimeFormatted} spent studying`
                    : 'No study time recorded today'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Daily Goal</span>
                    <span className="font-medium">{studyStats.totalCardsToday}/{dailyGoal} cards</span>
                  </div>
                  <Progress
                    value={progressPercentage}
                    className="h-2 dark:bg-white/5"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Due Cards Progress</span>
                    {studyStats.totalCardsToday >= dueCards ? (
                      <span className="font-medium text-green-500">Completed!</span>
                    ) : (
                      <span className="font-medium">{studyStats.totalCardsToday}/{dueCards} cards</span>
                    )}
                  </div>
                  <Progress
                    value={dueProgressPercentage}
                    max={100}
                    className="h-2 dark:bg-white/5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <Brain className="w-4 h-4" />
                      Cards Reviewed
                    </div>
                    <p className="text-2xl font-light">{studyStats.totalCardsToday}</p>
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

            <StudyStatsChart data={studyStats.lastThirtyDays} streak={studyStats.streak} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {content}
    </div>
  );
}