'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { StudyData } from '@/lib/types';

interface HeatmapProps {
  data: StudyData[];
  className?: string;
}

interface CalendarData {
  date: string;
  count: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const Heatmap: React.FC<HeatmapProps> = ({ data, className }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = React.useState(10);
  const [gap, setGap] = React.useState(2);

  const calendar = React.useMemo(() => {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const activityMap = new Map(data.map(d => [d.date, d.count]));
    const weeks: CalendarData[][] = [];
    let currentWeek: CalendarData[] = [];
    
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentWeek.push({
        date: dateStr,
        count: activityMap.get(dateStr) || 0
      });
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        const lastDate = new Date(currentWeek[currentWeek.length - 1].date);
        lastDate.setDate(lastDate.getDate() + 1);
        currentWeek.push({
          date: lastDate.toISOString().split('T')[0],
          count: 0
        });
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [data]);

  const getIntensityClass = React.useCallback((count: number): string => {
    if (count === 0) return 'bg-neutral-800 dark:bg-neutral-800';
    if (count <= 3) return 'bg-emerald-900 dark:bg-emerald-900';
    if (count <= 6) return 'bg-emerald-700 dark:bg-emerald-700';
    if (count <= 9) return 'bg-emerald-600 dark:bg-emerald-600';
    return 'bg-emerald-500 dark:bg-emerald-500';
  }, []);

  React.useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const totalCells = 53;
      const availableWidth = containerWidth - 30;
      const idealSize = Math.floor((availableWidth / totalCells - 2));
      setCellSize(Math.max(idealSize, 10));
      setGap(Math.max(Math.floor(idealSize / 5), 2));
    }
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <div className="flex flex-col">
        <div className="flex ml-8 text-xs text-neutral-500">
          {MONTHS.map((month) => (
            <div 
              key={month} 
              style={{ width: `${(cellSize + gap) * 4.33}px` }}
              className="flex-shrink-0"
            >
              {month}
            </div>
          ))}
        </div>

        <div className="flex mt-4">
          <div className="flex flex-col mr-2">
            {WEEKDAYS.map(day => (
              <div 
                key={day} 
                style={{ height: `${cellSize}px`, marginBottom: `${gap}px` }}
                className="text-xs text-neutral-500"
              >
                {day[0]}
              </div>
            ))}
          </div>

          <div className="flex gap-[2px] overflow-x-auto">
            {calendar.map((week, weekIndex) => (
              <div 
                key={weekIndex} 
                className="flex flex-col" 
                style={{ gap: `${gap}px` }}
              >
                {week.map((day) => (
                  <div
                    key={day.date}
                    style={{ 
                      width: `${cellSize}px`, 
                      height: `${cellSize}px` 
                    }}
                    className={getIntensityClass(day.count)}
                    title={`${day.date}: ${day.count} cards reviewed`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end items-center gap-2 mt-4 text-xs text-neutral-500">
          <span>Less</span>
          {[0, 3, 6, 9, 12].map((level) => (
            <div
              key={level}
              style={{ 
                width: `${cellSize}px`, 
                height: `${cellSize}px` 
              }}
              className={getIntensityClass(level)}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;