import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../../theme';
import type { DayMark } from '../store';

/** ● full · a wave for half (the course's zig-zag) · an empty ring otherwise. */
export function DayMarkIcon({
  mark,
  size = 24,
}: {
  mark: DayMark;
  size?: number;
}) {
  const r = size / 2 - 1;
  const c = size / 2;
  if (mark === 'full') {
    return (
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} fill={colors.saffron} />
      </Svg>
    );
  }
  if (mark === 'half') {
    const s = size / 24;
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle
          cx={12}
          cy={12}
          r={11}
          fill="none"
          stroke={colors.saffron}
          strokeWidth={1.5 / s}
        />
        <Path
          d="M5 13.5l2.4-3 2.4 3 2.4-3 2.4 3 2.4-3 2 2.5"
          fill="none"
          stroke={colors.saffron}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke="#000"
        strokeOpacity={mark === 'missed' ? 0.25 : 0.1}
        strokeWidth={1.5}
        strokeDasharray={mark === 'missed' ? '2 3' : undefined}
      />
    </Svg>
  );
}
