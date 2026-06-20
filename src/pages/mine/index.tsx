import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import { periodToTime, dayOfWeekNames, formatWordsCount } from '@/utils/schedule';
import styles from './index.module.scss';

const DAILY_TARGETS = [1000, 1500, 2000, 3000, 4000, 5000];
const UPDATE_TIMES = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'];
const WEEKDAY_LABELS = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  club: '社团',
  commute: '通勤',
  exam: '考试',
  other: '其他',
};

const MinePage: React.FC = () => {
  const {
    profile, novel, courses, activities,
    deleteCourse, deleteActivity, updateNovel, updateProfile, resetAllData,
  } = useApp();

  const [expandNovel, setExpandNovel] = useState(false);
  const [expandCourses, setExpandCourses] = useState(false);
  const [expandActivities, setExpandActivities] = useState(false);

  const [editDailyTarget, setEditDailyTarget] = useState(novel.dailyTarget);
  const [editUpdateTime, setEditUpdateTime] = useState(novel.updateTime);
  const [editLeaveRules, setEditLeaveRules] = useState(novel.leaveRules);
  const [editWritingSpeed, setEditWritingSpeed] = useState(String(profile.writingSpeed));

  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startPeriod - b.startPeriod;
    });
  }, [courses]);

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [activities]);

  const clubCount = sortedActivities.filter(a => a.type === 'club').length;
  const commuteCount = sortedActivities.filter(a => a.type === 'commute').length;
  const examCount = sortedActivities.filter(a => a.type === 'exam').length;
  const otherCount = sortedActivities.filter(a => a.type === 'other').length;

  const handleSaveNovelSettings = () => {
    updateNovel({
      dailyTarget: editDailyTarget,
      updateTime: editUpdateTime,
      leaveRules: editLeaveRules,
    });
    Taro.showToast({ title: '小说设置已保存', icon: 'success' });
    setExpandNovel(false);
    console.log('[MinePage] 保存小说设置:', { editDailyTarget, editUpdateTime, editLeaveRules });
  };

  const handleSaveWritingSpeed = () => {
    const speed = parseInt(editWritingSpeed || '20', 10);
    updateProfile({ writingSpeed: speed > 0 ? speed : 20 });
    Taro.showToast({ title: '设置已保存', icon: 'success' });
    console.log('[MinePage] 保存写作速度:', speed);
  };

  const handleDeleteCourse = (id: string, name: string) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除课程「${name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          deleteCourse(id);
          Taro.showToast({ title: '已删除', icon: 'none' });
        }
      },
    });
  };

  const handleDeleteActivity = (id: string, name: string) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除「${name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          deleteActivity(id);
          Taro.showToast({ title: '已删除', icon: 'none' });
        }
      },
    });
  };

  const handleReset = () => {
    Taro.showModal({
      title: '重置所有数据',
      content: '这会清除所有课程、活动、写作记录，确定要重置吗？',
      success: (res) => {
        if (res.confirm) {
          resetAllData();
          Taro.showToast({ title: '已重置', icon: 'success' });
          setTimeout(() => {
            Taro.redirectTo({ url: '/pages/onboarding/index' });
          }, 1000);
        }
      },
    });
  };

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.profileCard}>
        <View className={styles.avatar}>
          <Text>✍️</Text>
        </View>
        <View className={styles.profileInfo}>
          <Text className={styles.nickname}>{profile.nickname}</Text>
          <Text className={styles.bio}>
            {profile.grade} · {profile.major || '未填写专业'}
            {'\n'}写作速度约 {profile.writingSpeed} 字/分钟
          </Text>
        </View>
      </View>

      <Text className={styles.sectionTitle}>我的小说</Text>
      <View className={styles.novelCard}>
        <View className={styles.novelHeader}>
          <Text className={styles.novelTitle}>《{novel.title}》</Text>
          <Text className={styles.platformBadge}>{novel.platform}</Text>
        </View>
        <View className={styles.novelStats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{novel.currentChapter}</Text>
            <Text className={styles.statLabel}>章节</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatWordsCount(novel.totalWords)}</Text>
            <Text className={styles.statLabel}>总字数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatWordsCount(novel.dailyTarget)}</Text>
            <Text className={styles.statLabel}>日更目标</Text>
          </View>
        </View>
      </View>

      {/* 小说设置展开 */}
      <View
        className={classnames(styles.expandHeader, { [styles.expandHeaderNoBorder]: !expandNovel })}
        onClick={() => {
          setExpandNovel(!expandNovel);
          setEditDailyTarget(novel.dailyTarget);
          setEditUpdateTime(novel.updateTime);
          setEditLeaveRules(novel.leaveRules);
        }}
      >
        <View className={styles.expandIconCol}>
          <View className={styles.expandIcon}><Text>📝</Text></View>
          <View className={styles.expandTitleCol}>
            <Text className={styles.expandTitle}>小说设置</Text>
            <Text className={styles.expandCount}>日更目标、更新时间、请假规则</Text>
          </View>
        </View>
        <Text className={classnames(styles.arrow, { [styles.arrowExpanded]: expandNovel })}>›</Text>
      </View>
      {expandNovel && (
        <View className={styles.expandBody}>
          <View className={styles.editRow}>
            <Text className={styles.editLabel}>日更目标</Text>
            <View className={styles.editTagGroup}>
              {DAILY_TARGETS.map(t => (
                <View
                  key={t}
                  className={classnames(styles.editTag, { [styles.editTagActive]: editDailyTarget === t })}
                  onClick={() => setEditDailyTarget(t)}
                >
                  {t}字
                </View>
              ))}
            </View>
          </View>
          <View className={styles.editRow}>
            <Text className={styles.editLabel}>更新时间</Text>
            <View className={styles.editTagGroup}>
              {UPDATE_TIMES.map(t => (
                <View
                  key={t}
                  className={classnames(styles.editTag, { [styles.editTagActive]: editUpdateTime === t })}
                  onClick={() => setEditUpdateTime(t)}
                >
                  {t}
                </View>
              ))}
            </View>
          </View>
          <View className={styles.editRow}>
            <Text className={styles.editLabel}>请假规则</Text>
            <Input
              className={styles.editInput}
              value={editLeaveRules}
              placeholder="例如：每月可请假2次"
              onInput={(e) => setEditLeaveRules(e.detail.value)}
            />
          </View>
          <View className={styles.saveBtn} onClick={handleSaveNovelSettings}>
            <Text>保存设置</Text>
          </View>
        </View>
      )}

      {/* 课表管理展开 */}
      <View
        className={classnames(styles.expandHeader, { [styles.expandHeaderNoBorder]: !expandCourses })}
        onClick={() => setExpandCourses(!expandCourses)}
      >
        <View className={styles.expandIconCol}>
          <View className={styles.expandIcon}><Text>📚</Text></View>
          <View className={styles.expandTitleCol}>
            <Text className={styles.expandTitle}>课表管理</Text>
            <Text className={styles.expandCount}>共 {sortedCourses.length} 门课程 · 点击查看和删除</Text>
          </View>
        </View>
        <Text className={classnames(styles.arrow, { [styles.arrowExpanded]: expandCourses })}>›</Text>
      </View>
      {expandCourses && (
        <View className={styles.expandBody}>
          {sortedCourses.length > 0 ? (
            sortedCourses.map(c => {
              const { start } = periodToTime(c.startPeriod);
              const { end } = periodToTime(c.endPeriod);
              return (
                <View key={c.id} className={styles.listItem}>
                  <View className={styles.listMain}>
                    <Text className={styles.listName}>{c.name}</Text>
                    <Text className={styles.listMeta}>
                      {WEEKDAY_LABELS[c.dayOfWeek]} 第{c.startPeriod}-{c.endPeriod}节 ({start}-{end})
                    </Text>
                    {c.location && <Text className={styles.listMeta}>📍 {c.location}</Text>}
                    {c.teacher && <Text className={styles.listMeta}>👤 {c.teacher}</Text>}
                  </View>
                  <View className={styles.deleteBtn} onClick={() => handleDeleteCourse(c.id, c.name)}>
                    <Text>删除</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View className={styles.emptyList}>还没有添加课程</View>
          )}
        </View>
      )}

      {/* 活动与通勤展开 */}
      <View
        className={classnames(styles.expandHeader, { [styles.expandHeaderNoBorder]: !expandActivities })}
        onClick={() => setExpandActivities(!expandActivities)}
      >
        <View className={styles.expandIconCol}>
          <View className={styles.expandIcon}><Text>🎯</Text></View>
          <View className={styles.expandTitleCol}>
            <Text className={styles.expandTitle}>活动与通勤</Text>
            <Text className={styles.expandCount}>
              共 {sortedActivities.length} 项（社团{clubCount}·通勤{commuteCount}·考试{examCount}·其他{otherCount}）
            </Text>
          </View>
        </View>
        <Text className={classnames(styles.arrow, { [styles.arrowExpanded]: expandActivities })}>›</Text>
      </View>
      {expandActivities && (
        <View className={styles.expandBody}>
          {sortedActivities.length > 0 ? (
            sortedActivities.map(a => (
              <View key={a.id} className={styles.listItem}>
                <View className={styles.listMain}>
                  <Text className={styles.listName}>{a.name}</Text>
                  <Text className={styles.listMeta}>
                    {WEEKDAY_LABELS[a.dayOfWeek]} {a.startTime}-{a.endTime}
                  </Text>
                  <Text className={styles.listMeta}>类型：{ACTIVITY_TYPE_LABELS[a.type] || a.type}</Text>
                </View>
                <View className={styles.deleteBtn} onClick={() => handleDeleteActivity(a.id, a.name)}>
                  <Text>删除</Text>
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptyList}>还没有添加活动</View>
          )}
        </View>
      )}

      {/* 写作速度设置 */}
      <View className={styles.menuList}>
        <View className={styles.menuItem}>
          <View className={styles.menuIcon}><Text>⚡</Text></View>
          <View className={styles.menuContent}>
            <Text className={styles.menuTitle}>写作速度</Text>
            <View style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Input
                className={styles.editInput}
                style={{ flex: 1, maxWidth: 200 }}
                type="number"
                value={editWritingSpeed}
                onInput={(e) => setEditWritingSpeed(e.detail.value)}
              />
              <View
                className={classnames(styles.editTag, styles.editTagActive)}
                onClick={handleSaveWritingSpeed}
              >
                保存
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 重置按钮 */}
      <View className={styles.menuList}>
        <View
          className={styles.menuItem}
          onClick={handleReset}
        >
          <View className={styles.menuIcon} style={{ background: 'rgba(245,63,63,0.1)', color: '#F53F3F' }}>
            <Text>↺</Text>
          </View>
          <View className={styles.menuContent}>
            <Text className={styles.menuTitle} style={{ color: '#F53F3F' }}>重新引导配置</Text>
            <Text className={styles.menuDesc}>清除所有数据，重新走一遍配置向导</Text>
          </View>
          <Text className={styles.menuArrow} style={{ color: '#F53F3F' }}>›</Text>
        </View>
      </View>

      <View className={styles.menuList}>
        <View className={styles.menuItem}>
          <View className={styles.menuIcon}><Text>ℹ️</Text></View>
          <View className={styles.menuContent}>
            <Text className={styles.menuTitle}>关于</Text>
            <Text className={styles.menuDesc}>码字课表 v1.0 · 大学生网文作者好帮手</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
