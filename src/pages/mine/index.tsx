import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import { formatWordsCount } from '@/utils/schedule';
import styles from './index.module.scss';

const menuItems = [
  { icon: '📚', title: '课表管理', desc: '编辑每周课程安排' },
  { icon: '🎯', title: '活动与通勤', desc: '社团、考试、通勤时间' },
  { icon: '📝', title: '小说设置', desc: '日更目标、更新时间' },
  { icon: '📋', title: '请假规则', desc: '断更请假配置' },
  { icon: '⚡', title: '写作速度', desc: '每分钟约写字数' },
  { icon: 'ℹ️', title: '关于', desc: '版本信息与帮助' },
];

const MinePage: React.FC = () => {
  const { profile, novel, courses, activities } = useApp();

  const handleMenuClick = (title: string) => {
    console.log('[MinePage] 点击菜单项:', title);
    Taro.showToast({ title: `${title}功能开发中`, icon: 'none' });
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
            {profile.grade} · {profile.major}
            {'\n'}写作速度约 {profile.writingSpeed} 字/分钟
          </Text>
        </View>
      </View>

      <View className={styles.section}>
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
          <View className={styles.novelMeta}>
            <Text>更新时间：每天 {novel.updateTime}</Text>
            <Text>{courses.length} 门课程 · {activities.length} 项活动</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>设置</Text>
        <View className={styles.menuList}>
          {menuItems.map(item => (
            <View
              key={item.title}
              className={styles.menuItem}
              onClick={() => handleMenuClick(item.title)}
            >
              <View className={styles.menuIcon}>
                <Text>{item.icon}</Text>
              </View>
              <View className={styles.menuContent}>
                <Text className={styles.menuTitle}>{item.title}</Text>
                <Text className={styles.menuDesc}>{item.desc}</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
