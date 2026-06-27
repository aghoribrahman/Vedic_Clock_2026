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
import { StyleSheet, Text, View, PixelRatio, Animated, Image } from 'react-native';
import { Earth3D } from './Earth3D';
import Svg, { Circle, G, Path, Defs, ClipPath, Text as SvgText, TextPath, Image as SvgImage } from 'react-native-svg';
import { MUHURTAS } from '../data/muhurtas';
import { VedicClockState } from '../models';
import { colors } from '../theme';
import { GiltArch } from './GiltArch';
import { EngravedText } from './EngravedText';
const AnimatedG = Animated.createAnimatedComponent(G);
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
const CORNER_ASSET = require('../../assets/images/corner_assest.png');

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

  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
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

  const targetKaranaSlot = state.panchang?.karana?.slot ?? 0;
  const targetYogaFraction = state.panchang?.yoga?.progressFraction ?? 0;

  const glowAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [glowAnim]);

  // Scale factor for text and spacing (normalized to size 600)
  const scale = size / 600;
  const fontScale = PixelRatio.getFontScale();

  // Responsive Rashi sizing — refined for fluid adaptation
  const rashiSize = useMemo(() => {
    // Non-linear scaling for better balance across device classes
    const baseRashiSize = size * 0.22;
    const sizeFloor = 52 * Math.sqrt(scale);
    return Math.max(baseRashiSize, sizeFloor);
  }, [size, scale]);

  // ── Tuning Values for Frame Cutouts ──
  // These control the exact X/Y offset from the center of the dial for the 4 circular golden cutouts.
  const frameOffsetY = 10 * scale;
  const frameCenterY = half + (4 * scale); // Found the exact vertical midpoint

  const topCutoutX = half * 0.748; // Perfect
  const topCutoutY = half * 0.620; // Perfect

  const bottomCutoutX = half * 0.747; // Pushed outwards slightly
  const bottomCutoutY = half * 0.537; // Perfect

  // Nakshatra (Top-Left Cutout)
  const rashiBgSize = rashiSize * 0.999; // Shrunk slightly to fit within the golden rims
  const nakshatraX = half - topCutoutX - rashiBgSize / 2;
  const nakshatraY = frameCenterY - topCutoutY - rashiBgSize / 2;

  // Tithi (Top-Right Cutout)
  const tithiX = half + topCutoutX - rashiBgSize / 2;
  const tithiY = frameCenterY - topCutoutY - rashiBgSize / 2;

  // Chandra Rashi / Moon (Bottom-Left Cutout)
  const moonX = half - bottomCutoutX - rashiBgSize / 2;
  const moonY = frameCenterY + bottomCutoutY - rashiBgSize / 2;

  // Surya Rashi / Sun (Bottom-Right Cutout)
  const sunX = half + bottomCutoutX - rashiBgSize / 2;
  const sunY = frameCenterY + bottomCutoutY - rashiBgSize / 2;

  const formatTimeIst = (d?: Date) => d ? d.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit'
  }) : '';
  const sunriseStr = formatTimeIst(state.sunriseUtc);
  const sunsetStr = formatTimeIst(state.sunsetUtc);

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
  const svgSize = size * 2.00;
  const svgHalf = svgSize / 2;
  const svgOffset = (svgSize - size) / 2;

  // ── Unified arch layout config ──────────────────────────────────
  const ARCH_BUDGET_DEG = 40;       // uniform angular budget for all 6 arches (+10% from 36°)
  const HALF_BUDGET = ARCH_BUDGET_DEG / 2; // 20° from center to edge

  // Bottom half radii (shifted closer to center dial)
  const r_inner_bottom = half * 1.16;
  const r_outer_bottom = half * 1.40;
  const r_text_bottom = half * 1.28;

  // Top half radii (shifted closer to center dial)
  const r_inner_top = half * 1.22;
  const r_outer_top = half * 1.46;
  const r_text_top = half * 1.34;

  // Bottom-left: centered at 135° (Chandra Rashi). 135 ± 20 = 115°–155°
  const leftWedgeStart = 115 * Math.PI / 180;
  const leftWedgeEnd = 155 * Math.PI / 180;
  const leftTextStart = 155 * Math.PI / 180;
  const leftTextEnd = 115 * Math.PI / 180;

  // Bottom-right: centered at 45° (Surya Rashi). 45 ± 20 = 25°–65°
  const rightWedgeStart = 25 * Math.PI / 180;
  const rightWedgeEnd = 65 * Math.PI / 180;
  const rightTextStart = 65 * Math.PI / 180;
  const rightTextEnd = 25 * Math.PI / 180;

  // Top-left: centered at 225° (Nakshatra). 225 ± 20 = 205°–245°
  const topLeftWedgeStart = 205 * Math.PI / 180;
  const topLeftWedgeEnd = 245 * Math.PI / 180;

  // Top-right: centered at 315° (Tithi). 315 ± 20 = 295°–335°
  const topRightWedgeStart = 295 * Math.PI / 180;
  const topRightWedgeEnd = 335 * Math.PI / 180;

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

  // Yoga progress arc (centered at 90°, same 40° budget). 90 ± 20 = 70°–110°
  const targetPercentage = Math.round(targetYogaFraction * 100);

  const yogaStartAngleDeg = 110;    // 90 + 20
  const yogaEndAngleDeg = 70;       // 90 - 20
  const yogaAngleSpan = yogaStartAngleDeg - yogaEndAngleDeg; // 40 degrees

  // Use target values for the label text and position
  const yogaLabelAngleDeg = yogaStartAngleDeg - targetYogaFraction * yogaAngleSpan;
  const yogaLabelAngleRad = yogaLabelAngleDeg * Math.PI / 180;

  const r_yoga_tick_start = r_text_bottom + 30 * scale;
  const r_yoga_tick_end = r_text_bottom + 44 * scale;
  const r_yoga_label = r_text_bottom + 62 * scale;

  const r_yoga_mid = (r_yoga_tick_start + r_yoga_tick_end) / 2;
  const yogaTicks: { cx: number; cy: number; rotation: number; isActive: boolean; isCurrent: boolean; key: number }[] = [];
  const currentYogaIndex = Math.max(0, Math.min(59, Math.floor(targetYogaFraction * 60)));
  for (let i = 0; i < 60; i++) {
    const angleDeg = yogaStartAngleDeg - (i / 59) * yogaAngleSpan;
    const angleRad = angleDeg * Math.PI / 180;
    yogaTicks.push({
      key: i,
      cx: svgHalf + r_yoga_mid * Math.cos(angleRad),
      cy: svgHalf + r_yoga_mid * Math.sin(angleRad),
      rotation: angleDeg + 90,
      isActive: i <= currentYogaIndex,
      isCurrent: i === currentYogaIndex,
    });
  }

  // Karana calculations (centered at 270°, same 40° budget). 270 ± 20 = 250°–290°
  const karanaIsFixed = state.panchang?.karana?.isFixed ?? false;
  const karanaSubMeaning = karanaIsFixed ? 'स्थिर' : 'चर';

  // Tick line parameters — equal 40° span matching all other arches
  const karanaStartAngleDeg = 250;  // 270 - 20
  const karanaEndAngleDeg = 290;    // 270 + 20
  const karanaAngleSpan = karanaEndAngleDeg - karanaStartAngleDeg; // 40 degrees
  const r_karana_tick_start = r_text_top + 30 * scale;
  const r_karana_tick_end = r_text_top + 44 * scale;
  const r_karana_label = r_text_top + 58 * scale;

  // 60 tick lines coordinates
  const r_karana_mid = (r_karana_tick_start + r_karana_tick_end) / 2;
  const karanaTicks: { cx: number; cy: number; rotation: number; isActive: boolean; isCurrent: boolean; key: number }[] = [];
  const currentKaranaIndex = Math.max(0, Math.min(59, targetKaranaSlot - 1));
  for (let i = 0; i < 60; i++) {
    const angleDeg = karanaStartAngleDeg + (i / 59) * karanaAngleSpan;
    const angleRad = angleDeg * Math.PI / 180;
    karanaTicks.push({
      key: i,
      cx: svgHalf + r_karana_mid * Math.cos(angleRad),
      cy: svgHalf + r_karana_mid * Math.sin(angleRad),
      rotation: angleDeg + 90,
      isActive: i <= currentKaranaIndex,
      isCurrent: i === currentKaranaIndex,
    });
  }

  // Active tick position for the static label "32"
  const activeIndex = Math.max(0, Math.min(59, targetKaranaSlot - 1));
  const activeAngleDeg = karanaStartAngleDeg + (activeIndex / 59) * karanaAngleSpan;
  const activeAngleRad = activeAngleDeg * Math.PI / 180;
  const karanaLabelX = svgHalf + r_karana_label * Math.cos(activeAngleRad);
  const karanaLabelY = svgHalf + r_karana_label * Math.sin(activeAngleRad);

  const renderCurvedWords = (text: string, cx: number, cy: number, r: number, midAngleDeg: number, isTopHalf: boolean = false, showBg: boolean = false, fontSizeOverride?: number, maxSpanDeg?: number) => {
    // 1. Calculate approximate visual span for the background track
    const getVisualLength = (str: string) => {
      const baseStr = str.replace(/[\u0901-\u0903\u093E-\u094C\u094E-\u0954\u0962\u0963\u094D]/g, '');
      const halants = (str.match(/\u094D/g) || []).length;
      let len = baseStr.length - halants;
      len -= (str.match(/:/g) || []).length * 0.4;
      return Math.max(len, 0.1);
    };

    const words = text.split(' ');
    const spaceWidth = 0.7;
    let visualTotalChars = 0;
    const wordPositions: number[] = [];

    let currentVisualIndex = 0;
    words.forEach((w) => {
      const visualWordLen = getVisualLength(w);
      wordPositions.push(currentVisualIndex + visualWordLen / 2);
      currentVisualIndex += visualWordLen + spaceWidth;
    });
    visualTotalChars = currentVisualIndex - spaceWidth;

    const degreesPerVisualChar = 2.8;
    const paddingDegrees = 4;
    const budgetDeg = maxSpanDeg ?? 50;
    const span = Math.min(visualTotalChars * degreesPerVisualChar + paddingDegrees, budgetDeg);

    // Shift radius inwards for top-half arches to vertically center the text
    const effectiveR = isTopHalf ? r - (15 * scale) : r;

    // Background path calculation
    const startAngleDeg = isTopHalf ? midAngleDeg - span / 2 : midAngleDeg + span / 2;
    const endAngleDeg = isTopHalf ? midAngleDeg + span / 2 : midAngleDeg - span / 2;
    const bgRadius = effectiveR + (isTopHalf ? (6 * scale) : (-6 * scale));
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
            strokeWidth={37 * scale}
            strokeLinecap="round"
            fill="none"
          />
        )}
        {words.map((word, i) => {
          const centerVisualIndex = wordPositions ? wordPositions[i] : 0;
          const t = visualTotalChars > 0 ? centerVisualIndex / visualTotalChars : 0.5;

          const angleDeg = startAngleDeg + t * (endAngleDeg - startAngleDeg);
          const angleRad = angleDeg * Math.PI / 180;
          const x = cx + effectiveR * Math.cos(angleRad);
          const y = cy + effectiveR * Math.sin(angleRad);
          const rotation = isTopHalf ? angleDeg + 90 : angleDeg - 90;

          return (
            <G key={i} x={x} y={y} rotation={rotation} origin="0, 0">
              <SvgText
                fill={colors.highlight}
                fontSize={fontSizeOverride || 26 * scale}
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

      {/* Layer 1: 3D Earth — circular-clipped behind the frame */}

      <View
        style={{
          position: 'absolute',
          width: videoSize,
          height: videoSize,
          left: maskOffset + videoOffset,
          top: maskOffset + videoOffset,
          borderRadius: videoSize / 2,
          overflow: 'hidden',
          backgroundColor: '#000', // Black background for space behind the earth
        }}
      >
        <Earth3D size={videoSize} />
      </View>

      {/* Layer 2: Full UI Frame Overlay */}
      {(() => {
        const frameScale = 1.0; // Increased to make the frame larger relative to the dial
        const frameOffsetY = 10 * scale; // Scales with dial size
        const frameW = scaledSize * (2528 / 1696) * frameScale;
        const frameH = scaledSize * frameScale;
        return (
          <Image
            source={FRAME_ONLY}
            style={{
              position: 'absolute',
              width: frameW,
              height: frameH,
              left: (size - frameW) / 2,
              top: (size - frameH) / 2 + frameOffsetY,
            }}
            resizeMode="contain"
          />
        );
      })()}

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

        {renderCurvedWords(`चन्द्र राशि : ${state.panchang?.moonRashi?.nameHi ?? ''}`, svgHalf, svgHalf, r_text_bottom, 135, false, true, undefined, ARCH_BUDGET_DEG)}

        {/* Bottom-Center Arch (Yoga) */}
        {renderCurvedWords(`योग : ${state.panchang?.yoga?.nameHi ?? ''}`, svgHalf, svgHalf, r_text_bottom, 90, false, true, undefined, ARCH_BUDGET_DEG)}

        {/* Yoga Progressive Bar */}
        {yogaTicks.map((tick) => {
          const Node = tick.isCurrent ? AnimatedG : G;
          return (
            <Node key={tick.key} x={tick.cx} y={tick.cy} rotation={tick.rotation} origin="0, 0" opacity={tick.isCurrent ? glowAnim : 1}>
              <Path
                d={`M 0 ${7 * scale} C ${-3.5 * scale} ${1.4 * scale}, ${-4.2 * scale} ${-4.2 * scale}, 0 ${-7 * scale} C ${4.2 * scale} ${-4.2 * scale}, ${3.5 * scale} ${1.4 * scale}, 0 ${7 * scale} Z`}
                fill={tick.isActive ? '#FF9933' : 'rgba(255, 255, 255, 0.1)'}
                stroke={tick.isActive ? '#FFD700' : 'rgba(255, 255, 255, 0.2)'}
                strokeWidth={0.8 * scale}
              />
            </Node>
          );
        })}

        {/* Yoga Percentage Label */}
        {renderCurvedWords(`${targetPercentage}/100`, svgHalf, svgHalf, r_yoga_label, yogaLabelAngleDeg, false, false, 20 * scale)}

        {/* Right Arch (Sun Rashi) */}

        {renderCurvedWords(`सूर्य राशि : ${state.panchang?.sunRashi?.nameHi ?? ''}`, svgHalf, svgHalf, r_text_bottom, 45, false, true, undefined, ARCH_BUDGET_DEG)}

        {/* Top-Left Arch (Nakshatra) */}

        {renderCurvedWords(`नक्षत्र : ${state.panchang?.nakshatra?.nameHi ?? ''}`, svgHalf, svgHalf, r_text_top, 225, true, true, undefined, ARCH_BUDGET_DEG)}

        {/* Karana (Top-Center) */}
        {renderCurvedWords(`करण : ${state.panchang?.karana?.nameHi ?? ''}`, svgHalf, svgHalf, r_text_top, 270, true, true, undefined, ARCH_BUDGET_DEG)}

        {karanaTicks.map((tick) => {
          const Node = tick.isCurrent ? AnimatedG : G;
          return (
            <Node key={tick.key} x={tick.cx} y={tick.cy} rotation={tick.rotation} origin="0, 0" opacity={tick.isCurrent ? glowAnim : 1}>
              <Path
                d={`M 0 ${7 * scale} C ${-3.5 * scale} ${1.4 * scale}, ${-4.2 * scale} ${-4.2 * scale}, 0 ${-7 * scale} C ${4.2 * scale} ${-4.2 * scale}, ${3.5 * scale} ${1.4 * scale}, 0 ${7 * scale} Z`}
                fill={tick.isActive ? '#FF9933' : 'rgba(255, 255, 255, 0.1)'}
                stroke={tick.isActive ? '#FFD700' : 'rgba(255, 255, 255, 0.2)'}
                strokeWidth={0.8 * scale}
              />
            </Node>
          );
        })}

        {/* Karana Active Slot Label */}
        {renderCurvedWords(`${targetKaranaSlot}/60`, svgHalf, svgHalf, r_karana_label + (15 * scale), activeAngleDeg, true, false, 20 * scale)}

        {/* Top-Right Arch (Tithi) */}

        {/* Top-Right Text (Tithi) */}
        {renderCurvedWords(`तिथि : ${state.panchang?.tithi?.nameHi ?? ''}`, svgHalf, svgHalf, r_text_top, 315, true, true, undefined, ARCH_BUDGET_DEG)}

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
            backgroundColor: 'transparent',
            // Border and shadow removed to keep globe unfiltered
          }
        ]}
        pointerEvents="none"
      >
        <View style={{ transform: [{ translateY: 44 * scale }], alignItems: 'center' }}>
          <View style={[styles.digitsRow, { alignItems: 'flex-start' }]}>
            <View style={{ alignItems: 'center' }}>
              <HeroDigits text={mm} scale={scale * 0.65} />
              <Text style={[styles.rashiLabel, { fontSize: 24 * scale, marginTop: 6 * scale, letterSpacing: 1 * scale }]}>मुहूर्त</Text>
            </View>
            <Image source={require('../../assets/numbers/colon.png')} style={{ height: 72 * scale, width: 28 * scale, resizeMode: 'contain', marginHorizontal: 0 }} />
            <View style={{ alignItems: 'center' }}>
              <HeroDigits text={kk1} scale={scale * 0.65} />
              <Text style={[styles.rashiLabel, { fontSize: 24 * scale, marginTop: 6 * scale, letterSpacing: 1 * scale }]}>कला</Text>
            </View>
            <Image source={require('../../assets/numbers/colon.png')} style={{ height: 72 * scale, width: 28 * scale, resizeMode: 'contain', marginHorizontal: 0 }} />
            <View style={{ alignItems: 'center' }}>
              <HeroDigits text={kk2} scale={scale * 0.65} />
              <Text style={[styles.rashiLabel, { fontSize: 24 * scale, marginTop: 6 * scale, letterSpacing: 1 * scale }]}>काष्ठा</Text>
            </View>
          </View>
          <Text
            style={[
              styles.rashiLabel,
              {
                fontSize: 24 * scale,
                marginTop: 16 * scale,
                letterSpacing: 1 * scale,
              }
            ]}
            numberOfLines={1}
          >
            {state.muhurta?.devanagari ?? ''} · {state.muhurta?.name ?? ''}
          </Text>
          <Text
            style={[
              styles.rashiLabel,
              {
                fontSize: 24 * scale,
                marginTop: 8 * scale,
                letterSpacing: 1 * scale,
              }
            ]}
            numberOfLines={1}
          >
            देवता : {state.muhurta ? (DEITY_HI[state.muhurta.deity] || state.muhurta.deity) : ''}
          </Text>
        </View>
      </View>

      {/* Floating Icons */}
      <View style={[styles.rashiFloatingContainer, { left: moonX, top: moonY, width: rashiBgSize, height: rashiBgSize }]}>
        <AnimatedIcon index={state.panchang?.moonRashi?.index ?? 0} size={rashiSize} scale={scale} icons={RASHI_ICONS} />
      </View>

      <View style={[styles.rashiFloatingContainer, { left: sunX, top: sunY, width: rashiBgSize, height: rashiBgSize }]}>
        <AnimatedIcon index={state.panchang?.sunRashi?.index ?? 0} size={rashiSize} scale={scale} icons={RASHI_ICONS} />
      </View>

      <View style={[styles.rashiFloatingContainer, { left: nakshatraX, top: nakshatraY, width: rashiBgSize, height: rashiBgSize }]}>
        <AnimatedIcon index={state.panchang?.nakshatra?.index ?? 0} size={rashiSize} scale={scale} icons={NAKSHATRA_ICONS} />
      </View>

      <View style={[styles.rashiFloatingContainer, { left: tithiX, top: tithiY, width: rashiBgSize, height: rashiBgSize }]}>
        <AnimatedIcon index={state.panchang?.tithi?.index ?? 0} size={rashiSize} scale={scale} icons={TITHI_ICONS} />
      </View>

      {/* ── Capsule Text Overlays ── */}
      {(() => {
        const frameOffsetY = -5 * scale;
        const capsuleOffset = size * 0.72; // Increased multiplier to push the text blocks further outward
        const capWidth = 180 * scale;
        const capHeight = 120 * scale;
        const capTop = half - (capHeight / 2) + frameOffsetY + 12 * scale; // Nudged downwards a hair

        return (
          <>
            {/* Sunset (Left Capsule, 9 o'clock) */}
            <View style={{
              position: 'absolute',
              left: half - capsuleOffset - (capWidth / 2),
              top: capTop,
              width: capWidth,
              height: capHeight,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <EngravedText text={sunsetStr} fontSize={28 * scale} />
              <Text style={{
                color: colors.highlight,
                fontWeight: '800',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                textShadowColor: 'rgba(0, 0, 0, 0.85)',
                textShadowOffset: { width: 0, height: 1.5 },
                textShadowRadius: 3,
                fontSize: 20 * scale,
                marginTop: 6 * scale,
                marginBottom: 6 * scale
              }} numberOfLines={1}>
                सूर्यास्त
              </Text>
            </View>

            {/* Sunrise (Right Capsule, 3 o'clock) */}
            <View style={{
              position: 'absolute',
              left: half + capsuleOffset - (capWidth / 2),
              top: capTop,
              width: capWidth,
              height: capHeight,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <EngravedText text={sunriseStr} fontSize={28 * scale} />
              <Text style={{
                color: colors.highlight,
                fontWeight: '800',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                textShadowColor: 'rgba(0, 0, 0, 0.85)',
                textShadowOffset: { width: 0, height: 1.5 },
                textShadowRadius: 3,
                fontSize: 20 * scale,
                marginTop: 6 * scale,
                marginBottom: 6 * scale
              }} numberOfLines={1}>
                सूर्योदय
              </Text>
            </View>
          </>
        );
      })()}

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
    backgroundColor: '#000000',
    borderRadius: 5000,
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
