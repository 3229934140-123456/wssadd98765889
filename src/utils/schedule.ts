import dayjs from 'dayjs';
import type { Course, Activity, WritingSlot, WarningInfo } from '@/types';

const PERIOD_TIMETABLE: Array<{ start: string; end: string }> = [
  { start: '00:00', end: '00:00' },
  { start: '08:00', end: '09:30' },
  { start: '09:30', end: '11:00' },
  { start: '11:10', end: '12:40' },
  { start: '14:00', end: '15:30' },
  { start: '15:40', end: '17:10' },
  { start: '17:20', end: '18:50' },
  { start: '19:30', end: '21:00' },
  { start: '21:10', end: '22:40' },
];

export const normalizeTime = (time: string): string => {
  if (!time) return '00:00';
  const trimmed = time.trim();
  let h: number | string;
  let m: number | string;
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    h = parseInt(parts[0] || '0', 10);
    m = parseInt(parts[1] || '0', 10);
  } else if (trimmed.includes('：')) {
    const parts = trimmed.split('：');
    h = parseInt(parts[0] || '0', 10);
    m = parseInt(parts[1] || '0', 10);
  } else if (trimmed.length <= 2) {
    h = parseInt(trimmed, 10);
    m = 0;
  } else {
    const len = trimmed.length;
    h = parseInt(trimmed.slice(0, len - 2) || '0', 10);
    m = parseInt(trimmed.slice(-2), 10);
  }
  h = isNaN(h) ? 0 : h;
  m = isNaN(m) ? 0 : m;
  h = Math.max(0, Math.min(23, h));
  m = Math.max(0, Math.min(59, m));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const timeToMinutes = (time: string): number => {
  const normalized = normalizeTime(time);
  const [h, m] = normalized.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const isOverlap = (
  s1: string, e1: string,
  s2: string, e2: string
): boolean => {
  const aStart = timeToMinutes(s1);
  const aEnd = timeToMinutes(e1);
  const bStart = timeToMinutes(s2);
  const bEnd = timeToMinutes(e2);
  return aStart < bEnd && bStart < aEnd;
};

export const periodToTime = (period: number): { start: string; end: string } => {
  const idx = Math.max(1, Math.min(8, period));
  return { ...PERIOD_TIMETABLE[idx] };
};

export const getCourseTimeRange = (startPeriod: number, endPeriod: number): { start: string; end: string; durationMin: number } => {
  const s = periodToTime(startPeriod).start;
  const e = periodToTime(endPeriod).end;
  return {
    start: s,
    end: e,
    durationMin: timeToMinutes(e) - timeToMinutes(s),
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

  const busyRanges: Array<{ start: string; end: string }> = [];
  dayCourses.forEach(c => {
    const { start: cs, end: ce } = periodToTime(c.startPeriod);
    const { end: cee } = periodToTime(c.endPeriod);
    busyRanges.push({ start: cs, end: cee });
  });
  dayActivities.forEach(a => {
    busyRanges.push({ start: a.startTime, end: a.endTime });
  });

  const hasConflict = (s: string, e: string): boolean => {
    return busyRanges.some(r => isOverlap(s, e, r.start, r.end));
  };

  const hasMorning = dayCourses.some(c => c.startPeriod <= 3);
  const hasAfternoon = dayCourses.some(c => c.startPeriod >= 4 && c.startPeriod <= 6);
  const hasEvening = dayCourses.some(c => c.startPeriod >= 7);

  if (hasMorning && hasAfternoon) {
    const s = '13:00', e = '13:40';
    if (!hasConflict(s, e)) {
      slots.push({
        id: `slot-${dayOfWeek}-noon`,
        dayOfWeek,
        startTime: s,
        endTime: e,
        durationMinutes: 40,
        estimatedWords: Math.round(40 * writingSpeed),
        label: '午休空档',
        isSelected: false,
        type: 'noon',
      });
    }
  }

  if (hasAfternoon && !hasEvening) {
    const s = '18:50', e = '20:20';
    if (!hasConflict(s, e)) {
      slots.push({
        id: `slot-${dayOfWeek}-evening`,
        dayOfWeek,
        startTime: s,
        endTime: e,
        durationMinutes: 90,
        estimatedWords: Math.round(90 * writingSpeed),
        label: '晚饭後',
        isSelected: false,
        type: 'evening',
      });
    }
  }

  {
    const s = '20:30', e = '22:00';
    if (!hasConflict(s, e)) {
      slots.push({
        id: `slot-${dayOfWeek}-night`,
        dayOfWeek,
        startTime: s,
        endTime: e,
        durationMinutes: 90,
        estimatedWords: Math.round(90 * writingSpeed),
        label: '睡前黄金档',
        isSelected: false,
        type: 'night',
      });
    }
  }

  for (let i = 0; i < dayCourses.length - 1; i++) {
    const gap = dayCourses[i + 1].startPeriod - dayCourses[i].endPeriod;
    if (gap >= 2) {
      const endTime = periodToTime(dayCourses[i].endPeriod).end;
      const startTime = periodToTime(dayCourses[i + 1].startPeriod).start;
      const duration = timeToMinutes(startTime) - timeToMinutes(endTime);
      if (duration >= 30 && !hasConflict(endTime, startTime)) {
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
