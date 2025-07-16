import { View, Text, useWindowDimensions, Animated } from 'react-native';
import { useEffect } from 'react';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

interface Props {
  handleConfirm?: () => void;
}

const { width } = useWindowDimensions();
const TIME_TO_ACTIVE_PAN = 150;
const TOUCH_SLOP = 5;

export const Toast = ({ handleConfirm }: Props) => {
  const usedWidth = (width * 80) / 100;

  console.log(TIME_TO_ACTIVE_PAN, TOUCH_SLOP, usedWidth);
  const handleResetToast = () => {};

  const hanldeAnimation = () => {};

  console.log(handleResetToast, hanldeAnimation, handleConfirm);

  useEffect(() => {}, []);

  const pan = Gesture.Pan();

  return (
    <GestureDetector gesture={pan}>
      <Animated.View>
        <View></View>
        <Text>Toast</Text>
      </Animated.View>
    </GestureDetector>
  );
};
