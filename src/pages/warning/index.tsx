import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import dayjs from 'dayjs';
import { useApp } from '@/store/AppContext';
import { formatWordsCount, getCourseTimeRange } from '@/utils/schedule';
import WarningCard from '@/components/WarningCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const WarningPage: React.FC = () => {
  const { getWarnings, novel, courses, activities, writingRecords } = useApp();
  const warnings = getWarnings();

  const stockDays = useMemo(() => {
    const avgDaily = novel.dailyTarget;
    const recentTotal = writingRecords
      .filter(r => dayjs(r.date).isAfter(dayjs().subtract(7, 'day')))
      .reduce((sum, r) => sum + r.words, 0);
    const extraWords = Math.max(0, recentTotal - avgDaily * 5);
    return Math.floor(extraWords / avgDaily);
  }, [writingRecords, novel.dailyTarget]);

  const upcomingDays = useMemo(() => {
    return [1, 2].map(offset => {
      const target = dayjs().add(offset, 'day');
      const dayOfWeek = target.day() === 0 ? 7 : target.day();
      const dayCourses = courses.filter(c => c.dayOfWeek === dayOfWeek).sort((a, b) => a.startPeriod - b.startPeriod);
      const dayActivities = activities.filter(a => a.dayOfWeek === dayOfWeek).sort((a, b) => a.startTime.localeCompare(b.startTime));
      const dayExams = dayActivities.filter(a => a.type === 'exam');
      const dayClubs = dayActivities.filter(a => a.type === 'club');
      const dayCommutes = dayActivities.filter(a => a.type === 'commute');

      const hasWarning = warnings.some(w => w.date === target.format('YYYY-MM-DD'));
      const warningForDay = warnings.find(w => w.date === target.format('YYYY-MM-DD'));

      const courseItems = dayCourses.map(c => {
        const { start, end } = getCourseTimeRange(c.startPeriod, c.endPeriod);
        return {
          id: 'course_' + c.id,
          type: 'course' as const,
          label: c.name,
          time: `${start}-${end}`,
          sortKey: start,
        };
      });

      const activityItems = dayActivities.map(a => ({
        id: 'act_' + a.id,
        type: a.type as 'exam' | 'club' | 'commute' | 'other',
        label: a.name,
        time: `${a.startTime}-${a.endTime}`,
        sortKey: a.startTime,
      }));

      const scheduleItems = [...courseItems, ...activityItems].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

      return {
        date: target.format('YYYY-MM-DD'),
        label: offset === 1 ? '明天' : '后天',
        dayName: target.format('dddd'),
        dayCourses,
        dayExams,
        dayClubs,
        dayCommutes,
        hasWarning,
        warning: warningForDay,
        scheduleItems,
      };
    });
  }, [warnings, courses, activities]);

  const totalSuggested = warnings.reduce((sum, w) => sum + w.suggestedWords, 0);

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.statusCard}>
        <View className={styles.statusHeader}>
          <Text className={styles.statusTitle}>📦 当前存稿状态</Text>
          <View className={styles.statusBadge}>
            {stockDays >= 3 ? '✓ 安全' : stockDays >= 1 ? '⚠ 偏低' : '! 危险'}
          </View>
        </View>
        <View className={styles.statusBody}>
          <View className={styles.statusItem}>
            <Text className={styles.statusLabel}>存稿可支撑</Text>
            <Text className={styles.statusValue}>
              {stockDays}
              <Text className={styles.unit}>天</Text>
            </Text>
          </View>
          <View className={styles.statusItem}>
            <Text className={styles.statusLabel}>累计写作</Text>
            <Text className={styles.statusValue}>
              {formatWordsCount(novel.totalWords)}
              <Text className={styles.unit}>字</Text>
            </Text>
          </View>
          <View className={styles.statusItem}>
            <Text className={styles.statusLabel}>已更新</Text>
            <Text className={styles.statusValue}>
              {novel.currentChapter}
              <Text className={styles.unit}>章</Text>
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>🚨 断更预警</Text>
          <Text className={styles.sectionCount}>{warnings.length} 条</Text>
        </View>

        {warnings.length > 0 ? (
          warnings.map(w => (
            <WarningCard
              key={w.id}
              type={w.type}
              level={w.level}
              title={w.title}
              date={w.date}
              description={w.description}
              suggestedWords={w.suggestedWords}
            />
          ))
        ) : (
          <EmptyState icon="🎯" text="未来几天一切安好，安心码字吧" />
        )}

        {warnings.length > 0 && (
          <View className={styles.suggestionBox}>
            <Text className={styles.suggestionTitle}>💡 断更预演结论</Text>
            <Text className={styles.suggestionContent}>
              综合分析未来2天日程，建议今晚加班多写 <Text className={styles.num}>{formatWordsCount(totalSuggested)}</Text> 字存稿，
              可以确保在考试和满课期间依然保持日更节奏。
            </Text>
          </View>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>📅 未来两天日程</Text>
        </View>

        {upcomingDays.map(day => (
          <View key={day.date} className={styles.previewCard}>
            <View className={styles.previewHeader}>
              <Text className={styles.previewDay}>
                {day.label} · {day.dayName}
              </Text>
              <Text className={styles.previewDate}>{day.date.slice(5)}</Text>
            </View>
            <View className={styles.previewTags}>
              {day.dayCourses.length > 0 && (
                <Text className={`${styles.previewTag} ${styles.tagCourse}`}>
                  📚 {day.dayCourses.length} 节课
                </Text>
              )}
              {day.dayExams.length > 0 && (
                <Text className={`${styles.previewTag} ${styles.tagExam}`}>
                  📝 {day.dayExams.length} 场考试
                </Text>
              )}
              {day.dayClubs.length > 0 && (
                <Text className={`${styles.previewTag} ${styles.tagClub}`}>
                  🎯 {day.dayClubs.length} 个社团
                </Text>
              )}
              {day.dayCommutes.length > 0 && (
                <Text className={`${styles.previewTag} ${styles.tagCommute}`}>
                  🚇 {day.dayCommutes.length} 段通勤
                </Text>
              )}
              {day.scheduleItems.length === 0 && (
                <Text className={`${styles.previewTag} ${styles.tagCourse}`}>空闲日，适合爆更 ✨</Text>
              )}
            </View>

            {day.scheduleItems.length > 0 && (
              <View className={styles.previewSchedule}>
                {day.scheduleItems.map(item => (
                  <View key={item.id} className={styles.previewScheduleItem}>
                    <Text className={classnames(styles.previewItemType, styles[`previewItemType_${item.type}`])}>
                      {item.type === 'course' ? '📚' : item.type === 'exam' ? '📝' : item.type === 'club' ? '🎯' : item.type === 'commute' ? '🚇' : '📌'}
                    </Text>
                    <View className={styles.previewItemBody}>
                      <Text className={styles.previewItemLabel}>{item.label}</Text>
                      <Text className={styles.previewItemTime}>{item.time}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {day.warning && (
              <Text className={styles.previewTip}>
                <Text className={styles.tipHighlight}>写作风险：</Text>
                {day.warning.description}
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default WarningPage;
