import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, Flame, BookOpen } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import { StudyData } from '@/lib/types';
import { motion } from 'framer-motion';
import { formatStudyTime, formatTimeString } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface StudyStatsChartProps {
  data: StudyData[];
  streak?: number;
}

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  color = "text-primary",
}: { 
  icon: React.ElementType;
  label: string;
  value: string;
  subtext: string;
  color?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-lg dark:bg-white/[0.02] border border-neutral-200/10 p-4"
  >
    <div className="flex items-center space-x-3">
      <div className={`p-3 ${color} bg-white/5 rounded-lg`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-neutral-400">{label}</p>
        <p className="text-2xl font-light mt-0.5">{value}</p>
        <p className="text-sm text-neutral-500 mt-0.5">{subtext}</p>
      </div>
    </div>
  </motion.div>
);

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;
  const timeFormatted = formatTimeString(formatStudyTime(data.studyTime));
  const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="dark:glass-card border border-white/10 p-4 shadow-xl rounded-lg">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium dark:text-white">{formattedDate}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm text-neutral-400">Cards Studied</span>
            <span className="text-sm font-medium text-blue-400">{data.count}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm text-neutral-400">Study Time</span>
            <span className="text-sm font-medium text-emerald-400">
              {timeFormatted}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <Card className="col-span-full dark:glass-card dark:border-white/5">
    <CardContent className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
        <BookOpen className="w-8 h-8 text-neutral-500 dark:text-neutral-400" />
      </div>
      <h3 className="text-xl font-light text-neutral-800 dark:text-white mb-2">
        No Study Data Available
      </h3>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-center max-w-md">
        Start reviewing flashcards to see your study progress and statistics here.
      </p>
      <Button asChild className="dark:bg-white dark:text-black dark:hover:bg-neutral-200">
        <Link href="/decks">
          Start Studying
        </Link>
      </Button>
    </CardContent>
  </Card>
);

export default function StudyStatsChart({ data, streak = 0 }: StudyStatsChartProps) {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const today = new Date();
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 13);

    const dataLookup = Object.fromEntries(
      data.map(item => [item.date, item])
    );
    
    const dates = [];
    for (let d = new Date(fourteenDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayData = dataLookup[dateStr] || { count: 0, studyTime: 0 };
      
      dates.push({
        date: dateStr,
        displayDate: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayData.count,
        studyTime: dayData.studyTime,
        isToday: dateStr === today.toISOString().split('T')[0]
      });
    }
    
    return dates;
  }, [data]);

  const stats = useMemo(() => {
    if (!data || data.length === 0) return {
      totalCards: 0,
      bestDay: { date: 'N/A', count: 0 },
      averageCards: 0,
      activeDays: 0
    };

    const activeDays = data.filter(day => day.count > 0);
    const totalCards = activeDays.reduce((sum, day) => sum + day.count, 0);
    const bestDay = [...data].sort((a, b) => b.count - a.count)[0];
    const averageCards = activeDays.length > 0 ? Math.round(totalCards / activeDays.length) : 0;

    return {
      totalCards,
      bestDay: {
        date: bestDay ? new Date(bestDay.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }) : 'N/A',
        count: bestDay?.count || 0,
      },
      averageCards,
      activeDays: activeDays.length
    };
  }, [data]);

  const hasStudyActivity = data?.some(day => day.count > 0 || day.studyTime > 0);

  if (!data || data.length === 0 || !hasStudyActivity) {
    return <EmptyState />;
  }

  return (
    <Card className="col-span-full dark:glass-card dark:border-white/5">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4">
          <CardTitle className="flex items-center gap-2 text-xl font-light">
            <Activity className="h-5 w-5 text-blue-500" />
            Study Progress
          </CardTitle>
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={Target}
              label="Best Session"
              value={stats.bestDay.count.toString()}
              subtext={stats.bestDay.date}
              color="text-amber-500"
            />
            <StatCard
              icon={Flame}
              label="Current Streak"
              value={streak.toString()}
              subtext={`day${streak === 1 ? '' : 's'}`}
              color="text-blue-500"
            />
            <StatCard
              icon={Activity}
              label="Daily Average"
              value={stats.averageCards.toString()}
              subtext={`over ${stats.activeDays} active day${stats.activeDays === 1 ? '' : 's'}`}
              color="text-emerald-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <defs>
                <linearGradient id="colorCards" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="displayDate"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: 'rgba(255,255,255,0.5)',
                  fontSize: 12
                }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: 'rgba(255,255,255,0.5)',
                  fontSize: 12
                }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorCards)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}