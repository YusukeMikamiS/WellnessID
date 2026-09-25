/**
 * 下部タブ（5本）
 *
 * ロールによる行き先の出し分けはしない（Rev.3 でタブの行き先は固定）。
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { colors, fontFamily } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'ホーム', icon: 'home-outline' },
  { name: 'search', title: '探す', icon: 'search-outline' },
  { name: 'ranking', title: 'ランキング', icon: 'podium-outline' },
  { name: 'reviews', title: '口コミ', icon: 'chatbubbles-outline' },
  { name: 'mywellness', title: 'MY WELLNESS', icon: 'person-circle-outline' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: { fontFamily: fontFamily.bodyMedium, fontSize: 10 },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fontFamily.bodyBold },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} color={color} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
