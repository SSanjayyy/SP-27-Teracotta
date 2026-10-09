import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Muted, Screen, Title } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function ProfileScreen() {
  const { user, isDevBypass, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    setBusy(true);
    await signOut();
    // Root layout switches back to the login screen automatically.
  };

  return (
    <Screen>
      <Title>Profile</Title>
      <Muted>
        {isDevBypass
          ? 'Dev mode — not signed in (Supabase not connected yet).'
          : `Signed in as ${user?.email ?? 'unknown'}`}
      </Muted>
      <Muted>Listening habits and account settings go here.</Muted>

      <View style={styles.actions}>
        <Button label="Log out" variant="secondary" onPress={handleSignOut} loading={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { marginTop: spacing.xl },
});
