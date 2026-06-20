import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';

interface WarningCardProps {
  type: 'busy' | 'exam' | 'low_stock';
  level: 'high' | 'medium' | 'low';
  title: string;
  date: string;
  description: string;
  suggestedWords: number;
}

const WarningCard: React.FC<WarningCardProps> = ({
  type,
  level,
  title,
  date,
  description,
  suggestedWords,
}) => {
  const typeIcons: Record<string, string> = {
    busy: '📅',
    exam: '📝',
    low_stock: '⚠️',
  };

  const formattedDate = dayjs(date).format('MM月DD日 dddd');

  return (
    <View className={classnames(styles.card, styles[level])}>
      <View className={styles.header}>
        <View className={classnames(styles.icon, styles[level + 'Icon'])}>
          <Text>{typeIcons[type]}</Text>
        </View>
        <View className={styles.titleWrap}>
          <Text className={styles.title}>{title}</Text>
          <Text className={styles.date}>{formattedDate}</Text>
        </View>
      </View>
      <Text className={styles.description}>{description}</Text>
      <View className={styles.suggestion}>
        <Text className={styles.suggestionLabel}>建议今晚多存稿</Text>
        <Text className={classnames(styles.suggestionWords, styles[level])}>
          {suggestedWords} 字
        </Text>
      </View>
    </View>
  );
};

export default WarningCard;
