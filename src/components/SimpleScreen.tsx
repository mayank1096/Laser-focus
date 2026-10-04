import React from 'react';
import type { ImageSourcePropType } from 'react-native';
import { FlowFrame, type FlowTone } from './FlowFrame';

export interface SimpleScreenProps {
  onBack: () => void;
  hideBack?: boolean;
  footer: React.ReactNode;
  children: React.ReactNode;
  art?: ImageSourcePropType;
  tone?: FlowTone;
  progress?: { total: number; filled: number };
  testID?: string;
}

/** A one-question screen: the FlowFrame without steps to slide between. */
export function SimpleScreen({
  onBack,
  hideBack,
  footer,
  children,
  art,
  tone,
  progress,
  testID,
}: SimpleScreenProps) {
  return (
    <FlowFrame
      testID={testID}
      stepKey="only"
      direction="forward"
      art={art}
      tone={tone}
      progress={progress}
      onBack={onBack}
      hideBack={hideBack}
      footer={footer}
    >
      {children}
    </FlowFrame>
  );
}
