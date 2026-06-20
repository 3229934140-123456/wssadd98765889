import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface ProgressRingProps {
  percent: number;
  size?: number;
  color?: string;
  label?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  percent,
  size = 180,
  color = '#2D5A7B',
  label = '今日进度',
}) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, percent) / 100) * circumference;

  return (
    <View className={styles.container} style={{ width: size + 'rpx', height: size + 'rpx' }}>
      <svg width={size} height={size}>
        <circle
          className={styles.ringBg}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          className={styles.ringFg}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <View className={styles.centerText}>
        <Text className={styles.percent}>{percent}%</Text>
        <Text className={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

export default ProgressRing;
