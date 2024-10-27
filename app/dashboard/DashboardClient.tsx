'use client';

import React from 'react';
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Clock, GraduationCap, Target, TrendingUp, Brain } from "lucide-react";
import { StudySessionStats } from '@/lib/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardClient() {
  const { data: session } = useSession();
  const [stats, setStats] = React.useState<StudySessionStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

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

  React.useEffect(() => {
    fetchStats();
  }, [session?.user?.id]);

  React.useEffect(() => {
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-neutral-600 dark:text-neutral-400">
          Loading...
        </div>
      </div>
    );
  }

  const formatStudyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return { hours, minutes };
  };

  const studyTime = formatStudyTime(stats?.studyTimeToday || 0);
  const dailyGoal = 100;
  const progressPercentage = Math.min(((stats?.totalCardsToday || 0) / dailyGoal) * 100, 100);
  const totalCardsStudied = stats?.lastThirtyDays.reduce((acc, day) => acc + day.count, 0) || 0;
  const averageDaily = Math.round(totalCardsStudied / 30);

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-light text-neutral-800 dark:text-white">
          Welcome back
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Track your progress and keep up the momentum
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-full dark:glass-card dark:border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-light flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Daily Goal</span>
                <span className="font-medium">{stats?.totalCardsToday || 0}/{dailyGoal} cards</span>
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
                <p className="text-2xl font-light">{stats?.totalCardsToday || 0}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <Clock className="w-4 h-4" />
                  Study Time
                </div>
                <p className="text-2xl font-light">
                  {studyTime.hours}h {studyTime.minutes}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:glass-card dark:border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-light">Current Streak</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light">
              {stats?.streak || 0} {stats?.streak === 1 ? 'day' : 'days'}
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {stats?.streak ? 'Keep it going!' : 'Start your streak today!'}
            </p>
          </CardContent>
        </Card>

        <Card className="dark:glass-card dark:border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-light">Total Reviewed</CardTitle>
              <GraduationCap className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light">{totalCardsStudied}</div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="dark:glass-card dark:border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-light">Daily Average</CardTitle>
              <CalendarDays className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light">{averageDaily}</div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Cards per day</p>
          </CardContent>
        </Card>

        <Card className="col-span-full dark:glass-card dark:border-white/5">
          <CardHeader>
            <CardTitle className="text-xl font-light">Study Activity</CardTitle>
            <CardDescription>Cards reviewed over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.lastThirtyDays.slice(-14)}>
                  <XAxis
                    dataKey="date"
                    stroke="currentColor"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                      month: 'short',
                      day: 'numeric'
                    })}
                    className="text-neutral-600 dark:text-neutral-400"
                  />
                  <YAxis
                    stroke="currentColor"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                    className="text-neutral-600 dark:text-neutral-400"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background dark:glass-card p-3 shadow-lg dark:border-white/5">
                            <div className="grid gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-neutral-500 dark:text-neutral-400">
                                  {new Date(payload[0].payload.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                  {payload[0].value} cards
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                    className="fill-blue-500 dark:fill-blue-400"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}