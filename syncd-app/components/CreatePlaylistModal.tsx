import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Input, Notice } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

type CreatePlaylistModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Should throw an Error with a readable message if the playlist can't be made. */
  onCreate: (name: string) => Promise<void>;
};

/** Small popup that asks for a playlist name. Works on iOS, Android and web. */
export function CreatePlaylistModal({
  visible,
  onClose,
  onCreate,
}: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start fresh every time the popup opens.
  useEffect(() => {
    if (visible) {
      setName('');
      setError(null);
      setBusy(false);
    }
  }, [visible]);

  const submit = async () => {
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      await onCreate(name);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't create the playlist."
      );
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={busy ? undefined : onClose}
          accessibilityLabel="Close"
        />

        <View style={styles.card}>
          <Text style={styles.title}>Create playlist</Text>

          <Input
            value={name}
            onChangeText={setName}
            placeholder="Playlist name"
            autoFocus
            autoCapitalize="sentences"
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={submit}
            accessibilityLabel="Playlist name"
          />

          {error ? (
            <View style={styles.notice}>
              <Notice tone="error">{error}</Notice>
            </View>
          ) : null}

          <View style={styles.actions}>
            <View style={styles.action}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={onClose}
                disabled={busy}
              />
            </View>
            <View style={styles.action}>
              <Button
                label="Create"
                onPress={submit}
                loading={busy}
                disabled={!name.trim()}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  notice: {
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  action: {
    flex: 1,
  },
});
