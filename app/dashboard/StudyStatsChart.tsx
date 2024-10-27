import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, Flame } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import { StudyData } from '@/lib/types';
import { motion } from 'framer-motion';

interface StudyStatsChartProps {
  data: StudyData[];
  streak?: number;
}
interface HeatmapWeekData extends StudyData {
  isEmpty?: boolean;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

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

export default function StudyStatsChart({ data, streak = 0 }: StudyStatsChartProps) {
  const processedData = useMemo(() => {
    const today = new Date();
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 13);
    
    const dates = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(fourteenDaysAgo);
      date.setDate(fourteenDaysAgo.getDate() + i);
      return date;
    });

    const dataMap = new Map(data.map(item => [item.date, item]));

    return dates.map((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dataMap.get(dateStr) || { count: 0, studyTime: 0 };
      
      return {
        date: dateStr,
        displayDate: WEEKDAYS[date.getDay()], 
        count: dayData.count || 0,
        studyTime: dayData.studyTime, 
        isToday: dateStr === today.toISOString().split('T')[0],
      };
    });
  }, [data]);

  const stats = useMemo(() => {
    const totalCards = processedData.reduce((sum, day) => sum + day.count, 0);
    const bestDay = [...processedData].sort((a, b) => b.count - a.count)[0];
    const averageCards = processedData.length > 0 ? Math.round(totalCards / processedData.length) : 0;

    return {
      totalCards,
      bestDay: {
        date: new Date(bestDay.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        count: bestDay.count,
      },
      averageCards,
    };
  }, [processedData]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    
    if (hours === 0 && remainingMinutes === 0) return '0m';
    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
  
    const data = payload[0].payload;
    const studyTimeFormatted = formatTime(data.studyTime / 60); // Convert seconds to minutes
    const date = new Date(data.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return (
      <div className="dark:glass-card border border-white/10 p-4 shadow-xl rounded-lg">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium dark:text-white">{date}</p>
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-neutral-400">Cards Studied</span>
              <span className="text-sm font-medium text-blue-400">{data.count}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-neutral-400">Study Time</span>
              <span className="text-sm font-medium text-emerald-400">
                {studyTimeFormatted}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
              subtext="cards per day"
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
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: 'rgba(255,255,255,0.1)',
                  strokeWidth: 1
                }}
              />
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