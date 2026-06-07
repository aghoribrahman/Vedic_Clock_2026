/**
 * The central dial — RN port of `_DialCore` from `lib/main.dart`.
 *
 * Three concentric rings:
 *   1. Outer ring — 30 muhurta wedges, coloured by nature (shubha=green,
 *      ashubha=red). The currently-active wedge is brightened.
 *   2. Middle ring — kala / kashtha hashmarks.
 *   3. Inner core — the big MM : KK : KK readout via [HeroDigits].
 *
 * Below the dial: the active muhurta's name + deity + nature gloss.
 *
 * For RN we render the rings with react-native-svg and put the hero
 * digits in an absolutely-positioned `<View>` on top.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Image, Platform, StyleSheet, Text, View, PixelRatio, Animated } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Svg, { Circle, G, Path, Defs, ClipPath, Text as SvgText, TextPath, Image as SvgImage } from 'react-native-svg';
import { MUHURTAS } from '../data/muhurtas';
import { VedicClockState } from '../models';
import { colors } from '../theme';
import { GiltArch } from './GiltArch';
import { HeroDigits } from './HeroDigits';
import { RASHI_ICONS } from '../data/rashiAssets';
import { NAKSHATRA_ICONS } from '../data/nakshatraAssets';
import { TITHI_ICONS } from '../data/tithiAssets';
import { ImageSourcePropType } from 'react-native';

interface Props {
  state: VedicClockState;
  size: number;
}

const FRAME_ONLY = require('../../assets/images/OnlyFrame.png');
const EARTH_VIDEO = require('../../assets/Rotating_Earth.mp4');
const RASHI_CIRCLE = require('../../assets/images/rashi circle.png');

interface AnimatedIconProps {
  index: number;
  size: number;
  scale: number;
  icons: ImageSourcePropType[];
}

function AnimatedIcon({ index, size, scale, icons }: AnimatedIconProps): React.JSX.Element {
  const [displayedIndex, setDisplayedIndex] = React.useState(index);
  const [prevIndex, setPrevIndex] = React.useState<number | null>(null);
  const animValue = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (index !== displayedIndex) {
      setPrevIndex(displayedIndex);
      setDisplayedIndex(index);
      animValue.setValue(0);

      Animated.timing(animValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setPrevIndex(null);
      });
    }
  }, [index]);

  const prevOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const prevScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.75],
  });
  const prevRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '30deg'],
  });

  const newOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const newScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });
  const newRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30deg', '0deg'],
  });

  // Rashi circle frame is oval (1686×2528, W/H ≈ 0.667)
  const frameAspect = 1686 / 2528; // 0.667 — width is 66.7% of height
  const frameH = size * 1.55;      // frame height relative to icon size
  const frameW = frameH * frameAspect;

  // Inner oval bg — matches the inner cutout of the frame
  // Inner cutout is ~77.8% of image width, ~54.3% of image height
  const bgW = frameW * 0.78;
  const bgH = frameH * 0.62;

  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: bgW,
          height: bgH,
          left: (size - bgW) / 2,
          top: (size - bgH) / 2,
          borderRadius: bgH / 2,
          backgroundColor: 'rgba(0, 0, 0, 0.90)',
        }}
      />
      <Image
        source={RASHI_CIRCLE}
        style={{
          position: 'absolute',
          width: frameW,
          height: frameH,
          left: (size - frameW) / 2,
          top: (size - frameH) / 2,
        }}
        resizeMode="contain"
      />
      {prevIndex !== null && (
        <Animated.Image
          source={icons[prevIndex]}
          style={[
            styles.rashiFloatingIcon,
            {
              position: 'absolute',
              opacity: prevOpacity,
              transform: [
                { scale: prevScale },
                { rotate: prevRotate }
              ],
            },
          ]}
          resizeMode="contain"
        />
      )}
      <Animated.Image
        source={icons[displayedIndex]}
        style={[
          styles.rashiFloatingIcon,
          prevIndex !== null && { position: 'absolute' },
          {
            opacity: prevIndex !== null ? newOpacity : 1,
            transform: [
              { scale: prevIndex !== null ? newScale : 1 },
              { rotate: prevIndex !== null ? newRotate : '0deg' }
            ],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

export function DialCore({ state, size }: Props): React.JSX.Element {
  const half = size / 2;
  const ringOuterR = half * 0.94; // slightly larger for the brass texture
  const ringInnerR = half * 0.70;

  // ── Animated Progress States ──────────────────────────────────────────
  const targetKaranaSlot = state.panchang.karana.slot;
  const targetYogaFraction = state.panchang.yoga.progressFraction;

  const [animKaranaSlot, setAnimKaranaSlot] = useState(0);
  const [animYogaFraction, setAnimYogaFraction] = useState(0);

  useEffect(() => {
    let start = Date.now();
    let duration = 1200; // 1.2 second fill animation
    let frameId: number;

    const animate = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4); // easeOutQuart

      setAnimKaranaSlot(targetKaranaSlot * easeOut);
      setAnimYogaFraction(targetYogaFraction * easeOut);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        // ensure exact values at end
        setAnimKaranaSlot(targetKaranaSlot);
        setAnimYogaFraction(targetYogaFraction);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [targetKaranaSlot, targetYogaFraction]);

  // ── Rotating Earth video player ──────────────────────────────────────
  const appState = useRef(AppState.currentState);

  const earthPlayer = useVideoPlayer(EARTH_VIDEO, (player) => {
    player.loop = true;
    player.muted = true;
    player.playbackRate = 0.4; // Slightly faster to avoid 30fps stuttering
    player.staysActiveInBackground = true;
    player.play();
  });

  // Robust looping fallback
  useEffect(() => {
    const sub = earthPlayer.addListener('playToEnd', () => {
      earthPlayer.play();
    });
    return () => sub.remove();
  }, [earthPlayer]);

  // Playback recovery on app focus
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        earthPlayer.play();
      }
      appState.current = nextAppState;
    });

    if (Platform.OS === 'web') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          earthPlayer.play();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        subscription.remove();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    return () => {
      subscription.remove();
    };
  }, [earthPlayer]);

  // Initial play trigger
  useEffect(() => {
    earthPlayer.play();
  }, [earthPlayer]);

  // Scale factor for text and spacing (normalized to size 600)
  const scale = size / 600;
  const fontScale = PixelRatio.getFontScale();

  // Responsive Rashi sizing — refined for fluid adaptation
  const { rashiSize, rashiPos, rashiBottom, rashiFontSize, rashiLabelOffset } = useMemo(() => {
    // Non-linear scaling for better balance across device classes
    const baseRashiSize = size * 0.22;
    const sizeFloor = 52 * Math.sqrt(scale);

    return {
      rashiSize: Math.max(baseRashiSize, sizeFloor),
      rashiPos: size * 0.13, // Keep horizontal position wide
      rashiBottom: size * 0.01, // Push even lower down closer to the bottom edge
      rashiFontSize: (Math.max(9.5 * scale, 8)) / fontScale,
      rashiLabelOffset: -16 * scale,
    };
  }, [size, scale, fontScale]);

  const rashiRadiusBottom = half * 0.89; // Tuned to perfectly hit the bottom dots
  const rashiRadiusTop = half * 0.94; // Pushed out a tiny bit more to hit the top dots

  const angleLeft = 135 * Math.PI / 180;
  const angleRight = 45 * Math.PI / 180;
  const angleTopLeft = 225 * Math.PI / 180;
  const angleTopRight = 315 * Math.PI / 180;

  const moonX = half + rashiRadiusBottom * Math.cos(angleLeft) - rashiSize / 2;
  const moonY = half + rashiRadiusBottom * Math.sin(angleLeft) - rashiSize / 2;

  const sunX = half + rashiRadiusBottom * Math.cos(angleRight) - rashiSize / 2;
  const sunY = half + rashiRadiusBottom * Math.sin(angleRight) - rashiSize / 2;

  const nakshatraX = half + rashiRadiusTop * Math.cos(angleTopLeft) - rashiSize / 2;
  const nakshatraY = half + rashiRadiusTop * Math.sin(angleTopLeft) - rashiSize / 2;

  const tithiX = half + rashiRadiusTop * Math.cos(angleTopRight) - rashiSize / 2;
  const tithiY = half + rashiRadiusTop * Math.sin(angleTopRight) - rashiSize / 2;

  // Build the 30 muhurta wedges as SVG paths.
  const wedges: { d: string; fill: string; key: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const startAng = (i / 30) * Math.PI * 2 - Math.PI / 2; // start at top
    const endAng = ((i + 1) / 30) * Math.PI * 2 - Math.PI / 2;
    wedges.push({
      key: i,
      d: arcWedge(half, half, ringInnerR, ringOuterR, startAng, endAng),
      fill: wedgeFill(i, state.muhurtaIndex),
    });
  }

  // Hand: rotation in degrees for the elapsed-time pointer.
  const handAngle = state.clockAngleDeg;

  // Format the hero digits as zero-padded.
  const mm = pad2(state.muhurtaInDay);
  const kk1 = pad2(state.kalaInMuhurta);
  const kk2 = pad2(state.kashthaInKala);
  const scaledSize = size * 1.60;
  const dialCropRatio = 1;
  const maskSize = scaledSize * dialCropRatio;
  const maskOffset = (size - maskSize) / 2;
  const imageOffset = (scaledSize - maskSize) / 2;

  // Video sizing — inner cutout is 65.5% of the frame diameter
  const videoSize = scaledSize * 0.655;
  const videoOffset = (maskSize - videoSize) / 2;
  const svgSize = size * 1.70;
  const svgHalf = svgSize / 2;
  const svgOffset = (svgSize - size) / 2;

  const r_inner_bottom = half * 1.16;
  const r_outer_bottom = half * 1.42;
  const r_text_bottom = half * 1.29;

  const r_inner_top = half * 1.22;
  const r_outer_top = half * 1.48;
  const r_text_top = half * 1.35;

  // Left side: centered at 135 degrees.
  const leftWedgeStart = 105 * Math.PI / 180;
  const leftWedgeEnd = 165 * Math.PI / 180;
  const leftTextStart = 165 * Math.PI / 180;
  const leftTextEnd = 105 * Math.PI / 180;

  // Right side: centered at 45 degrees.
  const rightWedgeStart = 15 * Math.PI / 180;
  const rightWedgeEnd = 75 * Math.PI / 180;
  const rightTextStart = 75 * Math.PI / 180;
  const rightTextEnd = 15 * Math.PI / 180;

  const topLeftWedgeStart = 195 * Math.PI / 180;
  const topLeftWedgeEnd = 255 * Math.PI / 180;

  const topRightWedgeStart = 285 * Math.PI / 180;
  const topRightWedgeEnd = 345 * Math.PI / 180;

  const leftArchWedge = arcWedge(svgHalf, svgHalf, r_inner_bottom, r_outer_bottom, leftWedgeStart, leftWedgeEnd);
  const rightArchWedge = arcWedge(svgHalf, svgHalf, r_inner_bottom, r_outer_bottom, rightWedgeStart, rightWedgeEnd);
  const topLeftArchWedge = arcWedge(svgHalf, svgHalf, r_inner_top, r_outer_top, topLeftWedgeStart, topLeftWedgeEnd);
  const topRightArchWedge = arcWedge(svgHalf, svgHalf, r_inner_top, r_outer_top, topRightWedgeStart, topRightWedgeEnd);

  // Use sweepFlag = 0 (counter-clockwise) to draw paths so text faces inward
  const leftTextPath = arcLine(svgHalf, svgHalf, r_text_bottom, leftTextStart, leftTextEnd, 0);
  const rightTextPath = arcLine(svgHalf, svgHalf, r_text_bottom, rightTextStart, rightTextEnd, 0);

  const leftTextCx = svgHalf + r_text_bottom * Math.cos(135 * Math.PI / 180);
  const leftTextCy = svgHalf + r_text_bottom * Math.sin(135 * Math.PI / 180);
  const rightTextCx = svgHalf + r_text_bottom * Math.cos(45 * Math.PI / 180);
  const rightTextCy = svgHalf + r_text_bottom * Math.sin(45 * Math.PI / 180);

  // Yoga progress arc calculations (centered at 90 degrees, spanning 105 to 75 degrees)
  const targetPercentage = Math.round(targetYogaFraction * 100);

  const yogaStartAngleDeg = 105;
  const yogaEndAngleDeg = 75;
  const yogaAngleSpan = yogaStartAngleDeg - yogaEndAngleDeg; // 30 degrees

  // Use target values for the label text and position
  const yogaLabelAngleDeg = yogaStartAngleDeg - targetYogaFraction * yogaAngleSpan;
  const yogaLabelAngleRad = yogaLabelAngleDeg * Math.PI / 180;

  const r_yoga_tick_start = r_text_bottom + 34 * scale;
  const r_yoga_tick_end = r_text_bottom + 48 * scale;
  const r_yoga_label = r_text_bottom + 66 * scale;

  const yogaTicks: { x1: number; y1: number; x2: number; y2: number; isActive: boolean; key: number }[] = [];
  for (let i = 0; i < 60; i++) {
    const angleDeg = yogaStartAngleDeg - (i / 59) * yogaAngleSpan;
    const angleRad = angleDeg * Math.PI / 180;
    yogaTicks.push({
      key: i,
      x1: svgHalf + r_yoga_tick_start * Math.cos(angleRad),
      y1: svgHalf + r_yoga_tick_start * Math.sin(angleRad),
      x2: svgHalf + r_yoga_tick_end * Math.cos(angleRad),
      y2: svgHalf + r_yoga_tick_end * Math.sin(angleRad),
      isActive: (i / 59) <= animYogaFraction,
    });
  }

  // Karana calculations (centered at 270 degrees, spanning 255 to 285 degrees)
  const karanaIsFixed = state.panchang.karana.isFixed;
  const karanaSubMeaning = karanaIsFixed ? 'स्थिर' : 'चर';

  // Tick line parameters
  const karanaStartAngleDeg = 252.5;
  const karanaEndAngleDeg = 287.5;
  const karanaAngleSpan = karanaEndAngleDeg - karanaStartAngleDeg; // 35 degrees
  const r_karana_tick_start = r_text_top + 34 * scale;
  const r_karana_tick_end = r_text_top + 48 * scale;
  const r_karana_label = r_text_top + 62 * scale;

  // 60 tick lines coordinates
  const karanaTicks: { x1: number; y1: number; x2: number; y2: number; isActive: boolean; key: number }[] = [];
  for (let i = 0; i < 60; i++) {
    const angleDeg = karanaStartAngleDeg + (i / 59) * karanaAngleSpan;
    const angleRad = angleDeg * Math.PI / 180;
    karanaTicks.push({
      key: i,
      x1: svgHalf + r_karana_tick_start * Math.cos(angleRad),
      y1: svgHalf + r_karana_tick_start * Math.sin(angleRad),
      x2: svgHalf + r_karana_tick_end * Math.cos(angleRad),
      y2: svgHalf + r_karana_tick_end * Math.sin(angleRad),
      isActive: (i + 1) <= animKaranaSlot,
    });
  }

  // Active tick position for the static label "32"
  const activeIndex = Math.max(0, Math.min(59, targetKaranaSlot - 1));
  const activeAngleDeg = karanaStartAngleDeg + (activeIndex / 59) * karanaAngleSpan;
  const activeAngleRad = activeAngleDeg * Math.PI / 180;
  const karanaLabelX = svgHalf + r_karana_label * Math.cos(activeAngleRad);
  const karanaLabelY = svgHalf + r_karana_label * Math.sin(activeAngleRad);

  const renderCurvedWords = (text: string, cx: number, cy: number, r: number, midAngleDeg: number, isTopHalf: boolean = false, showBg: boolean = false) => {
    const words = text.split(' ');

    // Accurately estimate visual width of Devanagari text
    const getVisualLength = (str: string) => {
      // 1. Strip matras and halants to get base characters
      const baseStr = str.replace(/[\u0901-\u0903\u093E-\u094C\u094E-\u0954\u0962\u0963\u094D]/g, '');
      // 2. Count halants (each halant merges two characters into one conjunct)
      const halants = (str.match(/\u094D/g) || []).length;
      // 3. Adjust for thin characters (colon)
      let len = baseStr.length - halants;
      len -= (str.match(/:/g) || []).length * 0.4;
      return Math.max(len, 0.1);
    };

    const spaceWidth = 0.7; // Visual width of a space character

    let visualTotalChars = 0;
    words.forEach((w, i) => {
      visualTotalChars += getVisualLength(w);
      if (i < words.length - 1) visualTotalChars += spaceWidth;
    });

    const degreesPerVisualChar = 3.6;
    const span = Math.min(Math.max(visualTotalChars * degreesPerVisualChar, 25), 65);

    const startAngleDeg = isTopHalf ? midAngleDeg - span / 2 : midAngleDeg + span / 2;
    const endAngleDeg = isTopHalf ? midAngleDeg + span / 2 : midAngleDeg - span / 2;

    let currentVisualIndex = 0;

    // Shift radius inwards for top-half arches to vertically center the text
    // because alignmentBaseline="middle" extends text outwards on the top half.
    const effectiveR = isTopHalf ? r - (15 * scale) : r;
    // Offset background to correctly overlap the text bounds on both top and bottom halves
    const bgRadius = effectiveR + (isTopHalf ? (6 * scale) : (-6 * scale));

    // Optional rounded black background behind text
    // Compute padding and sweep direction dynamically based on whether the angle is increasing or decreasing
    const isIncreasing = endAngleDeg > startAngleDeg;
    const padding = 1.5;
    const paddedStart = startAngleDeg + (isIncreasing ? -padding : padding);
    const paddedEnd = endAngleDeg + (isIncreasing ? padding : -padding);
    const sweep = isIncreasing ? 1 : 0;

    const bgPath = showBg
      ? arcLine(cx, cy, bgRadius, paddedStart * Math.PI / 180, paddedEnd * Math.PI / 180, sweep)
      : null;

    return (
      <G key={`${startAngleDeg}-${endAngleDeg}`}>
        {bgPath && (
          <Path
            d={bgPath}
            stroke="rgba(0,0,0,0.65)"
            strokeWidth={52 * scale}
            strokeLinecap="round"
            fill="none"
          />
        )}
        {words.map((word, i) => {
          const visualWordLen = getVisualLength(word);
          const centerVisualIndex = currentVisualIndex + visualWordLen / 2;
          const t = visualTotalChars > 0 ? centerVisualIndex / visualTotalChars : 0.5;

          const angleDeg = startAngleDeg + t * (endAngleDeg - startAngleDeg);
          const angleRad = angleDeg * Math.PI / 180;
          const x = cx + effectiveR * Math.cos(angleRad);
          const y = cy + effectiveR * Math.sin(angleRad);
          const rotation = isTopHalf ? angleDeg + 90 : angleDeg - 90;

          currentVisualIndex += visualWordLen + spaceWidth; // space width instead of 1
          return (
            <G key={i} x={x} y={y} rotation={rotation} origin="0, 0">
              <SvgText
                fill={colors.highlight}
                fontSize={32 * scale}
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {word}
              </SvgText>
            </G>
          );
        })}
      </G>
    );
  };

  return (
    <View style={[styles.wrapper, { width: size, height: size, transform: [{ translateY: 0 }] }]}>

      {/* Layer 1: Rotating Earth Video — circular-clipped behind the frame */}
      <View
        style={{
          position: 'absolute',
          width: videoSize,
          height: videoSize,
          left: maskOffset + videoOffset,
          top: maskOffset + videoOffset,
          borderRadius: videoSize / 2,
          overflow: 'hidden',
        }}
      >
        <VideoView
          player={earthPlayer}
          style={{ width: videoSize, height: videoSize }}
          contentFit="cover"
          nativeControls={false}
        />
      </View>

      {/* Layer 2: Frame Ring Overlay — transparent center lets video show through */}
      <View
        style={{
          position: 'absolute',
          width: maskSize,
          height: maskSize,
          left: maskOffset,
          top: maskOffset,
          borderRadius: maskSize / 2,
          overflow: 'hidden',
        }}
      >
        <Image
          source={FRAME_ONLY}
          style={{
            position: 'absolute',
            width: scaledSize,
            height: scaledSize,
            left: -imageOffset,
            top: -imageOffset,
          }}
          resizeMode="cover"
        />
      </View>

      <Svg
        width={svgSize}
        height={svgSize}
        style={{
          position: 'absolute',
          left: -svgOffset,
          top: -svgOffset,
        }}
        pointerEvents="none"
      >
        <Defs>
          <ClipPath id="clipLeft">
            <Path d={leftArchWedge} />
          </ClipPath>
          <ClipPath id="clipRight">
            <Path d={rightArchWedge} />
          </ClipPath>
          <ClipPath id="clipTopLeft">
            <Path d={topLeftArchWedge} />
          </ClipPath>
          <ClipPath id="clipTopRight">
            <Path d={topRightArchWedge} />
          </ClipPath>
          <Path id="pathTextLeft" d={leftTextPath} />
          <Path id="pathTextRight" d={rightTextPath} />
        </Defs>

        {/* Left Arch (Moon Rashi) */}

        {renderCurvedWords(`चन्द्र राशि : ${state.panchang.moonRashi.nameHi}`, svgHalf, svgHalf, r_text_bottom, 135, false, true)}

        {/* Bottom-Center Arch (Yoga) */}
        {renderCurvedWords(`योग : ${state.panchang.yoga.nameHi}`, svgHalf, svgHalf, r_text_bottom, 90, false, true)}

        {/* Yoga Progressive Bar */}
        {yogaTicks.map((tick) => (
          <Path
            key={tick.key}
            d={`M ${tick.x1} ${tick.y1} L ${tick.x2} ${tick.y2}`}
            stroke={tick.isActive ? colors.highlight : 'rgba(255, 255, 255, 0.5)'}
            strokeWidth={1.2 * scale}
          />
        ))}

        {/* Yoga Percentage Label */}
        <G
          x={svgHalf + r_yoga_label * Math.cos(yogaLabelAngleRad)}
          y={svgHalf + r_yoga_label * Math.sin(yogaLabelAngleRad)}
        >
          <SvgText
            fill={colors.highlight}
            fontSize={22 * scale}
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {`${targetPercentage}/100`}
          </SvgText>
        </G>

        {/* Right Arch (Sun Rashi) */}

        {renderCurvedWords(`सूर्य राशि : ${state.panchang.sunRashi.nameHi}`, svgHalf, svgHalf, r_text_bottom, 45, false, true)}

        {/* Top-Left Arch (Nakshatra) */}

        {renderCurvedWords(`नक्षत्र : ${state.panchang.nakshatra.nameHi}`, svgHalf, svgHalf, r_text_top, 225, true, true)}

        {/* Top-Center Arch (Karana) */}
        {renderCurvedWords(`करण : ${state.panchang.karana.nameHi}`, svgHalf, svgHalf, r_text_top + 10 * scale, 270, true, true)}

        {karanaTicks.map((tick) => (
          <Path
            key={tick.key}
            d={`M ${tick.x1} ${tick.y1} L ${tick.x2} ${tick.y2}`}
            stroke={tick.isActive ? colors.highlight : 'rgba(255, 255, 255, 0.5)'}
            strokeWidth={1.2 * scale}
          />
        ))}

        {/* Karana Active Slot Label */}
        <G
          x={karanaLabelX}
          y={karanaLabelY}
        >
          <SvgText
            fill={colors.highlight}
            fontSize={22 * scale}
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {`${targetKaranaSlot}/60`}
          </SvgText>
        </G>

        {/* Top-Right Arch (Tithi) */}

        {/* Top-Right Text (Tithi) */}
        {renderCurvedWords(`तिथि : ${state.panchang.tithi.nameHi}`, svgHalf, svgHalf, r_text_top, 315, true, true)}
      </Svg>



      <View
        style={[
          styles.digits,
          {
            transform: [{ translateY: -18 * scale }, { translateX: 0 }],
            width: ringInnerR * 2 * 1.12,
            height: ringInnerR * 2 * 1.12,
            borderRadius: (ringInnerR * 2 * 1.12) / 2,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderWidth: 1 * scale,
            borderColor: 'rgba(184, 134, 11, 0.4)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 * scale },
            shadowOpacity: 0.4,
            shadowRadius: 5 * scale,
          }
        ]}
        pointerEvents="none"
      >
        <View style={{ transform: [{ translateY: 44 * scale }], alignItems: 'center' }}>
          <View style={[styles.digitsRow, { alignItems: 'flex-start' }]}>
            <View style={{ alignItems: 'center' }}>
              <HeroDigits text={mm} scale={scale * 1.15} />
              <Text style={[styles.rashiLabel, { fontSize: 24 * scale, marginTop: 6 * scale, letterSpacing: 1 * scale }]}>मुहूर्त</Text>
            </View>
            <Image source={require('../../assets/numbers/colon.png')} style={{ height: 112 * scale, width: 34 * scale, resizeMode: 'contain', marginHorizontal: -2 * scale }} />
            <View style={{ alignItems: 'center' }}>
              <HeroDigits text={kk1} scale={scale * 1.15} />
              <Text style={[styles.rashiLabel, { fontSize: 24 * scale, marginTop: 6 * scale, letterSpacing: 1 * scale }]}>कला</Text>
            </View>
            <Image source={require('../../assets/numbers/colon.png')} style={{ height: 112 * scale, width: 34 * scale, resizeMode: 'contain', marginHorizontal: -2 * scale }} />
            <View style={{ alignItems: 'center' }}>
              <HeroDigits text={kk2} scale={scale * 1.15} />
              <Text style={[styles.rashiLabel, { fontSize: 24 * scale, marginTop: 6 * scale, letterSpacing: 1 * scale }]}>काष्ठा</Text>
            </View>
          </View>
          <Text
            style={[
              styles.rashiLabel,
              {
                fontSize: 24 * scale,
                marginTop: 24 * scale,
                letterSpacing: 1 * scale,
              }
            ]}
            numberOfLines={1}
          >
            देवता : {DEITY_HI[state.muhurta.deity] || state.muhurta.deity}
          </Text>
        </View>
      </View>

      {/* Floating Icons */}
      <View style={[styles.rashiFloatingContainer, { left: moonX, top: moonY, width: rashiSize, height: rashiSize }]}>
        <AnimatedIcon index={state.panchang.moonRashi.index} size={rashiSize} scale={scale} icons={RASHI_ICONS} />
      </View>

      <View style={[styles.rashiFloatingContainer, { left: sunX, top: sunY, width: rashiSize, height: rashiSize }]}>
        <AnimatedIcon index={state.panchang.sunRashi.index} size={rashiSize} scale={scale} icons={RASHI_ICONS} />
      </View>

      <View style={[styles.rashiFloatingContainer, { left: nakshatraX, top: nakshatraY, width: rashiSize, height: rashiSize }]}>
        <AnimatedIcon index={state.panchang.nakshatra.index} size={rashiSize} scale={scale} icons={NAKSHATRA_ICONS} />
      </View>

      <View style={[styles.rashiFloatingContainer, { left: tithiX, top: tithiY, width: rashiSize, height: rashiSize }]}>
        <AnimatedIcon index={state.panchang.tithi.index} size={rashiSize} scale={scale} icons={TITHI_ICONS} />
      </View>

    </View>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────

