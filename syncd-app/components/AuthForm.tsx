import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { FormField } from '@/components/FormField';
import { Button, Muted, Notice, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { isSupabaseConfigured } from '@/lib/supabase';

type Mode = 'sign-in' | 'sign-up';

export function AuthForm({ mode }: { mode: Mode }) {
  const { signIn, signUp, enterDevBypass } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isSignUp = mode === 'sign-up';

  const submit = async () => {
    if (busy) return;

    setError(null);
    setInfo(null);

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (isSignUp && password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setBusy(true);

    try {
      const result = isSignUp
        ? await signUp(email.trim(), password)
        : await signIn(email.trim(), password);

      if (result.error) {
        setError(result.error);
      } else if (result.needsEmailConfirmation) {
        setInfo(
          'Check your email for a confirmation link, then come back and log in.'
        );
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
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
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Ionicons
                  name="musical-notes"
                  size={25}
                  color={colors.text}
                />
              </View>

              <Text style={styles.brand}>SYNCD</Text>
            </View>

            <View style={styles.heading}>
              <Text style={styles.title}>
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </Text>

              <Text style={styles.subtitle}>
                {isSignUp
                  ? 'Your music. Your people. Your vibe.'
                  : 'Pick up right where the music left off.'}
              </Text>
            </View>

            <View style={styles.form}>
              {!isSupabaseConfigured && (
                <Notice tone="info">
                  Supabase isn't connected yet. You can preview the app using
                  the development option below.
                </Notice>
              )}

              {error && <Notice tone="error">{error}</Notice>}
              {info && <Notice tone="info">{info}</Notice>}

              <FormField
                label="EMAIL ADDRESS"
                inputProps={{
                  placeholder: 'you@example.com',
                  keyboardType: 'email-address',
                  autoComplete: 'email',
                  textContentType: 'emailAddress',
                  autoCapitalize: 'none',
                  value: email,
                  onChangeText: setEmail,
                  returnKeyType: 'next',
                  onSubmitEditing: () => {
                    // Move focus to the password field using the next key.
                  },
                }}
              />

              <FormField
                label="PASSWORD"
                inputProps={{
                  placeholder: 'Enter your password',
                  secureTextEntry: true,
                  autoComplete: isSignUp ? 'new-password' : 'current-password',
                  textContentType: isSignUp ? 'newPassword' : 'password',
                  value: password,
                  onChangeText: setPassword,
                  returnKeyType: isSignUp ? 'next' : 'done',
                  onSubmitEditing: isSignUp ? undefined : submit,
                }}
              />

              {isSignUp && (
                <FormField
                  label="CONFIRM PASSWORD"
                  inputProps={{
                    placeholder: 'Enter your password again',
                    secureTextEntry: true,
                    autoComplete: 'new-password',
                    textContentType: 'newPassword',
                    value: confirm,
                    onChangeText: setConfirm,
                    returnKeyType: 'done',
                    onSubmitEditing: submit,
                  }}
                />
              )}

              {!isSignUp && (
                <Link href="/forgot-password" style={styles.forgotLink}>
                  Forgot password?
                </Link>
              )}

              <View style={styles.submitButton}>
                <Button
                  label={isSignUp ? 'Create Account' : 'Log In'}
                  onPress={submit}
                  loading={busy}
                  disabled={busy}
                />
              </View>

              {__DEV__ && !isSupabaseConfigured && (
                <Button
                  label="Continue without account"
                  variant="secondary"
                  onPress={enterDevBypass}
                  disabled={busy}
                />
              )}
            </View>

            <View style={styles.switchContainer}>
              <Muted>
                {isSignUp
                  ? 'Already have an account?'
                  : "Don't have an account?"}
              </Muted>

              <Link
                href={isSignUp ? '/sign-in' : '/sign-up'}
                replace
                style={styles.switchLink}
              >
                {isSignUp ? 'Log in' : 'Sign up'}
              </Link>
            </View>

            <Text style={styles.footer}>MADE FOR THE WAY YOU LISTEN</Text>
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
    justifyContent: 'center',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.electricBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 3,
  },
  heading: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  forgotLink: {
    color: colors.electricGlow,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    alignSelf: 'flex-end',
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  switchLink: {
    color: colors.electricGlow,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    color: colors.textFaint,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
