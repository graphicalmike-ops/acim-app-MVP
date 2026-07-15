import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/utils/theme';

// Matches the load bar's filled element: same thickness, same fill colors.
const THUMB_THICKNESS = 3;
// Touch target is wider than the visible thumb so it's easy to grab.
const THUMB_HIT_WIDTH = 16;
const MIN_THUMB_LENGTH = 32;
const HIDE_DELAY_MS = 2000;
const FADE_OUT_MS = 300;

type Props = ScrollViewProps;

/**
 * Drop-in ScrollView replacement with a custom, thumb-only vertical
 * scrollbar: same color/thickness as the load bar's filled element, always
 * present (and always draggable) when content overflows, but only visible
 * while scrolling/dragging — it fades out after 2s of inactivity.
 */
export const AppScrollView = forwardRef<ScrollView, Props>(function AppScrollView(
  { style, onScroll, onLayout, onContentSizeChange, children, ...rest },
  ref
) {
  const { isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const setRefs = useCallback((node: ScrollView | null) => {
    scrollRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<ScrollView | null>).current = node;
  }, [ref]);

  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollYRef = useRef(0);
  const draggingRef = useRef(false);
  const dragStartScrollY = useRef(0);

  const thumbOpacity = useRef(new Animated.Value(0)).current;
  const thumbTranslateY = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxScroll = Math.max(0, contentHeight - containerHeight);
  const canScroll = maxScroll > 1;
  const thumbLength = canScroll
    ? Math.max(MIN_THUMB_LENGTH, (containerHeight * containerHeight) / contentHeight)
    : 0;
  const maxThumbTravel = Math.max(0, containerHeight - thumbLength);

  const updateThumbPosition = useCallback((y: number) => {
    const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, y / maxScroll)) : 0;
    thumbTranslateY.setValue(ratio * maxThumbTravel);
  }, [maxScroll, maxThumbTravel, thumbTranslateY]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (draggingRef.current) return;
      Animated.timing(thumbOpacity, { toValue: 0, duration: FADE_OUT_MS, useNativeDriver: true }).start();
    }, HIDE_DELAY_MS);
  }, [thumbOpacity]);

  const showThumb = useCallback(() => {
    thumbOpacity.stopAnimation();
    thumbOpacity.setValue(1);
    scheduleHide();
  }, [thumbOpacity, scheduleHide]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollYRef.current = y;
    updateThumbPosition(y);
    showThumb();
    onScroll?.(e);
  }, [onScroll, updateThumbPosition, showThumb]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerHeight(e.nativeEvent.layout.height);
    onLayout?.(e);
  }, [onLayout]);

  const handleContentSizeChange = useCallback((w: number, h: number) => {
    setContentHeight(h);
    onContentSizeChange?.(w, h);
  }, [onContentSizeChange]);

  // Recreated whenever the values its callbacks close over change — a
  // PanResponder built once via useRef() would freeze onStartShouldSet /
  // onPanResponderMove on the very first render's canScroll/maxScroll/
  // maxThumbTravel (all 0/false before layout), so it would never activate.
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => canScroll,
    onMoveShouldSetPanResponder: (_, gesture) => canScroll && Math.abs(gesture.dy) > 2,
    onPanResponderGrant: () => {
      draggingRef.current = true;
      dragStartScrollY.current = scrollYRef.current;
      showThumb();
    },
    onPanResponderMove: (_, gesture) => {
      if (maxThumbTravel <= 0) return;
      const deltaContent = (gesture.dy / maxThumbTravel) * maxScroll;
      const nextY = Math.min(maxScroll, Math.max(0, dragStartScrollY.current + deltaContent));
      scrollRef.current?.scrollTo({ y: nextY, animated: false });
      scrollYRef.current = nextY;
      updateThumbPosition(nextY);
      showThumb();
    },
    onPanResponderRelease: () => {
      draggingRef.current = false;
      scheduleHide();
    },
    onPanResponderTerminate: () => {
      draggingRef.current = false;
      scheduleHide();
    },
  }), [canScroll, maxScroll, maxThumbTravel, showThumb, scheduleHide, updateThumbPosition]);

  return (
    <View style={[styles.wrapper, style]}>
      <ScrollView
        {...rest}
        ref={setRefs}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
      {canScroll && (
        <View {...panResponder.panHandlers} style={[styles.thumbHitArea, { height: containerHeight }]}>
          <Animated.View
            style={[
              styles.thumb,
              {
                height: thumbLength,
                backgroundColor: isDark ? Colors.primaryButtonBgDark : Colors.fontColorPrimary,
                opacity: thumbOpacity,
                transform: [{ translateY: thumbTranslateY }],
              },
            ]}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  thumbHitArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: THUMB_HIT_WIDTH,
    alignItems: 'center',
  },
  thumb: {
    width: THUMB_THICKNESS,
    borderRadius: THUMB_THICKNESS / 2,
  },
});
