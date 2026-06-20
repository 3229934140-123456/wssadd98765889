import dayjs from 'dayjs';
import type { Course, Activity, NovelInfo, WritingRecord, WarningInfo, UserProfile, WritingSlot } from '@/types';

export const mockProfile: UserProfile = {
  nickname: '夜行者',
  grade: '大三',
  major: '汉语言文学',
  writingSpeed: 20,
  onboardingCompleted: true,
};

export const mockCourses: Course[] = [
  { id: 'c1', name: '古代文学', dayOfWeek: 1, startPeriod: 1, endPeriod: 2, location: '文一301', teacher: '王教授' },
  { id: 'c2', name: '现代汉语', dayOfWeek: 1, startPeriod: 3, endPeriod: 4, location: '文一205', teacher: '李老师' },
  { id: 'c3', name: '大学英语', dayOfWeek: 2, startPeriod: 1, endPeriod: 2, location: '外语楼102', teacher: '张老师' },
  { id: 'c4', name: '文学概论', dayOfWeek: 2, startPeriod: 5, endPeriod: 6, location: '文一401', teacher: '陈教授' },
  { id: 'c5', name: '写作基础', dayOfWeek: 3, startPeriod: 3, endPeriod: 4, location: '文一108', teacher: '刘老师' },
  { id: 'c6', name: '马克思主义原理', dayOfWeek: 3, startPeriod: 7, endPeriod: 8, location: '公共楼201' },
  { id: 'c7', name: '中国现代文学', dayOfWeek: 4, startPeriod: 1, endPeriod: 2, location: '文一302', teacher: '赵老师' },
  { id: 'c8', name: '体育', dayOfWeek: 4, startPeriod: 5, endPeriod: 6, location: '体育场' },
  { id: 'c9', name: '比较文学', dayOfWeek: 5, startPeriod: 3, endPeriod: 4, location: '文一405', teacher: '孙教授' },
];

export const mockActivities: Activity[] = [
  { id: 'a1', name: '文学社例会', type: 'club', dayOfWeek: 2, startTime: '19:00', endTime: '21:00' },
  { id: 'a2', name: '通勤-早', type: 'commute', dayOfWeek: 1, startTime: '07:30', endTime: '08:00' },
  { id: 'a3', name: '通勤-晚', type: 'commute', dayOfWeek: 5, startTime: '17:00', endTime: '17:40' },
  { id: 'a4', name: '期末考-古代文学', type: 'exam', dayOfWeek: 6, startTime: '09:00', endTime: '11:00' },
  { id: 'a5', name: '期末考-英语', type: 'exam', dayOfWeek: 7, startTime: '14:00', endTime: '16:00' },
];

export const mockNovel: NovelInfo = {
  id: 'n1',
  title: '长安夜雨',
  dailyTarget: 2000,
  platform: '起点中文网',
  updateTime: '22:00',
  leaveRules: '每月可请假2次，需提前1天报备',
  currentChapter: 127,
  totalWords: 356000,
};

const today = dayjs().format('YYYY-MM-DD');
const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
const dayBefore = dayjs().subtract(2, 'day').format('YYYY-MM-DD');
const threeDaysAgo = dayjs().subtract(3, 'day').format('YYYY-MM-DD');

export const mockWritingRecords: WritingRecord[] = [
  { id: 'w1', date: threeDaysAgo, words: 2100, chapterCompleted: true, chapterTitle: '第124章 暗流涌动', createdAt: threeDaysAgo + ' 21:30' },
  { id: 'w2', date: dayBefore, words: 1800, chapterCompleted: true, chapterTitle: '第125章 雨夜相逢', createdAt: dayBefore + ' 22:10' },
  { id: 'w3', date: yesterday, words: 2300, chapterCompleted: true, chapterTitle: '第126章 故人归来', createdAt: yesterday + ' 21:55' },
  { id: 'w4', date: today, words: 800, chapterCompleted: false, createdAt: today + ' 12:45' },
];

export const mockWarnings: WarningInfo[] = [
  {
    id: 'warn1',
    type: 'exam',
    date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    title: '明天有古代文学期末考',
    description: '上午9:00-11:00考试，预计复习时间紧张',
    suggestedWords: 1500,
    level: 'high',
  },
  {
    id: 'warn2',
    type: 'busy',
    date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    title: '后天满课+文学社活动',
    description: '全天6节课+晚上例会，几乎没有写作时间',
    suggestedWords: 2000,
    level: 'medium',
  },
  {
    id: 'warn3',
    type: 'low_stock',
    date: today,
    title: '存稿不足3天',
    description: '当前存稿仅2章，建议利用周末多存一些',
    suggestedWords: 3000,
    level: 'low',
  },
];

export function generateMockSlots(dayOfWeek: number, writingSpeed: number = 20): WritingSlot[] {
  const slots: WritingSlot[] = [];

  const hasMorningClasses = mockCourses.some(c => c.dayOfWeek === dayOfWeek && c.startPeriod <= 2);
  const hasAfternoonClasses = mockCourses.some(c => c.dayOfWeek === dayOfWeek && c.startPeriod >= 3 && c.endPeriod <= 6);
  const hasEveningClasses = mockCourses.some(c => c.dayOfWeek === dayOfWeek && c.startPeriod >= 7);
  const hasClubMeeting = mockActivities.some(a => a.dayOfWeek === dayOfWeek && a.type === 'club');

  if (hasMorningClasses && hasAfternoonClasses) {
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

  if (hasAfternoonClasses && !hasEveningClasses) {
    slots.push({
      id: `slot-${dayOfWeek}-evening`,
      dayOfWeek,
      startTime: '18:00',
      endTime: '19:30',
      durationMinutes: 90,
      estimatedWords: Math.round(90 * writingSpeed),
      label: '晚自修前',
      isSelected: false,
      type: 'evening',
    });
  }

  if (!hasClubMeeting) {
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

  const gaps: Array<{ start: number; end: number; label: string }> = [];
  const dayCourses = mockCourses.filter(c => c.dayOfWeek === dayOfWeek).sort((a, b) => a.startPeriod - b.startPeriod);
  for (let i = 0; i < dayCourses.length - 1; i++) {
    const gap = dayCourses[i + 1].startPeriod - dayCourses[i].endPeriod;
    if (gap >= 2) {
      const startHour = 8 + dayCourses[i].endPeriod * 1.5;
      const endHour = 8 + dayCourses[i + 1].startPeriod * 1.5;
      const duration = Math.round((endHour - startHour) * 60);
      if (duration >= 30) {
        gaps.push({ start: startHour, end: endHour, label: '课间空档' });
      }
    }
  }

  gaps.forEach((g, idx) => {
    const startH = Math.floor(g.start);
    const startM = Math.round((g.start - startH) * 60);
    const endH = Math.floor(g.end);
    const endM = Math.round((g.end - endH) * 60);
    const duration = Math.round((g.end - g.start) * 60);
    slots.push({
      id: `slot-${dayOfWeek}-gap-${idx}`,
      dayOfWeek,
      startTime: `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`,
      endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
      durationMinutes: duration,
      estimatedWords: Math.round(duration * writingSpeed),
      label: g.label,
      isSelected: false,
      type: 'between',
    });
  });

  return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
}
