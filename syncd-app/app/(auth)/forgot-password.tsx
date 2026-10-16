import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button, Notice, Screen } from '@/components/ui';
import { FormField } from '@/components/FormField';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleReset = async () => {
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }

    setBusy(true);

    try {
      const result = await resetPassword(email.trim());

      if (result.error) {
        setError(result.error);
      } else {
        setInfo(
          'If an account exists for this email, password reset instructions will be sent.'
        );
      }
    } catch {
      setError('We couldn’t send the reset email. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    router.replace('/sign-in');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="lock-closed-outline"
                  size={30}
                  color={colors.electricGlow}
                />
              </View>

              <Text style={styles.title}>Forgot Password</Text>

              <Text style={styles.description}>
                Enter your email below. You will get an email with
                instructions on how to recover your password.
              </Text>

              <View style={styles.form}>
                {error && <Notice tone="error">{error}</Notice>}
                {info && <Notice tone="info">{info}</Notice>}

                <FormField
                  label="EMAIL ADDRESS"
                  inputProps={{
                    placeholder: 'you@example.com',
                    keyboardType: 'email-address',
                    autoCapitalize: 'none',
                    autoComplete: 'email',
                    textContentType: 'emailAddress',
                    value: email,
                    onChangeText: setEmail,
                    returnKeyType: 'done',
                    onSubmitEditing: handleReset,
                  }}
                />

                <Button
                  label="Send Reset Instructions"
                  onPress={handleReset}
                  loading={busy}
                  disabled={busy}
                />

                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={handleCancel}
                  disabled={busy}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.void,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  form: {
    width: '100%',
    gap: spacing.md,
  },
});