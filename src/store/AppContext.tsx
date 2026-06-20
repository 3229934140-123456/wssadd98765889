import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { AppState, Course, Activity, NovelInfo, WritingRecord, WarningInfo, UserProfile, WritingSlot } from '@/types';
import { mockProfile, mockCourses, mockActivities, mockNovel, mockWritingRecords, mockWarnings, generateMockSlots } from '@/data/mock';

interface AppContextType extends AppState {
  addWritingRecord: (record: Omit<WritingRecord, 'id' | 'createdAt'>) => void;
  toggleSlotSelection: (slotId: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateNovel: (novel: Partial<NovelInfo>) => void;
  addCourse: (course: Omit<Course, 'id'>) => void;
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  getSlotsForDay: (dayOfWeek: number) => WritingSlot[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [novel, setNovel] = useState<NovelInfo>(mockNovel);
  const [writingRecords, setWritingRecords] = useState<WritingRecord[]>(mockWritingRecords);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [warnings] = useState<WarningInfo[]>(mockWarnings);

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
  };

  const addActivity = (activity: Omit<Activity, 'id'>) => {
    setActivities(prev => [...prev, { ...activity, id: 'a_' + Date.now() }]);
  };

  const getSlotsForDay = (dayOfWeek: number): WritingSlot[] => {
    const slots = generateMockSlots(dayOfWeek, profile.writingSpeed);
    return slots.map(slot => ({
      ...slot,
      isSelected: selectedSlots.includes(slot.id),
    }));
  };

  return (
    <AppContext.Provider value={{
      profile,
      courses,
      activities,
      novel,
      writingRecords,
      selectedSlots,
      warnings,
      addWritingRecord,
      toggleSlotSelection,
      updateProfile,
      updateNovel,
      addCourse,
      addActivity,
      getSlotsForDay,
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
