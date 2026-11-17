import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

// Library is a tab that holds its own stack: the list of playlists (index)
// and a screen for one playlist (playlist/[id]). The tab bar stays visible.
export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.void },
      }}
    />
  );
}
