import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface ScheduleCardProps {
  name: string;
  type: 'course' | 'exam' | 'club' | 'commute' | 'other';
  time: string;
  location?: string;
  teacher?: string;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ name, type, time, location, teacher }) => {
  const typeLabels: Record<string, string> = {
    course: '课程',
    exam: '考试',
    club: '社团',
    commute: '通勤',
    other: '其他',
  };

  return (
    <View className={classnames(styles.card, {
      [styles.examCard]: type === 'exam',
      [styles.clubCard]: type === 'club',
      [styles.commuteCard]: type === 'commute',
    })}>
      <View className={styles.header}>
        <Text className={styles.name}>{name}</Text>
        <Text className={classnames(styles.tag, {
          [styles.courseTag]: type === 'course',
          [styles.examTag]: type === 'exam',
          [styles.clubTag]: type === 'club',
          [styles.commuteTag]: type === 'commute',
        })}>{typeLabels[type]}</Text>
      </View>
      <View className={styles.meta}>
        <Text className={styles.metaItem}>🕐 {time}</Text>
        {location && <Text className={styles.metaItem}>📍 {location}</Text>}
        {teacher && <Text className={styles.metaItem}>👤 {teacher}</Text>}
      </View>
    </View>
  );
};

export default ScheduleCard;
