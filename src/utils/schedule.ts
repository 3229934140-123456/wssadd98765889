import dayjs from 'dayjs';
import type { Course, Activity, WritingSlot, WarningInfo } from '@/types';

export const periodToTime = (period: number): { start: string; end: string } => {
  const baseHour = 8;
  const startMinutes = (period - 1) * 90;
  const startHour = baseHour + Math.floor(startMinutes / 60);
  const startMin = startMinutes % 60;
  const endHour = startHour + 1;
  const endMin = startMin + 30;
  return {
    start: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
    end: `${endHour.toString().padStart(2, '0')}:${(endMin >= 60 ? endMin - 60 : endMin).toString().padStart(2, '0')}`,
  };
};

export const dayOfWeekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const getWeekDates = (): Array<{ date: string; dayOfWeek: number; dayName: string; isToday: boolean }> => {
  const today = dayjs();
  const startOfWeek = today.startOf('week');
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = startOfWeek.add(i, 'day');
    dates.push({
      date: d.format('YYYY-MM-DD'),
      dayOfWeek: i === 0 ? 7 : i,
      dayName: dayOfWeekNames[i],
      isToday: d.isSame(today, 'day'),
    });
  }
  return dates;
};

export const calculateSlots = (
  dayOfWeek: number,
  courses: Course[],
  activities: Activity[],
  writingSpeed: number = 20
): WritingSlot[] => {
  const slots: WritingSlot[] = [];
  const dayCourses = courses.filter(c => c.dayOfWeek === dayOfWeek).sort((a, b) => a.startPeriod - b.startPeriod);
  const dayActivities = activities.filter(a => a.dayOfWeek === dayOfWeek);

  const hasMorning = dayCourses.some(c => c.startPeriod <= 2);
  const hasAfternoon = dayCourses.some(c => c.startPeriod >= 3 && c.startPeriod <= 6);
  const hasEvening = dayCourses.some(c => c.startPeriod >= 7);
  const hasClub = dayActivities.some(a => a.type === 'club');

  if (hasMorning && hasAfternoon) {
    slots.push({
      id: `slot-${dayOfWeek}-noon`,
      dayOfWeek,
      startTime: '12:20',
      endTime: '13:00',
      durationMinutes: 40,
      estimatedWords: Math.round(40 * writingSpeed),
      label: '午休空档',
      isSelected: false,
      type: 'noon',
    });
  }

  if (hasAfternoon && !hasEvening) {
    slots.push({
      id: `slot-${dayOfWeek}-evening`,
      dayOfWeek,
      startTime: '18:00',
      endTime: '19:30',
      durationMinutes: 90,
      estimatedWords: Math.round(90 * writingSpeed),
      label: '晚饭後',
      isSelected: false,
      type: 'evening',
    });
  }

  if (!hasClub) {
    slots.push({
      id: `slot-${dayOfWeek}-night`,
      dayOfWeek,
      startTime: '20:30',
      endTime: '22:00',
      durationMinutes: 90,
      estimatedWords: Math.round(90 * writingSpeed),
      label: '睡前黄金档',
      isSelected: false,
      type: 'night',
    });
  }

  for (let i = 0; i < dayCourses.length - 1; i++) {
    const gap = dayCourses[i + 1].startPeriod - dayCourses[i].endPeriod;
    if (gap >= 2) {
      const endTime = periodToTime(dayCourses[i].endPeriod).end;
      const startTime = periodToTime(dayCourses[i + 1].startPeriod).start;
      const [eh, em] = endTime.split(':').map(Number);
      const [sh, sm] = startTime.split(':').map(Number);
      const duration = (sh * 60 + sm) - (eh * 60 + em);
      if (duration >= 30) {
        slots.push({
          id: `slot-${dayOfWeek}-gap-${i}`,
          dayOfWeek,
          startTime: endTime,
          endTime: startTime,
          durationMinutes: duration,
          estimatedWords: Math.round(duration * writingSpeed),
          label: '课间空档',
          isSelected: false,
          type: 'between',
        });
      }
    }
  }

  return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
};

export const generateWarnings = (
  courses: Course[],
  activities: Activity[],
  dailyTarget: number
): WarningInfo[] => {
  const warnings: WarningInfo[] = [];
  const today = dayjs();

  for (let offset = 1; offset <= 2; offset++) {
    const targetDate = today.add(offset, 'day');
    const dayOfWeek = targetDate.day() === 0 ? 7 : targetDate.day();
    const dayCourses = courses.filter(c => c.dayOfWeek === dayOfWeek);
    const dayActivities = activities.filter(a => a.dayOfWeek === dayOfWeek);
    const dayExams = dayActivities.filter(a => a.type === 'exam');

    if (dayExams.length > 0) {
      warnings.push({
        id: `warn-exam-${offset}`,
        type: 'exam',
        date: targetDate.format('YYYY-MM-DD'),
        title: `${offset === 1 ? '明天' : '后天'}有${dayExams.length}场考试`,
        description: `${dayExams.map(e => e.name).join('、')}，需要时间复习`,
        suggestedWords: dailyTarget,
        level: 'high',
      });
    } else if (dayCourses.length >= 5) {
      warnings.push({
        id: `warn-busy-${offset}`,
        type: 'busy',
        date: targetDate.format('YYYY-MM-DD'),
        title: `${offset === 1 ? '明天' : '后天'}课程密集`,
        description: `全天${dayCourses.length}节课，写作时间可能不足`,
        suggestedWords: Math.round(dailyTarget * 0.8),
        level: 'medium',
      });
    }
  }

  return warnings;
};

export const formatWordsCount = (words: number): string => {
  if (words >= 10000) {
    return (words / 10000).toFixed(1) + '万';
  }
  return words.toString();
};

export const getTodayProgress = (records: Array<{ words: number }>, dailyTarget: number): {
  current: number;
  target: number;
  percent: number;
  remaining: number;
} => {
  const todayStr = dayjs().format('YYYY-MM-DD');
  const todayRecords = records.filter(r => r.date === todayStr);
  const current = todayRecords.reduce((sum, r) => sum + r.words, 0);
  return {
    current,
    target: dailyTarget,
    percent: Math.min(100, Math.round((current / dailyTarget) * 100)),
    remaining: Math.max(0, dailyTarget - current),
  };
};
