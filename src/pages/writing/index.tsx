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
  const { novel, writingRecords, addWritingRecord } = useApp();
  const [wordInput, setWordInput] = useState<string>('');
  const [chapterDone, setChapterDone] = useState<boolean>(false);

  const progress = useMemo(() => getTodayProgress(writingRecords, novel.dailyTarget), [writingRecords, novel.dailyTarget]);

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
      date: dayjs().format('YYYY-MM-DD'),
      words,
      chapterCompleted: chapterDone,
      chapterTitle: chapterDone ? `第${novel.currentChapter + 1}章` : undefined,
    });

    Taro.showToast({ title: chapterDone ? '记录成功，章节完成！' : '记录成功！', icon: 'success' });
    setWordInput('');
    setChapterDone(false);
    console.log('[WritingPage] 提交写作记录:', { words, chapterDone });
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
                  {record.chapterTitle || '未完成章节'}
                </Text>
              </View>
              <Text className={classnames(styles.recordStatus, {
                [styles.statusDone]: record.chapterCompleted,
                [styles.statusWriting]: !record.chapterCompleted,
              })}>
                {record.chapterCompleted ? '✓ 章节' : '进行中'}
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
