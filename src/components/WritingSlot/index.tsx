import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface WritingSlotProps {
  label: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  estimatedWords: number;
  isSelected: boolean;
  onSelect: () => void;
}

const WritingSlotComp: React.FC<WritingSlotProps> = ({
  label,
  startTime,
  endTime,
  durationMinutes,
  estimatedWords,
  isSelected,
  onSelect,
}) => {
  return (
    <View
      className={classnames(styles.slotCard, { [styles.selected]: isSelected })}
      onClick={onSelect}
    >
      <View className={styles.header}>
        <Text className={styles.label}>{label}</Text>
        <Text className={styles.time}>{startTime} - {endTime}</Text>
      </View>
      <View className={styles.body}>
        <View className={styles.info}>
          <Text className={styles.duration}>{durationMinutes}分钟</Text>
          <Text className={styles.words}>
            <Text className={styles.num}>约{estimatedWords}</Text>字
          </Text>
        </View>
        <View className={classnames(styles.checkbox, { [styles.checked]: isSelected })}>
          {isSelected && <Text>✓</Text>}
        </View>
      </View>
    </View>
  );
};

export default WritingSlotComp;
