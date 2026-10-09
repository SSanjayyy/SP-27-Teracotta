import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { Button, Input, Muted, Notice, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
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
    const result = isSignUp ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);

    if (result.error) {
      setError(result.error);
    } else if (result.needsEmailConfirmation) {
      setInfo('Check your email for a confirmation link, then come back and log in.');
    }
    // On success the root layout sees the new session and switches to the tabs.
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.brand}>SYNCD</Text>
          <Title>{isSignUp ? 'Create your account' : 'Welcome back'}</Title>
          <Muted>{isSignUp ? 'Sign up to start listening.' : 'Log in to keep listening.'}</Muted>

          <View style={styles.form}>
            {!isSupabaseConfigured && (
              <Notice tone="info">
                Supabase isn't connected yet (no .env file). You can still build screens —
                use "Continue without account" below.
              </Notice>
            )}
            {error && <Notice tone="error">{error}</Notice>}
            {info && <Notice tone="info">{info}</Notice>}

            <Input
              placeholder="Email"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              placeholder="Password"
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              textContentType={isSignUp ? 'newPassword' : 'password'}
              value={password}
              onChangeText={setPassword}
            />
            {isSignUp && (
              <Input
                placeholder="Confirm password"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                value={confirm}
                onChangeText={setConfirm}
              />
            )}

            <Button label={isSignUp ? 'Sign up' : 'Log in'} onPress={submit} loading={busy} />

            {__DEV__ && !isSupabaseConfigured && (
              <Button
                label="Continue without account (dev only)"
                variant="secondary"
                onPress={enterDevBypass}
              />
            )}
          </View>

          <Link href={isSignUp ? '/sign-in' : '/sign-up'} replace style={styles.switchLink}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Text style={styles.switchLinkStrong}>{isSignUp ? 'Log in' : 'Sign up'}</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingBottom: spacing.xl },
  brand: {
    color: colors.electricGlow,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
  },
  form: { gap: spacing.md, marginTop: spacing.lg },
  switchLink: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  switchLinkStrong: { color: colors.electricBright, fontWeight: '600' },
});
