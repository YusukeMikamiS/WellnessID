/**
 * 下部タブ（5本）
 *
 * - ロールによる行き先の出し分けはしない（Rev.3 でタブの行き先は固定）
 * - タブバーは磨りガラス（CLAUDE.md §4）。背後のコンテンツが透けるよう position: absolute にする。
 *   各画面は BottomTabBarHeightContext でタブバーの高さぶん下に余白を取ること
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import { Link, Tabs, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { headerOptions } from '@/theme/navigation';
import { colors, fontFamily, spacing } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'ホーム', icon: 'home-outline' },
  { name: 'search', title: '探す', icon: 'search-outline' },
  { name: 'ranking', title: 'ランキング', icon: 'bar-chart-outline' },
  { name: 'reviews', title: '口コミ', icon: 'chatbubble-ellipses-outline' },
  { name: 'mywellness', title: 'MY WELLNESS', icon: 'id-card-outline' },
];

/** アプリ名はハードコードせず app.json から取る（CLAUDE.md §12） */
const appName = Constants.expoConfig?.name ?? '';

function HomeTitle() {
  return (
    <View>
      <Text style={styles.logo}>{appName.toUpperCase()}</Text>
      <Text style={styles.tagline}>自分に合うウェルネスが見つかる</Text>
    </View>
  );
}

function HeaderIconLink({ href, icon, label }: { href: Href; icon: IconName; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable hitSlop={12} accessibilityLabel={label} style={styles.headerIcon}>
        <Ionicons name={icon} size={22} color={colors.ink} />
      </Pressable>
    </Link>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        ...headerOptions,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: colors.line,
        },
        tabBarBackground: () => (
          <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
        ),
        tabBarLabelStyle: { fontFamily: fontFamily.bodyMedium, fontSize: 10 },
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
            ...(tab.name === 'index' && {
              headerTitle: () => <HomeTitle />,
              headerTitleAlign: 'left',
              headerRight: () => (
                <HeaderIconLink href="/notice" icon="notifications-outline" label="お知らせ" />
              ),
            }),
            ...(tab.name === 'mywellness' && {
              headerRight: () => (
                <HeaderIconLink href="/settings" icon="settings-outline" label="設定" />
              ),
            }),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 15,
    letterSpacing: 3,
    color: colors.ink,
  },
  tagline: {
    fontFamily: fontFamily.body,
    fontSize: 10,
    color: colors.inkMuted,
  },
  headerIcon: {
    marginHorizontal: spacing.base,
  },
});
