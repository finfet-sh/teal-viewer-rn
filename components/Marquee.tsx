import { useEffect, useState } from "react";
import { ScrollView, ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  speed?: number; // pixels per second
  delay?: number; // ms pause at each end
}

export default function Marquee({ children, style, speed = 20, delay = 1500 }: Props) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const offset = useSharedValue(0);

  const needsMarquee = containerWidth > 0 && contentWidth > containerWidth;

  useEffect(() => {
    if (!needsMarquee) {
      cancelAnimation(offset);
      offset.value = 0;
      return;
    }

    const distance = contentWidth - containerWidth;
    const duration = (distance / speed) * 1000;

    offset.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withDelay(delay, withTiming(-distance, { duration, easing: Easing.linear })),
          withDelay(delay, withTiming(0, { duration, easing: Easing.linear })),
        ),
        -1,
      ),
    );

    return () => {
      cancelAnimation(offset);
      offset.value = 0;
    };
  }, [needsMarquee, contentWidth, containerWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <ScrollView
      horizontal
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      style={style}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      onContentSizeChange={(w) => setContentWidth(w)}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </ScrollView>
  );
}
