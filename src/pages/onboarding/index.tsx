import React, { useState, useMemo } from 'react';
import { View, Text, Input } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import { periodToTime, normalizeTime, getCourseTimeRange } from '@/utils/schedule';
import type { Course, Activity } from '@/types';
import styles from './index.module.scss';

const TOTAL_STEPS = 4;
const GRADES = ['大一', '大二', '大三', '大四', '研一', '研二', '研三'];
const PLATFORMS = ['起点中文网', '晋江文学城', '番茄小说', '纵横中文网', '其他'];
const UPDATE_TIMES = ['18:00', '20:00', '21:00', '22:00', '23:00', '00:00'];
const DAILY_TARGETS = [1000, 1500, 2000, 3000, 4000];
const WEEKDAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const ACTIVITY_TYPES = [
  { value: 'club', label: '社团' },
  { value: 'commute', label: '通勤' },
  { value: 'exam', label: '考试' },
  { value: 'other', label: '其他' },
];

interface CourseForm {
  name: string;
  dayOfWeek: number;
  startPeriod: number;
  endPeriod: number;
  location: string;
  teacher: string;
}

interface ActivityForm {
  name: string;
  type: 'club' | 'commute' | 'exam' | 'other';
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const OnboardingPage: React.FC = () => {
  const { profile, courses, activities, novel, updateProfile, updateNovel, addCourse, addActivity, deleteCourse, deleteActivity } = useApp();
  const [step, setStep] = useState(1);

  const [nickname, setNickname] = useState(profile.nickname || '');
  const [grade, setGrade] = useState(profile.grade || '大三');
  const [major, setMajor] = useState(profile.major || '');
  const [writingSpeed, setWritingSpeed] = useState(String(profile.writingSpeed || 20));

  const [courseForm, setCourseForm] = useState<CourseForm>({
    name: '',
    dayOfWeek: 1,
    startPeriod: 1,
    endPeriod: 2,
    location: '',
    teacher: '',
  });

  const [activityForm, setActivityForm] = useState<ActivityForm>({
    name: '',
    type: 'club',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '09:00',
  });

  const [novelTitle, setNovelTitle] = useState(novel.title || '');
  const [platform, setPlatform] = useState(novel.platform || '起点中文网');
  const [dailyTarget, setDailyTarget] = useState(novel.dailyTarget || 2000);
  const [updateTime, setUpdateTime] = useState(novel.updateTime || '22:00');
  const [leaveRules, setLeaveRules] = useState(novel.leaveRules || '每月可请假2次，需提前1天报备');

  const [activeTab, setActiveTab] = useState<'course' | 'activity'>('course');

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

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      setActiveTab('course');
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
      setActiveTab('course');
    }
  };

  const handleAddCourse = () => {
    if (!courseForm.name.trim()) {
      Taro.showToast({ title: '请输入课程名', icon: 'none' });
      return;
    }
    if (courseForm.startPeriod > courseForm.endPeriod) {
      Taro.showToast({ title: '节次范围不正确', icon: 'none' });
      return;
    }
    addCourse({
      name: courseForm.name.trim(),
      dayOfWeek: courseForm.dayOfWeek,
      startPeriod: courseForm.startPeriod,
      endPeriod: courseForm.endPeriod,
      location: courseForm.location.trim(),
      teacher: courseForm.teacher.trim(),
    });
    setCourseForm({
      name: '',
      dayOfWeek: 1,
      startPeriod: 1,
      endPeriod: 2,
      location: '',
      teacher: '',
    });
    Taro.showToast({ title: '课程已添加', icon: 'success' });
  };

  const handleAddActivity = () => {
    if (!activityForm.name.trim()) {
      Taro.showToast({ title: '请输入活动名称', icon: 'none' });
      return;
    }
    const st = normalizeTime(activityForm.startTime);
    const et = normalizeTime(activityForm.endTime);
    if (st >= et) {
      Taro.showToast({ title: '时间范围不正确', icon: 'none' });
      return;
    }
    addActivity({
      name: activityForm.name.trim(),
      type: activityForm.type,
      dayOfWeek: activityForm.dayOfWeek,
      startTime: st,
      endTime: et,
    });
    setActivityForm({
      name: '',
      type: 'club',
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:00',
    });
    Taro.showToast({ title: '活动已添加', icon: 'success' });
  };

  const handleDeleteCourse = (id: string) => {
    deleteCourse(id);
    Taro.showToast({ title: '已删除', icon: 'none' });
  };

  const handleDeleteActivity = (id: string) => {
    deleteActivity(id);
    Taro.showToast({ title: '已删除', icon: 'none' });
  };

  const handleFinish = () => {
    updateProfile({
      nickname: nickname || '作者',
      grade,
      major: major || '',
      writingSpeed: parseInt(String(writingSpeed) || '20', 10),
    });
    updateNovel({
      title: novelTitle || '我的小说',
      platform,
      dailyTarget,
      updateTime,
      leaveRules: leaveRules || '',
    });
    console.log('[Onboarding] 完成引导配置');
    Taro.showToast({ title: '配置完成，开始码字吧！', icon: 'success' });
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/calendar/index' });
    }, 1500);
  };

  const renderStep1 = () => (
    <>
      <Text className={styles.stepTitle}>👋 先认识一下</Text>
      <Text className={styles.stepDesc}>告诉我们一些基本信息，帮你更好地规划码字时间</Text>

      <View className={styles.formItem}>
        <Text className={styles.formLabel}>笔名</Text>
        <Input
          className={styles.formInput}
          placeholder="给自己取个笔名"
          value={nickname}
          onInput={(e) => setNickname(e.detail.value)}
        />
      </View>

      <View className={styles.formItem}>
        <Text className={styles.formLabel}>年级</Text>
        <View className={styles.tagGroup}>
          {GRADES.map(g => (
            <View
              key={g}
              className={classnames(styles.tagOption, { [styles.tagOptionActive]: grade === g })}
              onClick={() => setGrade(g)}
            >
              {g}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.formItem}>
        <Text className={styles.formLabel}>专业</Text>
        <Input
          className={styles.formInput}
          placeholder="例如：汉语言文学"
          value={major}
          onInput={(e) => setMajor(e.detail.value)}
        />
      </View>

      <View className={styles.formItem}>
        <Text className={styles.formLabel}>写作速度（字/分钟）</Text>
        <Input
          className={styles.formInput}
          type="number"
          placeholder="通常 15-30 字/分钟"
          value={String(writingSpeed)}
          onInput={(e) => setWritingSpeed(e.detail.value)}
        />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text className={styles.stepTitle}>📚 添加每周课程</Text>
      <Text className={styles.stepDesc}>
        添加你每周的课程安排，我们会基于你的课表自动找出写作空档</Text>

      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tab, { [styles.tabActive]: activeTab === 'course' })}
          onClick={() => setActiveTab('course')}
        >
          <Text>添加课程</Text>
        </View>
        <View
          className={classnames(styles.tab, { [styles.tabActive]: activeTab === 'activity' })}
          onClick={() => setActiveTab('activity')}
        >
          <Text>已添加 ({sortedCourses.length})</Text>
        </View>
      </View>

      {activeTab === 'course' ? (
        <>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>课程名称</Text>
            <Input
              className={styles.formInput}
              placeholder="例如：古代文学"
              value={courseForm.name}
              onInput={(e) => setCourseForm({ ...courseForm, name: e.detail.value })}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>星期</Text>
            <View className={styles.tagGroup}>
              {WEEKDAYS.map(d => (
                <View
                key={d.value}
                className={classnames(styles.tagOption, { [styles.tagOptionActive]: courseForm.dayOfWeek === d.value })}
                onClick={() => setCourseForm({ ...courseForm, dayOfWeek: d.value })}
              >
                {d.label}
              </View>
            ))}
            </View>
          </View>

          <View className={styles.formRow}>
            <View className={styles.formRowItem}>
              <Text className={styles.formLabel}>开始节次</Text>
              <View className={styles.tagGroup}>
                {PERIODS.map(p => (
                  <View
                    key={'start-' + p}
                    className={classnames(styles.tagOption, { [styles.tagOptionActive]: courseForm.startPeriod === p })}
                    onClick={() => setCourseForm({ ...courseForm, startPeriod: p })}
                  >
                    第{p}节
                  </View>
                ))}
              </View>
            </View>
            <View className={styles.formRowItem}>
              <Text className={styles.formLabel}>结束节次</Text>
              <View className={styles.tagGroup}>
                {PERIODS.map(p => (
                  <View
                    key={'end-' + p}
                    className={classnames(styles.tagOption, { [styles.tagOptionActive]: courseForm.endPeriod === p })}
                    onClick={() => setCourseForm({ ...courseForm, endPeriod: p })}
                  >
                    第{p}节
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>上课地点（可选）</Text>
            <Input
              className={styles.formInput}
              placeholder="例如：文一301"
              value={courseForm.location}
              onInput={(e) => setCourseForm({ ...courseForm, location: e.detail.value })}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>授课老师（可选）</Text>
            <Input
              className={styles.formInput}
              placeholder="例如：王教授"
              value={courseForm.teacher}
              onInput={(e) => setCourseForm({ ...courseForm, teacher: e.detail.value })}
            />
          </View>

          <View className={styles.addBtn} onClick={handleAddCourse}>
            <Text>+ 添加这门课</Text>
          </View>

          <View className={styles.quickTip}>
            <Text>⏰ 节次时间：第1节 08:00-09:30，每节90分钟</Text>
          </View>
        </>
      ) : (
        <>
          {sortedCourses.length > 0 ? (
            <View className={styles.listContainer}>
            {sortedCourses.map((c: Course) => {
              const { start, end } = getCourseTimeRange(c.startPeriod, c.endPeriod);
              return (
                <View key={c.id} className={styles.listItem}>
                  <View className={styles.listItemMain}>
                    <Text className={styles.listItemName}>{c.name}</Text>
                    <Text className={styles.listItemMeta}>
                      {WEEKDAYS.find(w => w.value === c.dayOfWeek)?.label} 第{c.startPeriod}-{c.endPeriod}节 ({start}-{end})
                    </Text>
                    {c.location && <Text className={styles.listItemMeta}>📍 {c.location}</Text>}
                  </View>
                  <View className={styles.deleteBtn} onClick={() => handleDeleteCourse(c.id)}>
                    <Text>删除</Text>
                  </View>
                </View>
              );
            })}
          </View>
          ) : (
            <View className={styles.emptyTip}>
              <Text>还没有添加课程，切换到「添加课程」标签页添加吧~</Text>
            </View>
          )}
        </>
      )}
    </>
  );

  const renderStep3 = () => (
    <>
      <Text className={styles.stepTitle}>🎯 活动与通勤</Text>
      <Text className={styles.stepDesc}>
        添加社团、考试、通勤等占用时间，这些时段不会被推荐为写作时间</Text>

      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tab, { [styles.tabActive]: activeTab === 'course' })}
          onClick={() => setActiveTab('course')}
        >
          <Text>添加活动</Text>
        </View>
        <View
          className={classnames(styles.tab, { [styles.tabActive]: activeTab === 'activity' })}
          onClick={() => setActiveTab('activity')}
        >
          <Text>已添加 ({sortedActivities.length})</Text>
        </View>
      </View>

      {activeTab === 'course' ? (
        <>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>活动类型</Text>
            <View className={styles.tagGroup}>
              {ACTIVITY_TYPES.map(t => (
                <View
                  key={t.value}
                  className={classnames(styles.tagOption, { [styles.tagOptionActive]: activityForm.type === t.value })}
                  onClick={() => setActivityForm({ ...activityForm, type: t.value as any })}
                >
                  {t.label}
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>活动名称</Text>
            <Input
              className={styles.formInput}
              placeholder="例如：文学社例会"
              value={activityForm.name}
              onInput={(e) => setActivityForm({ ...activityForm, name: e.detail.value })}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>星期</Text>
            <View className={styles.tagGroup}>
              {WEEKDAYS.map(d => (
                <View
                  key={d.value}
                  className={classnames(styles.tagOption, { [styles.tagOptionActive]: activityForm.dayOfWeek === d.value })}
                  onClick={() => setActivityForm({ ...activityForm, dayOfWeek: d.value })}
                >
                  {d.label}
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formRow}>
            <View className={styles.formRowItem}>
              <Text className={styles.formLabel}>开始时间</Text>
              <Input
                className={styles.formInput}
                type="text"
                placeholder="如 9:00 或 09:00"
                value={activityForm.startTime}
                onInput={(e) => setActivityForm({ ...activityForm, startTime: e.detail.value })}
              />
            </View>
            <View className={styles.formRowItem}>
              <Text className={styles.formLabel}>结束时间</Text>
              <Input
                className={styles.formInput}
                type="text"
                placeholder="如 20:30"
                value={activityForm.endTime}
                onInput={(e) => setActivityForm({ ...activityForm, endTime: e.detail.value })}
              />
            </View>
          </View>

          <View className={styles.addBtn} onClick={handleAddActivity}>
            <Text>+ 添加这个活动</Text>
          </View>

          <View className={styles.quickTip}>
            <Text>💡 支持 9:00、09:00、20:30 等多种写法，保存时会自动标准化</Text>
          </View>
        </>
      ) : (
        <>
          {sortedActivities.length > 0 ? (
            <View className={styles.listContainer}>
            {sortedActivities.map((a: Activity) => (
              <View key={a.id} className={styles.listItem}>
                <View className={styles.listItemMain}>
                  <Text className={styles.listItemName}>{a.name}</Text>
                  <Text className={styles.listItemMeta}>
                    {WEEKDAYS.find(w => w.value === a.dayOfWeek)?.label} {a.startTime}-{a.endTime}
                  </Text>
                  <Text className={styles.listItemMeta}>
                    类型：{ACTIVITY_TYPES.find(t => t.value === a.type)?.label}
                  </Text>
                </View>
                <View className={styles.deleteBtn} onClick={() => handleDeleteActivity(a.id)}>
                  <Text>删除</Text>
                </View>
              </View>
            ))}
          </View>
          ) : (
            <View className={styles.emptyTip}>
              <Text>还没有添加活动，切换到「添加活动」标签页添加吧~</Text>
            </View>
          )}
        </>
      )}
    </>
  );

  const renderStep4 = () => (
    <>
      <Text className={styles.stepTitle}>📝 小说设置</Text>
      <Text className={styles.stepDesc}>
        告诉我们你在连载的小说信息，帮你追踪每日进度</Text>

      <View className={styles.formItem}>
        <Text className={styles.formLabel}>小说名称</Text>
        <Input
          className={styles.formInput}
          placeholder="你的小说叫什么名字"
          value={novelTitle}
          onInput={(e) => setNovelTitle(e.detail.value)}
        />
      </View>

      <View className={styles.formItem}>
        <Text className={styles.formLabel}>发布平台</Text>
        <View className={styles.tagGroup}>
          {PLATFORMS.map(p => (
            <View
              key={p}
              className={classnames(styles.tagOption, { [styles.tagOptionActive]: platform === p })}
              onClick={() => setPlatform(p)}
            >
              {p}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.formItem}>
        <Text className={styles.formLabel}>日更目标（字）</Text>
        <View className={styles.tagGroup}>
          {DAILY_TARGETS.map(t => (
            <View
              key={t}
              className={classnames(styles.tagOption, { [styles.tagOptionActive]: dailyTarget === t })}
              onClick={() => setDailyTarget(t)}
            >
              {t}字
            </View>
          ))}
        </View>
      </View>

      <View className={styles.formItem}>
        <Text className={styles.formLabel}>每日更新时间</Text>
        <View className={styles.tagGroup}>
          {UPDATE_TIMES.map(t => (
            <View
              key={t}
              className={classnames(styles.tagOption, { [styles.tagOptionActive]: updateTime === t })}
              onClick={() => setUpdateTime(t)}
            >
              {t}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.formItem}>
        <Text className={styles.formLabel}>请假规则</Text>
        <Input
          className={styles.formInput}
          placeholder="例如：每月可请假2次"
          value={leaveRules}
          onInput={(e) => setLeaveRules(e.detail.value)}
        />
      </View>
    </>
  );

  return (
    <View className={styles.pageContainer}>
      <View className={styles.header}>
        <Text className={styles.logo}>✍️</Text>
        <Text className={styles.title}>码字课表</Text>
        <Text className={styles.subtitle}>学业写作两不误，大学生网文作者的好帮手</Text>
      </View>

      <View className={styles.progressBar}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View
            key={i}
            className={classnames(styles.progressDot, { [styles.progressDotActive]: i + 1 <= step })}
          />
        ))}
      </View>

      <View className={styles.stepCard}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </View>

      <View className={styles.bottomBar}>
        {step > 1 ? (
          <View className={styles.btnSecondary} onClick={handlePrev}>
            <Text>上一步</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View
          className={classnames(styles.btnPrimary, { [styles.btnFull]: step === 1 })}
          onClick={handleNext}
        >
          <Text>{step === TOTAL_STEPS ? '完成配置' : '下一步'}</Text>
        </View>
      </View>
    </View>
  );
};

export default OnboardingPage;