const DEITY_HI: Record<string, string> = {
  'Rudra': 'रुद्र',
  'Sarpa': 'सर्प',
  'Mitra': 'मित्र',
  'Pitrs': 'पितृ',
  'Ashtavasus': 'अष्टवसु',
  'Varaha': 'वराह',
  'Vishvedevas': 'विश्वेदेव',
  'Brahma': 'ब्रह्मा',
  'Indra': 'इन्द्र',
  'Agni': 'अग्नि',
  'Nishachara': 'निशाचर',
  'Varuna': 'वरुण',
  'Aryaman': 'अर्यमा',
  'Bhaga': 'भग',
  'Shiva': 'शिव',
  'Aja Ekapada': 'अज एकपाद',
  'Ahirbudhnya': 'अहिर्बुध्न्य',
  'Pushan': 'पूषा',
  'Ashvins': 'अश्विनीकुमार',
  'Yama': 'यम',
  'Chandra': 'चन्द्र',
  'Aditi': 'अदिति',
  'Brihaspati': 'बृहस्पति',
  'Vishnu': 'विष्णु',
  'Surya': 'सूर्य',
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function wedgeFill(wedgeIdx: number, activeIdx: number): string {
  const m = MUHURTAS[wedgeIdx];
  const base = m.nature === 'shubha' ? colors.shubha : colors.ashubha;
  const isActive = wedgeIdx === activeIdx;

  // Mix hex into rgba for translucency over brass texture.
  const clean = base.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  const alpha = isActive ? 0.5 : 0.08;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Mute a hex colour by mixing with the bgDeep, returning an rgba. */
function muteHex(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Build an SVG path for a ring-sector wedge (annulus slice) from inner
 * radius `r1` to outer radius `r2`, spanning angles [a1, a2] in radians.
 */
function arcWedge(cx: number, cy: number, r1: number, r2: number, a1: number, a2: number): string {
  const p1 = polar(cx, cy, r2, a1);
  const p2 = polar(cx, cy, r2, a2);
  const p3 = polar(cx, cy, r1, a2);
  const p4 = polar(cx, cy, r1, a1);
  const rc = (r2 - r1) / 2;
  const largeArc = Math.abs(a2 - a1) > Math.PI ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${r2} ${r2} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `A ${rc} ${rc} 0 0 1 ${p3.x} ${p3.y}`,
    `A ${r1} ${r1} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    `A ${rc} ${rc} 0 0 1 ${p1.x} ${p1.y}`,
    'Z',
  ].join(' ');
}

/**
 * Build an SVG open path arc at radius `r` spanning angles [a1, a2] in radians.
 */
function arcLine(cx: number, cy: number, r: number, a1: number, a2: number, sweepFlag: number = 1): string {
  const p1 = polar(cx, cy, r, a1);
  const p2 = polar(cx, cy, r, a2);
  const largeArc = Math.abs(a2 - a1) > Math.PI ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${p2.x} ${p2.y}`;
}


function polar(cx: number, cy: number, r: number, ang: number): { x: number; y: number } {
  return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  archTop: {
    position: 'absolute',
    top: -10,
    left: 0,
  },
  archBottom: {
    position: 'absolute',
    bottom: -10,
    left: 0,
  },
  digits: {
    position: 'absolute',
    alignItems: 'center',
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colon: {
    color: '#d2830db6',
    fontSize: 40,
    fontWeight: '800',
    marginHorizontal: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  digitsCaption: {
    color: colors.inkMuted,
    fontSize: 9,
    letterSpacing: 2.5,
    marginTop: 2,
  },
  muhurtaName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  muhurtaDeity: {
    color: colors.giltLight,
    marginTop: 2,
    letterSpacing: 0.8,
  },
  rashiFloatingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rashiFloatingBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  rashiFloatingIcon: {
    width: '70%',
    height: '70%',
    opacity: 1,
  },
  rashiLabelWrapper: {
    position: 'absolute',
    width: '200%', // Allow text to expand beyond icon width
    alignItems: 'center',
    justifyContent: 'center',
  },
  rashiLabel: {
    color: colors.highlight,
    fontWeight: '800', // Heavy weight for 10ft viewing
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
});
