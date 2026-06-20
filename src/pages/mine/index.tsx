import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Switch } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import { periodToTime, dayOfWeekNames, formatWordsCount, normalizeTime, getCourseTimeRange } from '@/utils/schedule';
import styles from './index.module.scss';

const DAILY_TARGETS = [1000, 1500, 2000, 3000, 4000, 5000];
const UPDATE_TIMES = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'];
const WEEKDAY_LABELS = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  club: '社团',
  commute: '通勤',
  exam: '考试',
  other: '其他',
};
const ACTIVITY_TYPES = ['club', 'commute', 'exam', 'other'] as const;

type EditableCourse = {
  id?: string;
  name: string;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  location: string;
  teacher: string;
};

type EditableActivity = {
  id?: string;
  name: string;
  type: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

const emptyCourse = (): EditableCourse => ({
  name: '', dayOfWeek: 1, startPeriod: 1, endPeriod: 2, location: '', teacher: '',
});

const emptyActivity = (): EditableActivity => ({
  name: '', type: 'club', dayOfWeek: 1, startTime: '19:00', endTime: '21:00',
});

const MinePage: React.FC = () => {
  const {
    profile, novel, courses, activities,
    addCourse, updateCourse, deleteCourse,
    addActivity, updateActivity, deleteActivity,
    updateNovel, updateProfile, resetAllData,
  } = useApp();

  const [expandNovel, setExpandNovel] = useState(false);
  const [expandCourses, setExpandCourses] = useState(false);
  const [expandActivities, setExpandActivities] = useState(false);

  const [editDailyTarget, setEditDailyTarget] = useState(novel.dailyTarget);
  const [editUpdateTime, setEditUpdateTime] = useState(novel.updateTime);
  const [editLeaveRules, setEditLeaveRules] = useState(novel.leaveRules);
  const [editWritingSpeed, setEditWritingSpeed] = useState(String(profile.writingSpeed));

  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<EditableCourse | null>(null);
  const [courseForm, setCourseForm] = useState<EditableCourse>(emptyCourse());

  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<EditableActivity | null>(null);
  const [activityForm, setActivityForm] = useState<EditableActivity>(emptyActivity());

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
  };

  const handleSaveWritingSpeed = () => {
    const speed = parseInt(editWritingSpeed || '20', 10);
    updateProfile({ writingSpeed: speed > 0 ? speed : 20 });
    Taro.showToast({ title: '设置已保存', icon: 'success' });
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

  const openAddCourse = () => {
    setCourseForm(emptyCourse());
    setEditingCourse(null);
    setShowCourseForm(true);
  };

  const openEditCourse = (c: EditableCourse) => {
    setCourseForm({ ...c });
    setEditingCourse(c);
    setShowCourseForm(true);
  };

  const handleSaveCourse = () => {
    if (!courseForm.name.trim()) {
      Taro.showToast({ title: '请填写课程名称', icon: 'none' });
      return;
    }
    if (courseForm.startPeriod > courseForm.endPeriod) {
      Taro.showToast({ title: '节次范围不正确', icon: 'none' });
      return;
    }
    if (editingCourse && editingCourse.id) {
      updateCourse(editingCourse.id, courseForm);
      Taro.showToast({ title: '课程已更新', icon: 'success' });
    } else {
      addCourse(courseForm);
      Taro.showToast({ title: '课程已添加', icon: 'success' });
    }
    setShowCourseForm(false);
    setEditingCourse(null);
    setCourseForm(emptyCourse());
  };

  const openAddActivity = () => {
    setActivityForm(emptyActivity());
    setEditingActivity(null);
    setShowActivityForm(true);
  };

  const openEditActivity = (a: EditableActivity) => {
    setActivityForm({ ...a });
    setEditingActivity(a);
    setShowActivityForm(true);
  };

  const handleSaveActivity = () => {
    if (!activityForm.name.trim()) {
      Taro.showToast({ title: '请填写活动名称', icon: 'none' });
      return;
    }
    const st = normalizeTime(activityForm.startTime);
    const et = normalizeTime(activityForm.endTime);
    if (st >= et) {
      Taro.showToast({ title: '时间范围不正确', icon: 'none' });
      return;
    }
    const payload = { ...activityForm, startTime: st, endTime: et };
    if (editingActivity && editingActivity.id) {
      updateActivity(editingActivity.id, payload);
      Taro.showToast({ title: '活动已更新', icon: 'success' });
    } else {
      addActivity(payload);
      Taro.showToast({ title: '活动已添加', icon: 'success' });
    }
    setShowActivityForm(false);
    setEditingActivity(null);
    setActivityForm(emptyActivity());
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
            <Text className={styles.expandCount}>共 {sortedCourses.length} 门课程 · 可新增、编辑、删除</Text>
          </View>
        </View>
        <Text className={classnames(styles.arrow, { [styles.arrowExpanded]: expandCourses })}>›</Text>
      </View>
      {expandCourses && (
        <View className={styles.expandBody}>
          {sortedCourses.length > 0 ? (
            sortedCourses.map(c => {
              const { start, end, durationMin } = getCourseTimeRange(c.startPeriod, c.endPeriod);
              return (
                <View key={c.id} className={styles.listItem}>
                  <View className={styles.listMain}>
                    <Text className={styles.listName}>{c.name}</Text>
                    <Text className={styles.listMeta}>
                      {WEEKDAY_LABELS[c.dayOfWeek]} 第{c.startPeriod}-{c.endPeriod}节 ({start}-{end}，{durationMin}分钟)
                    </Text>
                    {c.location && <Text className={styles.listMeta}>📍 {c.location}</Text>}
                    {c.teacher && <Text className={styles.listMeta}>👤 {c.teacher}</Text>}
                  </View>
                  <View className={styles.listActions}>
                    <View className={styles.editMiniBtn} onClick={() => openEditCourse(c)}>
                      <Text>编辑</Text>
                    </View>
                    <View className={styles.deleteBtn} onClick={() => handleDeleteCourse(c.id, c.name)}>
                      <Text>删除</Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View className={styles.emptyList}>还没有添加课程</View>
          )}

          {!showCourseForm ? (
            <View className={styles.addBtn} onClick={openAddCourse}>
              <Text>+ 添加课程</Text>
            </View>
          ) : (
            <View className={styles.formCard}>
              <Text className={styles.formTitle}>
                {editingCourse ? '编辑课程' : '添加课程'}
              </Text>
              <View className={styles.editRow}>
                <Text className={styles.editLabel}>课程名称</Text>
                <Input
                  className={styles.editInput}
                  value={courseForm.name}
                  placeholder="如：高等数学"
                  onInput={(e) => setCourseForm(prev => ({ ...prev, name: e.detail.value }))}
                />
              </View>
              <View className={styles.editRow}>
                <Text className={styles.editLabel}>星期</Text>
                <View className={styles.editTagGroup}>
                  {PERIODS.slice(0, 7).map((_, i) => i + 1).map(d => (
                    <View
                      key={d}
                      className={classnames(styles.editTag, { [styles.editTagActive]: courseForm.dayOfWeek === d })}
                      onClick={() => setCourseForm(prev => ({ ...prev, dayOfWeek: d }))}
                    >
                      {WEEKDAY_LABELS[d]}
                    </View>
                  ))}
                </View>
              </View>
              <View className={styles.editRow}>
                <Text className={styles.editLabel}>开始节次</Text>
                <View className={styles.editTagGroup}>
                  {PERIODS.map(p => (
                    <View
                      key={p}
                      className={classnames(styles.editTag, { [styles.editTagActive]: courseForm.startPeriod === p })}
                      onClick={() => setCourseForm(prev => ({
                        ...prev,
                        startPeriod: p,
                        endPeriod: Math.max(prev.endPeriod, p),
                      }))}
                    >
                      第{p}节
                    </View>
                  ))}
                </View>
              </View>
              <View className={styles.editRow}>
                <Text className={styles.editLabel}>结束节次</Text>
                <View className={styles.editTagGroup}>
                  {PERIODS.filter(p => p >= courseForm.startPeriod).map(p => {
                    const timeRange = getCourseTimeRange(courseForm.startPeriod, p);
                    return (
                      <View
                        key={p}
                        className={classnames(styles.editTag, { [styles.editTagActive]: courseForm.endPeriod === p })}
                        onClick={() => setCourseForm(prev => ({ ...prev, endPeriod: p }))}
                      >
                        第{p}节 ({timeRange.durationMin}分)
                      </View>
                    );
                  })}
                </View>
              </View>
              <View className={styles.editRow}>
                <Text className={styles.editLabel}>上课地点</Text>
                <Input
                  className={styles.editInput}
                  value={courseForm.location}
                  placeholder="如：教学楼A301（选填）"
                  onInput={(e) => setCourseForm(prev => ({ ...prev, location: e.detail.value }))}
                />
              </View>
              <View className={styles.editRow}>
                <Text className={styles.editLabel}>任课老师</Text>
                <Input
                  className={styles.editInput}
                  value={courseForm.teacher}
                  placeholder="（选填）"
                  onInput={(e) => setCourseForm(prev => ({ ...prev, teacher: e.detail.value }))}
                />
              </View>
              <View className={styles.formActions}>
                <View
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowCourseForm(false);
                    setEditingCourse(null);
                    setCourseForm(emptyCourse());
                  }}
                >
                  <Text>取消</Text>
                </View>
                <View className={styles.saveBtn} onClick={handleSaveCourse}>
                  <Text>{editingCourse ? '保存修改' : '添加'}</Text>
                </View>
              </View>
            </View>
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
                  <View className={styles.listNameRow}>
                    <Text className={classnames(styles.typeTag, styles[`typeTag_${a.type}`])}>
                      {ACTIVITY_TYPE_LABELS[a.type] || a.type}
                    </Text>
                    <Text className={styles.listName}>{a.name}</Text>
                  </View>
                  <Text className={styles.listMeta}>
                    {WEEKDAY_LABELS[a.dayOfWeek]} {a.startTime}-{a.endTime}
                  </Text>
                </View>
                <View className={styles.listActions}>
                  <View className={styles.editMiniBtn} onClick={() => openEditActivity(a)}>
                    <Text>编辑</Text>
                  </View>
                  <View className={styles.deleteBtn} onClick={() => handleDeleteActivity(a.id, a.name)}>
                    <Text>删除</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptyList}>还没有添加活动</View>
          )}

          {!showActivityForm ? (
            <View className={styles.addBtn} onClick={openAddActivity}>
              <Text>+ 添加活动 / 通勤 / 考试</Text>
            </View>
          ) : (
            <View className={styles.formCard}>
              <Text className={styles.formTitle}>
                {editingActivity ? '编辑活动' : '添加活动'}
              </Text>
              <View className={styles.editRow}>
                <Text className={styles.editLabel}>活动类型</Text>
                <View className={styles.editTagGroup}>
                  {ACTIVITY_TYPES.map(t => (
                    <View
                      key={t}
                      className={classnames(styles.editTag, { [styles.editTagActive]: activityForm.type === t })}
                      onClick={() => setActivityForm(prev => ({ ...prev, type: t }))}
                    >
                      {ACTIVITY_TYPE_LABELS[t]}
                    </View>
                  ))}
                </View>
              </View>
              <View className={styles.editRow}>
                <Text className={styles.editLabel}>活动名称</Text>
                <Input
                  className={styles.editInput}
                  value={activityForm.name}
                  placeholder="如：吉他社训练 / 高数期中考试"
                  onInput={(e) => setActivityForm(prev => ({ ...prev, name: e.detail.value }))}
                />
              </View>
              <View className={styles.editRow}>
                <Text className={styles.editLabel}>星期</Text>
                <View className={styles.editTagGroup}>
                  {PERIODS.slice(0, 7).map((_, i) => i + 1).map(d => (
                    <View
                      key={d}
                      className={classnames(styles.editTag, { [styles.editTagActive]: activityForm.dayOfWeek === d })}
                      onClick={() => setActivityForm(prev => ({ ...prev, dayOfWeek: d }))}
                    >
                      {WEEKDAY_LABELS[d]}
                    </View>
                  ))}
                </View>
              </View>
              <View className={styles.editRow}>
                <Text className={styles.editLabel}>起止时间</Text>
                <View className={styles.timeRangeRow}>
                  <Input
                    className={styles.timeInput}
                    value={activityForm.startTime}
                    placeholder="如 9:00"
                    onInput={(e) => setActivityForm(prev => ({ ...prev, startTime: e.detail.value }))}
                  />
                  <Text className={styles.timeSep}>至</Text>
                  <Input
                    className={styles.timeInput}
                    value={activityForm.endTime}
                    placeholder="如 20:30"
                    onInput={(e) => setActivityForm(prev => ({ ...prev, endTime: e.detail.value }))}
                  />
                </View>
                <Text className={styles.formHint}>提示：支持 9:00、09:00、20:30 等多种写法，保存时会自动标准化</Text>
              </View>
              <View className={styles.formActions}>
                <View
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowActivityForm(false);
                    setEditingActivity(null);
                    setActivityForm(emptyActivity());
                  }}
                >
                  <Text>取消</Text>
                </View>
                <View className={styles.saveBtn} onClick={handleSaveActivity}>
                  <Text>{editingActivity ? '保存修改' : '添加'}</Text>
                </View>
              </View>
            </View>
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
