import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, Flame } from 'lucide-react';
import { StudyData } from '@/lib/types';
import { motion } from 'framer-motion';

const getContrastText = (intensity: number) => {
    return intensity > 0.6 ? 'text-white' : 'text-neutral-900 dark:text-neutral-100';
};

const formatStudyTime = (minutes: number): { hours: number; minutes: number } => {
    return {
        hours: Math.floor(minutes / 60),
        minutes: minutes % 60
    };
};

type Label = {
    month: string;
    x: number;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

interface HeatmapProps {
    data: StudyData[];
    className?: string;
}

const Heatmap = ({ data, className }: HeatmapProps) => {
    const monthLabels = () => {
        const labels: Label[] = []; 
        
        if (!weeks || weeks.length === 0 || !weeks[0] || weeks[0].length === 0) {
            return labels;
        }
    
        let currentDate = new Date(weeks[0][0].date);
        const endDate = new Date(weeks[weeks.length - 1][6]?.date);
    
        while (currentDate <= endDate) {
            if (currentDate.getDate() <= 7) {
                labels.push({
                    month: MONTHS[currentDate.getMonth()],
                    x: weeks.findIndex(week =>
                        new Date(week[0].date).getMonth() === currentDate.getMonth()
                    )
                });
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return labels;
    };
    

    const generateWeeks = (data: StudyData[]) => {
        const weeks: StudyData[][] = [];
        let currentWeek: StudyData[] = [];

        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const dateMap = new Map(data.map(d => [d.date, d]));

        for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayData = dateMap.get(dateStr) || {
                date: dateStr,
                count: 0,
                studyTime: 0
            };

            currentWeek.push(dayData);

            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }

        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                const lastDate = new Date(currentWeek[currentWeek.length - 1].date);
                lastDate.setDate(lastDate.getDate() + 1);
                const dateStr = lastDate.toISOString().split('T')[0];
                currentWeek.push({ date: dateStr, count: 0, studyTime: 0 });
            }
            weeks.push(currentWeek);
        }

        return weeks;
    };
    const maxCount = Math.max(...data.map(d => d.count));
    const weeks = generateWeeks(data);
    let currentWeek: StudyData[] = [];

    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const dateMap = new Map(data.map(d => [d.date, d]));


    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayData = dateMap.get(dateStr) || { date: dateStr, count: 0, studyTime: 0 };
        currentWeek.push(dayData);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }

    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }

    const getIntensityClass = (count: number): string => {
        if (count === 0) return 'bg-neutral-100 dark:bg-neutral-800';
        const intensity = count / maxCount;
        if (intensity <= 0.2) return 'bg-blue-100 dark:bg-blue-900/30';
        if (intensity <= 0.4) return 'bg-blue-200 dark:bg-blue-800/40';
        if (intensity <= 0.6) return 'bg-blue-300 dark:bg-blue-700/50';
        if (intensity <= 0.8) return 'bg-blue-400 dark:bg-blue-600/60';
        return 'bg-blue-500 dark:bg-blue-500/70';
    };

    return (
        <div className={className}>
            <div className="mb-4">
                <h3 className="text-lg font-medium">Review Heatmap</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Your learning activity over the past year
                </p>
            </div>

            <div className="relative">
                <div className="flex text-xs mb-2">
                    <div className="w-8" />
                    <div className="flex-1 flex">
                        {monthLabels().map(({ month, x }, i) => (
                            <div
                                key={i}
                                className="absolute text-neutral-600 dark:text-neutral-400"
                                style={{ left: `${(x * 100 / 52) + 3}%` }}
                            >
                                {month}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex text-xs">
                    <div className="flex flex-col justify-around text-neutral-600 dark:text-neutral-400 pr-2">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="h-[12px]">{day[0]}</div>
                        ))}
                    </div>
                    <div className="flex-1 grid grid-cols-52 gap-1">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {week.map((day, dayIndex) => (
                                    <div
                                        key={`${weekIndex}-${dayIndex}`}
                                        className={`w-[12px] h-[12px] rounded-sm ${getIntensityClass(day.count)}`}
                                        title={`${day.date}: ${day.count} cards reviewed`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-end mt-4 gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <span>Less</span>
                    <div className="flex gap-1">
                        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
                            <div
                                key={intensity}
                                className={`w-[12px] h-[12px] rounded-sm ${getIntensityClass(intensity * maxCount)}`}
                            />
                        ))}
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
};

export { Heatmap, formatStudyTime };