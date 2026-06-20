import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useApp } from '@/store/AppContext';
import { periodToTime, dayOfWeekNames, formatWordsCount } from '@/utils/schedule';
import ScheduleCard from '@/components/ScheduleCard';
import WritingSlotComp from '@/components/WritingSlot';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const CalendarPage: React.FC = () => {
  const { courses, activities, getSlotsForDay, toggleSlotSelection, selectedSlots, profile, novel } = useApp();
  const todayDayOfWeek = dayjs().day() === 0 ? 7 : dayjs().day();
  const [selectedDay, setSelectedDay] = useState<number>(todayDayOfWeek);

  const weekDates = useMemo(() => {
    const startOfWeek = dayjs().startOf('week');
    return Array.from({ length: 7 }, (_, i) => {
      const d = startOfWeek.add(i, 'day');
      return {
        dayOfWeek: i === 0 ? 7 : i,
        dayName: dayOfWeekNames[i],
        date: d.format('DD'),
        isToday: d.isSame(dayjs(), 'day'),
      };
    });
  }, []);

  const daySchedule = useMemo(() => {
    const dayCourses = courses.filter(c => c.dayOfWeek === selectedDay);
    const dayActivities = activities.filter(a => a.dayOfWeek === selectedDay);
    const slots = getSlotsForDay(selectedDay);

    const allItems = [
      ...dayCourses.map(c => {
        const { start, end } = periodToTime(c.startPeriod);
        return {
          id: c.id,
          name: c.name,
          type: 'course' as const,
          time: `${start}-${end}`,
          location: c.location,
          teacher: c.teacher,
          sortKey: start,
        };
      }),
      ...dayActivities.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type === 'commute' ? 'commute' as const : a.type === 'exam' ? 'exam' as const : a.type === 'club' ? 'club' as const : 'other' as const,
        time: `${a.startTime}-${a.endTime}`,
        sortKey: a.startTime,
      })),
    ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    return { items: allItems, slots };
  }, [selectedDay, courses, activities, getSlotsForDay]);

  const selectedDaySlots = daySchedule.slots.filter(s => selectedSlots.includes(s.id));
  const totalEstimatedWords = selectedDaySlots.reduce((sum, s) => sum + s.estimatedWords, 0);
  const totalMinutes = selectedDaySlots.reduce((sum, s) => sum + s.durationMinutes, 0);

  const isToday = selectedDay === todayDayOfWeek;

  return (
    <View className={styles.pageContainer}>
      <ScrollView className={styles.weekBar} scrollX showScrollbar={false}>
        {weekDates.map(d => (
          <View
            key={d.dayOfWeek}
            className={classnames(styles.dayItem, { [styles.dayActive]: selectedDay === d.dayOfWeek })}
            onClick={() => setSelectedDay(d.dayOfWeek)}
          >
            <Text className={styles.dayName}>{d.dayName}{d.isToday ? '(今)' : ''}</Text>
            <Text className={styles.dayDate}>{d.date}</Text>
          </View>
        ))}
      </ScrollView>

      {isToday && (
        <View className={styles.summaryCard}>
          <View className={styles.summaryHeader}>
            <Text className={styles.summaryTitle}>今日码字计划</Text>
            <Text className={styles.summaryBadge}>{novel.title}</Text>
          </View>
          <View className={styles.summaryBody}>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryLabel}>已选时段</Text>
              <Text className={styles.summaryValue}>
                {selectedDaySlots.length}
                <Text className={styles.unit}>个</Text>
              </Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryLabel}>预计可写</Text>
              <Text className={styles.summaryValue}>
                {formatWordsCount(totalEstimatedWords)}
                <Text className={styles.unit}>字</Text>
              </Text>
            </View>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryLabel}>累计时长</Text>
              <Text className={styles.summaryValue}>
                {totalMinutes}
                <Text className={styles.unit}>分钟</Text>
              </Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>当日日程</Text>
          <Text className={styles.sectionSubtitle}>共 {daySchedule.items.length} 项</Text>
        </View>
        {daySchedule.items.length > 0 ? (
          daySchedule.items.map(item => (
            <ScheduleCard
              key={item.id}
              name={item.name}
              type={item.type}
              time={item.time}
              location={'location' in item ? item.location : undefined}
              teacher={'teacher' in item ? item.teacher : undefined}
            />
          ))
        ) : (
          <View className={styles.emptyTip}>今天没有安排，是写作的好日子 🎉</View>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>推荐写作空档</Text>
          <Text className={styles.sectionSubtitle}>基于 {profile.writingSpeed}字/分钟 估算</Text>
        </View>
        {daySchedule.slots.length > 0 ? (
          daySchedule.slots.map(slot => (
            <WritingSlotComp
              key={slot.id}
              label={slot.label}
              startTime={slot.startTime}
              endTime={slot.endTime}
              durationMinutes={slot.durationMinutes}
              estimatedWords={slot.estimatedWords}
              isSelected={slot.isSelected}
              onSelect={() => toggleSlotSelection(slot.id)}
            />
          ))
        ) : (
          <EmptyState icon="⏰" text="今天日程太满了，没有找到合适的写作空档" />
        )}
      </View>
    </View>
  );
};

export default CalendarPage;
