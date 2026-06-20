export interface Course {
  id: string;
  name: string;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  location?: string;
  teacher?: string;
}

export interface Activity {
  id: string;
  name: string;
  type: 'club' | 'commute' | 'exam' | 'other';
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface NovelInfo {
  id: string;
  title: string;
  dailyTarget: number;
  platform: string;
  updateTime: string;
  leaveRules: string;
  currentChapter: number;
  totalWords: number;
}

export interface WritingSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  estimatedWords: number;
  label: string;
  isSelected: boolean;
  type: 'noon' | 'evening' | 'night' | 'between';
}

export interface WritingRecord {
  id: string;
  date: string;
  words: number;
  chapterCompleted: boolean;
  chapterTitle?: string;
  note?: string;
  slotId?: string;
  slotLabel?: string;
  createdAt: string;
}

export interface WarningInfo {
  id: string;
  type: 'busy' | 'exam' | 'low_stock';
  date: string;
  title: string;
  description: string;
  suggestedWords: number;
  level: 'high' | 'medium' | 'low';
}

export interface DaySchedule {
  date: string;
  dayOfWeek: number;
  courses: Course[];
  activities: Activity[];
  writingSlots: WritingSlot[];
  isToday: boolean;
  isExamDay: boolean;
}

export interface UserProfile {
  nickname: string;
  grade: string;
  major: string;
  writingSpeed: number;
  onboardingCompleted: boolean;
}

export interface AppState {
  profile: UserProfile;
  courses: Course[];
  activities: Activity[];
  novel: NovelInfo;
  writingRecords: WritingRecord[];
  selectedSlots: string[];
  warnings: WarningInfo[];
}
