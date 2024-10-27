'use client';

import React from 'react';
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Clock, GraduationCap, Target, TrendingUp, Brain } from "lucide-react";
import { StudySessionStats } from '@/lib/db';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-neutral-600 dark:text-neutral-400">
          Loading your study stats...
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

  const calculateStreak = () => {
    if (!stats?.lastThirtyDays) return 0;
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = stats.lastThirtyDays.length - 1; i >= 0; i--) {
      if (stats.lastThirtyDays[i].count > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();
  
  const chartData = stats?.lastThirtyDays.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cards: day.count
  })) || [];

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-light text-neutral-800 dark:text-white">
          Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Track your progress and maintain your study streak
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dark:glass-card dark:border-white/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                <Target className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Daily Progress</p>
                <h3 className="text-2xl font-light mt-1">
                  {progressPercentage.toFixed(0)}%
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:glass-card dark:border-white/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                <Brain className="h-6 w-6 text-green-500 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Cards Today</p>
                <h3 className="text-2xl font-light mt-1">
                  {stats?.totalCardsToday || 0}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:glass-card dark:border-white/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-500 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Study Streak</p>
                <h3 className="text-2xl font-light mt-1">
                  {streak} days
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:glass-card dark:border-white/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-500/10 dark:bg-orange-500/20 rounded-lg">
                <Clock className="h-6 w-6 text-orange-500 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Study Time</p>
                <h3 className="text-2xl font-light mt-1">
                  {studyTime.hours}h {studyTime.minutes}m
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress Card */}
      <Card className="dark:glass-card dark:border-white/5">
        <CardHeader>
          <CardTitle>Today's Progress</CardTitle>
          <CardDescription>Track your daily learning goals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-medium">Cards Reviewed</span>
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
        </CardContent>
      </Card>

      {/* Study Activity Chart */}
      <Card className="dark:glass-card dark:border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Study Activity</span>
            <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
              Last 14 days
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.slice(-14)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCards" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="currentColor" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  className="text-neutral-500 dark:text-neutral-400"
                />
                <YAxis
                  stroke="currentColor"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  className="text-neutral-500 dark:text-neutral-400"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background dark:glass-card p-3 shadow-sm dark:border-white/5">
                          <div className="grid gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-neutral-500 dark:text-neutral-400">
                                {payload[0].payload.date}
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
                <Area
                  type="monotone"
                  dataKey="cards"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorCards)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}