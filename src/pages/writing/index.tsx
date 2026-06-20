import React, { useMemo, useState } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import { useApp } from '@/store/AppContext';
import { getTodayProgress, formatWordsCount } from '@/utils/schedule';
import ProgressRing from '@/components/ProgressRing';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const QUICK_WORDS = [500, 800, 1000, 1500, 2000];

const WritingPage: React.FC = () => {
  const { novel, writingRecords, addWritingRecord, getSlotsForDay } = useApp();
  const [wordInput, setWordInput] = useState<string>('');
  const [chapterDone, setChapterDone] = useState<boolean>(false);

  const today = dayjs();
  const todayStr = today.format('YYYY-MM-DD');
  const todayDayOfWeek = today.day() === 0 ? 7 : today.day();

  const progress = useMemo(() => getTodayProgress(writingRecords, novel.dailyTarget), [writingRecords, novel.dailyTarget]);

  const todaySelectedSlots = useMemo(() => {
    const allSlots = getSlotsForDay(todayDayOfWeek);
    return allSlots.filter(s => s.isSelected).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [getSlotsForDay, todayDayOfWeek]);

  const completedSlotIdsToday = useMemo(() => {
    const ids = new Set<string>();
    writingRecords.forEach(r => {
      if (r.date === todayStr && r.slotId) {
        ids.add(r.slotId);
      }
    });
    return ids;
  }, [writingRecords, todayStr]);

  const slotPlanStats = useMemo(() => {
    const totalCount = todaySelectedSlots.length;
    const completedCount = todaySelectedSlots.filter(s => completedSlotIdsToday.has(s.id)).length;
    const totalWords = todaySelectedSlots.reduce((sum, s) => sum + s.estimatedWords, 0);
    const completedWords = todaySelectedSlots
      .filter(s => completedSlotIdsToday.has(s.id))
      .reduce((sum, s) => sum + s.estimatedWords, 0);
    return { totalCount, completedCount, totalWords, completedWords };
  }, [todaySelectedSlots, completedSlotIdsToday]);

  const recentRecords = useMemo(() => {
    return writingRecords.slice(0, 10);
  }, [writingRecords]);

  const handleQuickWord = (words: number) => {
    setWordInput(String(words));
  };

  const handleSubmit = () => {
    const words = parseInt(wordInput || '0', 10);
    if (!words || words <= 0) {
      Taro.showToast({ title: '请输入字数', icon: 'none' });
      return;
    }

    addWritingRecord({
      date: todayStr,
      words,
      chapterCompleted: chapterDone,
      chapterTitle: chapterDone ? `第${novel.currentChapter + 1}章` : undefined,
    });

    Taro.showToast({ title: chapterDone ? '记录成功，章节完成！' : '记录成功！', icon: 'success' });
    setWordInput('');
    setChapterDone(false);
  };

  const handleMarkSlotDone = (slot: {
    id: string;
    label: string;
    estimatedWords: number;
    startTime: string;
    endTime: string;
  }) => {
    if (completedSlotIdsToday.has(slot.id)) {
      Taro.showToast({ title: '该时段已完成打卡', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: `${slot.label} 打卡确认`,
      content: `预计该时段完成 ${formatWordsCount(slot.estimatedWords)} 字（${slot.startTime}-${slot.endTime}）。\n完成实际字数是否按 ${formatWordsCount(slot.estimatedWords)} 字计算？（可去记录中稍后补充）`,
      confirmText: '确认完成',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          addWritingRecord({
            date: todayStr,
            words: slot.estimatedWords,
            chapterCompleted: false,
            slotId: slot.id,
            slotLabel: slot.label,
            note: `${slot.label} ${slot.startTime}-${slot.endTime} 时段打卡`,
          });
          Taro.showToast({ title: `${slot.label} 打卡成功+${formatWordsCount(slot.estimatedWords)}字`, icon: 'success' });
        }
      },
    });
  };

  const isDone = progress.current >= progress.target;

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.progressSection}>
        <View className={styles.progressRingWrap}>
          <ProgressRing percent={progress.percent} size={220} label="今日进度" />
        </View>
        <View className={styles.progressInfo}>
          <Text className={styles.novelTitle}>{novel.title} · 第{novel.currentChapter}章</Text>
          <Text className={styles.bigWords}>
            {formatWordsCount(progress.current)}
            <Text className={styles.unit}>字 / {formatWordsCount(progress.target)}字</Text>
          </Text>
          <Text className={styles.targetText}>日更目标 {formatWordsCount(novel.dailyTarget)} 字 · {novel.platform}</Text>
          <Text className={classnames(styles.remaining, { [styles.done]: isDone })}>
            {isDone ? '🎉 今日目标已完成！' : `还差 ${formatWordsCount(progress.remaining)} 字`}
          </Text>
        </View>
      </View>

      {/* 今日写作计划执行清单 */}
      <View className={styles.card}>
        <View className={styles.cardHeader}>
          <Text className={styles.cardTitle}>📅 今日写作执行计划</Text>
          <View className={styles.planSummary}>
            <Text className={styles.planSummaryText}>
              {slotPlanStats.completedCount}/{slotPlanStats.totalCount} 项 · +{formatWordsCount(slotPlanStats.completedWords)}字
            </Text>
          </View>
        </View>

        {todaySelectedSlots.length > 0 ? (
          todaySelectedSlots.map(slot => {
            const isSlotDone = completedSlotIdsToday.has(slot.id);
            return (
              <View
                key={slot.id}
                className={classnames(styles.slotPlanItem, { [styles.slotPlanItemDone]: isSlotDone })}
              >
                <View className={styles.slotPlanLeft}>
                  <View className={classnames(styles.slotPlanCheckbox, {
                    [styles.slotPlanCheckboxChecked]: isSlotDone,
                  })}>
                    <Text className={styles.checkIcon}>{isSlotDone ? '✓' : ''}</Text>
                  </View>
                </View>
                <View className={styles.slotPlanBody}>
                  <View className={styles.slotPlanRow1}>
                    <Text className={classnames(styles.slotLabel, styles[`slotLabel_${slot.type}`])}>
                      {slot.label}
                    </Text>
                    <Text className={styles.slotTime}>{slot.startTime} - {slot.endTime}</Text>
                  </View>
                  <Text className={styles.slotDuration}>
                    {slot.durationMinutes}分钟 · 预计 {formatWordsCount(slot.estimatedWords)} 字
                  </Text>
                </View>
                <View
                  className={classnames(styles.slotActionBtn, {
                    [styles.slotActionBtnDone]: isSlotDone,
                  })}
                  onClick={() => !isSlotDone && handleMarkSlotDone(slot)}
                >
                  <Text>{isSlotDone ? '已完成' : '打卡'}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View className={styles.planEmpty}>
            <EmptyState icon="🗓️" text="今日暂未选择码字时段，去课表页勾选今日计划的码字空档吧" />
          </View>
        )}

        {slotPlanStats.totalCount > 0 && slotPlanStats.completedCount === slotPlanStats.totalCount && (
          <View className={styles.allDoneTip}>
            <Text>🔥 所有计划时段都已完成打卡，棒！可以继续追加写作</Text>
          </View>
        )}
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>📝 记录本次写作</Text>

        <View className={styles.inputRow}>
          <Text className={styles.inputLabel}>写了多少字</Text>
          <Input
            className={styles.wordInput}
            type="number"
            value={wordInput}
            placeholder="请输入字数"
            placeholderClass="placeholder"
            onInput={(e) => setWordInput(e.detail.value)}
          />
        </View>

        <View className={styles.quickBtns}>
          {QUICK_WORDS.map(w => (
            <View
              key={w}
              className={classnames(styles.quickBtn, { [styles.quickBtnActive]: wordInput === String(w) })}
              onClick={() => handleQuickWord(w)}
            >
              +{w}
            </View>
          ))}
        </View>

        <View className={styles.chapterRow}>
          <Text className={styles.chapterLabel}>本章大纲已完成</Text>
          <View
            className={classnames(styles.switch, { [styles.switchOn]: chapterDone })}
            onClick={() => setChapterDone(!chapterDone)}
          />
        </View>

        <View className={styles.submitBtn} onClick={handleSubmit}>
          <Text>保存记录</Text>
        </View>
      </View>

      <Text className={styles.historyTitle}>最近写作记录</Text>

      {recentRecords.length > 0 ? (
        recentRecords.map(record => {
          const isToday = dayjs(record.date).isSame(dayjs(), 'day');
          return (
            <View key={record.id} className={styles.recordItem}>
              <View className={styles.recordDate}>
                <Text className={styles.recordDay}>{isToday ? '今天' : dayjs(record.date).format('MM/DD')}</Text>
                <Text className={styles.recordTime}>{record.createdAt?.slice(11, 16) || ''}</Text>
              </View>
              <View className={styles.recordContent}>
                <Text className={styles.recordWords}>+{formatWordsCount(record.words)} 字</Text>
                <Text className={styles.recordChapter}>
                  {record.slotLabel || record.chapterTitle || '未完成章节'}
                </Text>
              </View>
              <Text className={classnames(styles.recordStatus, {
                [styles.statusDone]: record.chapterCompleted,
                [styles.statusWriting]: !record.chapterCompleted,
              })}>
                {record.chapterCompleted ? '✓ 章节' : record.slotId ? '打卡' : '进行中'}
              </Text>
            </View>
          );
        })
      ) : (
        <EmptyState icon="✍️" text="还没有写作记录，开始今天的码字吧" />
      )}
    </ScrollView>
  );
};

export default WritingPage;
