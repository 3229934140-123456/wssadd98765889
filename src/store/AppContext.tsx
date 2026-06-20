import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import type { AppState, Course, Activity, NovelInfo, WritingRecord, WarningInfo, UserProfile, WritingSlot } from '@/types';
import { calculateSlots, generateWarnings } from '@/utils/schedule';

const STORAGE_KEY = 'writer_schedule_data_v1';

const defaultProfile: UserProfile = {
  nickname: '作者',
  grade: '大三',
  major: '',
  writingSpeed: 20,
  onboardingCompleted: false,
};

const defaultNovel: NovelInfo = {
  id: 'n1',
  title: '我的小说',
  dailyTarget: 2000,
  platform: '起点中文网',
  updateTime: '22:00',
  leaveRules: '每月可请假2次，需提前1天报备',
  currentChapter: 1,
  totalWords: 0,
};

interface StoredData {
  profile: UserProfile;
  courses: Course[];
  activities: Activity[];
  novel: NovelInfo;
  writingRecords: WritingRecord[];
  selectedSlots: string[];
}

const loadFromStorage = (): StoredData => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY);
    if (data) {
      console.log('[AppContext] 从本地存储加载数据');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[AppContext] 读取本地存储失败:', e);
  }
  return {
    profile: defaultProfile,
    courses: [],
    activities: [],
    novel: defaultNovel,
    writingRecords: [],
    selectedSlots: [],
  };
};

const saveToStorage = (data: StoredData) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(data));
    console.log('[AppContext] 数据已保存到本地存储');
  } catch (e) {
    console.error('[AppContext] 保存本地存储失败:', e);
  }
};

interface AppContextType extends AppState {
  addWritingRecord: (record: Omit<WritingRecord, 'id' | 'createdAt'>) => void;
  toggleSlotSelection: (slotId: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateNovel: (novel: Partial<NovelInfo>) => void;
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, course: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  updateActivity: (id: string, activity: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  getSlotsForDay: (dayOfWeek: number) => WritingSlot[];
  getWarnings: () => WarningInfo[];
  clearSelectedSlots: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [initialData] = useState<StoredData>(() => loadFromStorage());

  const [profile, setProfile] = useState<UserProfile>(initialData.profile);
  const [courses, setCourses] = useState<Course[]>(initialData.courses);
  const [activities, setActivities] = useState<Activity[]>(initialData.activities);
  const [novel, setNovel] = useState<NovelInfo>(initialData.novel);
  const [writingRecords, setWritingRecords] = useState<WritingRecord[]>(initialData.writingRecords);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(initialData.selectedSlots);

  useEffect(() => {
    const data: StoredData = {
      profile,
      courses,
      activities,
      novel,
      writingRecords,
      selectedSlots,
    };
    saveToStorage(data);
  }, [profile, courses, activities, novel, writingRecords, selectedSlots]);

  const addWritingRecord = (record: Omit<WritingRecord, 'id' | 'createdAt'>) => {
    const newRecord: WritingRecord = {
      ...record,
      id: 'w_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setWritingRecords(prev => [newRecord, ...prev]);
    if (record.chapterCompleted) {
      setNovel(prev => ({
        ...prev,
        currentChapter: prev.currentChapter + 1,
        totalWords: prev.totalWords + record.words,
      }));
    } else {
      setNovel(prev => ({
        ...prev,
        totalWords: prev.totalWords + record.words,
      }));
    }
    console.log('[AppContext] 新增写作记录:', newRecord);
  };

  const toggleSlotSelection = (slotId: string) => {
    setSelectedSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      }
      return [...prev, slotId];
    });
  };

  const clearSelectedSlots = () => {
    setSelectedSlots([]);
  };

  const updateProfile = (p: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...p, onboardingCompleted: true }));
    console.log('[AppContext] 更新用户信息:', p);
  };

  const updateNovel = (n: Partial<NovelInfo>) => {
    setNovel(prev => ({ ...prev, ...n }));
    console.log('[AppContext] 更新小说信息:', n);
  };

  const addCourse = (course: Omit<Course, 'id'>) => {
    setCourses(prev => [...prev, { ...course, id: 'c_' + Date.now() }]);
    console.log('[AppContext] 新增课程:', course);
  };

  const updateCourse = (id: string, course: Partial<Course>) => {
    setCourses(prev => prev.map(c => (c.id === id ? { ...c, ...course } : c)));
  };

  const deleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const addActivity = (activity: Omit<Activity, 'id'>) => {
    setActivities(prev => [...prev, { ...activity, id: 'a_' + Date.now() }]);
    console.log('[AppContext] 新增活动:', activity);
  };

  const updateActivity = (id: string, activity: Partial<Activity>) => {
    setActivities(prev => prev.map(a => (a.id === id ? { ...a, ...activity } : a)));
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const getSlotsForDay = (dayOfWeek: number): WritingSlot[] => {
    const slots = calculateSlots(dayOfWeek, courses, activities, profile.writingSpeed);
    return slots.map(slot => ({
      ...slot,
      isSelected: selectedSlots.includes(slot.id),
    }));
  };

  const getWarnings = (): WarningInfo[] => {
    return generateWarnings(courses, activities, novel.dailyTarget);
  };

  const resetAllData = () => {
    setProfile(defaultProfile);
    setCourses([]);
    setActivities([]);
    setNovel(defaultNovel);
    setWritingRecords([]);
    setSelectedSlots([]);
    try {
      Taro.removeStorageSync(STORAGE_KEY);
    } catch (e) {
      console.error('[AppContext] 清除本地存储失败:', e);
    }
    console.log('[AppContext] 已重置所有数据');
  };

  return (
    <AppContext.Provider value={{
      profile,
      courses,
      activities,
      novel,
      writingRecords,
      selectedSlots,
      warnings: [],
      addWritingRecord,
      toggleSlotSelection,
      updateProfile,
      updateNovel,
      addCourse,
      updateCourse,
      deleteCourse,
      addActivity,
      updateActivity,
      deleteActivity,
      getSlotsForDay,
      getWarnings,
      clearSelectedSlots,
      resetAllData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
