import React from 'react';
import { StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';

/** iPad portrait and large Android tablets. Phones stay under this. */
export const TABLET_MIN_WIDTH = 768;

/** Card galleries (home, rewards). */
export const WIDE_COLUMN = 980;

/** Forms, menus, account, wallet. */
export const TEXT_COLUMN = 760;

type PageFrameProps = {
  children: React.ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
};

/** Centers a column on tablet. On a phone it stays full width. */
export function PageFrame({ children, maxWidth = TEXT_COLUMN, style }: PageFrameProps) {
  return <View style={[styles.frame, { maxWidth }, style]}>{children}</View>;
}

export function usePageLayout(maxWidth = TEXT_COLUMN) {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;
  const content = Math.min(Math.max(width - 40, 0), maxWidth);
  return { width, height, isTablet, content };
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    alignSelf: 'center',
  },
});
