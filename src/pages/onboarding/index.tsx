import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import classnames from 'classnames';
import Taro from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import styles from './index.module.scss';

const TOTAL_STEPS = 4;
const GRADES = ['大一', '大二', '大三', '大四', '研一', '研二', '研三'];
const PLATFORMS = ['起点中文网', '晋江文学城', '番茄小说', '纵横中文网', '其他'];
const UPDATE_TIMES = ['18:00', '20:00', '21:00', '22:00', '23:00', '00:00'];
const DAILY_TARGETS = [1000, 1500, 2000, 3000, 4000];

const OnboardingPage: React.FC = () => {
  const { profile, courses, activities, novel, updateProfile, updateNovel } = useApp();
  const [step, setStep] = useState(1);

  const [nickname, setNickname] = useState(profile.nickname);
  const [grade, setGrade] = useState(profile.grade);
  const [major, setMajor] = useState(profile.major);
  const [writingSpeed, setWritingSpeed] = useState(String(profile.writingSpeed));

  const [novelTitle, setNovelTitle] = useState(novel.title);
  const [platform, setPlatform] = useState(novel.platform);
  const [dailyTarget, setDailyTarget] = useState(novel.dailyTarget);
  const [updateTime, setUpdateTime] = useState(novel.updateTime);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    updateProfile({
      nickname: nickname || '作者',
      grade,
      major,
      writingSpeed: parseInt(writingSpeed || '20', 10),
    });
    updateNovel({
      title: novelTitle || '我的小说',
      platform,
      dailyTarget,
      updateTime,
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
          value={writingSpeed}
          onInput={(e) => setWritingSpeed(e.detail.value)}
        />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text className={styles.stepTitle}>📚 每周课程</Text>
      <Text className={styles.stepDesc}>我们会基于你的课程表，自动找出适合写作的空档时段</Text>

      <View className={styles.demoList}>
        {courses.slice(0, 5).map(c => (
          <View key={c.id} className={styles.demoItem}>
            <View className={styles.demoInfo}>
              <Text className={styles.demoName}>{c.name}</Text>
              <Text className={styles.demoMeta}>
                周{c.dayOfWeek} 第{c.startPeriod}-{c.endPeriod}节 · {c.location || '待定'}
              </Text>
            </View>
            <Text className={styles.demoCount}>已配置</Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 48, padding: 24, background: '#F5F3EF', borderRadius: 12 }}>
        <Text style={{ fontSize: 24, color: '#86909C', lineHeight: 1.8 }}>
          💡 示例课表已加载，正式使用时可在「我的 - 课表管理」中编辑你的真实课程
        </Text>
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text className={styles.stepTitle}>🎯 活动与通勤</Text>
      <Text className={styles.stepDesc}>社团、考试、日常通勤这些时间也不能写作哦，让我们帮你排除掉</Text>

      <View className={styles.demoList}>
        {activities.map(a => (
          <View key={a.id} className={styles.demoItem}>
            <View className={styles.demoInfo}>
              <Text className={styles.demoName}>{a.name}</Text>
              <Text className={styles.demoMeta}>
                周{a.dayOfWeek} {a.startTime}-{a.endTime}
              </Text>
            </View>
            <Text className={styles.demoCount}>
              {a.type === 'exam' ? '考试' : a.type === 'club' ? '社团' : a.type === 'commute' ? '通勤' : '其他'}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 48, padding: 24, background: '#F5F3EF', borderRadius: 12 }}>
        <Text style={{ fontSize: 24, color: '#86909C', lineHeight: 1.8 }}>
          💡 考试日和满课日我们会提前预警，建议提前存稿避免断更
        </Text>
      </View>
    </>
  );

  const renderStep4 = () => (
    <>
      <Text className={styles.stepTitle}>📝 小说设置</Text>
      <Text className={styles.stepDesc}>最后告诉我们你在连载的小说信息，帮你追踪每日进度</Text>

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
