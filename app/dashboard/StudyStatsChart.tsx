import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface StudyData {
  date: string;
  count: number;
}

interface StudyStatsChartProps {
  data: StudyData[];
  cardCount: number;
  studyTime: number;
}

export default function StudyStatsChart({ data, cardCount, studyTime }: StudyStatsChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    const processed = data.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      cards: item.count
    })).slice(-14); 
    setChartData(processed);
  }, [data]);

  const formatStudyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="w-full h-full dark:glass-card dark:border-white/5">
      <CardHeader>
        <CardTitle className="text-xl font-light flex justify-between items-center">
          <span>Study Activity</span>
          <div className="flex gap-4 text-sm font-normal text-neutral-500 dark:text-neutral-400">
            <span>Last 14 days</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
                      <div className="rounded-lg border bg-background dark:glass-card p-2 shadow-sm dark:border-white/5">
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
              <Bar
                dataKey="cards"
                radius={[4, 4, 0, 0]}
                className="fill-neutral-900 dark:fill-white/90"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}