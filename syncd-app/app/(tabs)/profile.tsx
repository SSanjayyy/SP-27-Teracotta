import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Notice } from '@/components/ui';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { SettingsRow } from '@/components/SettingsRow';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function ProfileScreen() {
  const { user, isDevBypass, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const email = user?.email ?? '';
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    email.split('@')[0] ||
    'Music Lover';

  const settings = [
    {
      id: 'edit',
      icon: 'person-outline' as const,
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
    },
    {
      id: 'listening',
      icon: 'musical-notes-outline' as const,
      title: 'Listening Preferences',
      subtitle: 'Customize your music experience',
    },
    {
      id: 'notifications',
      icon: 'notifications-outline' as const,
      title: 'Notifications',
      subtitle: 'Manage your notifications',
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark-outline' as const,
      title: 'Privacy & Security',
      subtitle: 'Manage your account privacy',
    },
  ];

  const handleSignOut = async () => {
    if (busy) return;

    setBusy(true);
    setSignOutError(null);

    try {
      await signOut();
    } catch {
      setSignOutError('Unable to log out. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Profile</Text>

        <View style={styles.profileCard}>
          <ProfileAvatar
            size={76}
            name={displayName}
            style={styles.avatar}
          />

          <Text style={styles.name}>{displayName}</Text>

          <Text style={styles.email}>
            {email || 'Your music journey starts here'}
          </Text>

          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {isDevBypass ? 'Development Mode' : 'Connected Account'}
            </Text>
          </View>

          {isDevBypass && (
            <Text style={styles.devNote}>
              Your account is using development mode. Your profile details
              will be connected when authentication is configured.
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Account Settings</Text>

        <View style={styles.settingsCard}>
          {settings.map((setting, index) => (
            <SettingsRow
              key={setting.id}
              title={setting.title}
              subtitle={setting.subtitle}
              icon={setting.icon}
              onPress={() => {}}
              showDivider={index !== settings.length - 1}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>About Your Account</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              @{displayName.replace(/\s+/g, '').toLowerCase()}
            </Text>
          </View>

          <View style={[styles.infoRow, styles.lastInfoRow]}>
            <Text style={styles.infoLabel}>Account status</Text>
            <Text style={styles.infoValue}>
              {isDevBypass ? 'Development' : 'Active'}
            </Text>
          </View>
        </View>

        {signOutError && (
          <View style={styles.errorContainer}>
            <Notice tone="error">{signOutError}</Notice>
          </View>
        )}

        <Pressable
          style={[styles.logoutButton, busy && styles.disabledButton]}
          onPress={handleSignOut}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          accessibilityState={{ disabled: busy, busy }}
        >
          <Ionicons
            name="log-out-outline"
            size={21}
            color={colors.danger}
          />
          <Text style={styles.logoutText}>
            {busy ? 'Logging out...' : 'Log Out'}
          </Text>
        </Pressable>

        <Text style={styles.footer}>SYNCD</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.void,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  avatar: {
    borderRadius: radius.lg,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  email: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.void,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  devNote: {
    color: colors.textFaint,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  errorContainer: {
    marginBottom: spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
