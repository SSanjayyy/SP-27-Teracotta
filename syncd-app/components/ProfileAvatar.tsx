import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { colors, radius } from '@/constants/theme';

const TEMP_PROFILE_PHOTO =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces';

type ProfileAvatarProps = {
  size?: number;
  imageUrl?: string;
  name?: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export function ProfileAvatar({
  size = 42,
  imageUrl = TEMP_PROFILE_PHOTO,
  name = 'User',
  onPress,
  style,
}: ProfileAvatarProps) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || 'U';
  const showImage = Boolean(imageUrl) && !photoFailed;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${name}'s profile picture`}
      style={({ pressed }) => [
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: imageUrl }}
          onError={() => setPhotoFailed(true)}
          resizeMode="cover"
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
            {initial}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.electricDim,
  },
  initial: {
    color: colors.text,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
