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
import { StyleSheet, Text, View, Animated, Image } from 'react-native';
import { Earth3D } from './Earth3D';
import Svg, { Circle, G, Path, Defs, ClipPath, Text as SvgText, TextPath, Image as SvgImage } from 'react-native-svg';
import { VedicClockState } from '../models';
import { colors } from '../theme';
import { EngravedText } from './EngravedText';
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

interface CurvedWordsProps {
  text: string;
  cx: number;
  cy: number;
  radius: number;
  midAngleDeg: number;
  scale: number;
  isTopHalf?: boolean;
  showBg?: boolean;
  fontSize?: number;
  maxSpanDeg?: number;
}

const CurvedWords = React.memo(function CurvedWords({
  text,
  cx,
  cy,
  radius,
  midAngleDeg,
  scale,
  isTopHalf = false,
  showBg = false,
  fontSize,
  maxSpanDeg,
}: CurvedWordsProps): React.JSX.Element {
  const getVisualLength = (str: string) => {
    const baseStr = str.replace(/[\u0901-\u0903\u093E-\u094C\u094E-\u0954\u0962\u0963\u094D]/g, '');
    const halants = (str.match(/\u094D/g) || []).length;
    let len = baseStr.length - halants;
    len -= (str.match(/:/g) || []).length * 0.4;
    return Math.max(len, 0.1);
  };

  const words = text.split(' ');
  const wordPositions: number[] = [];
  let visualTotalChars = 0;
  let currentVisualIndex = 0;
  words.forEach((word) => {
    const visualWordLen = getVisualLength(word);
    wordPositions.push(currentVisualIndex + visualWordLen / 2);
    currentVisualIndex += visualWordLen + 0.7;
  });
  visualTotalChars = currentVisualIndex - 0.7;

  const span = Math.min(visualTotalChars * 2.8 + 4, maxSpanDeg ?? 50);
  const effectiveR = isTopHalf ? radius - 15 * scale : radius;
  const startAngleDeg = isTopHalf ? midAngleDeg - span / 2 : midAngleDeg + span / 2;
  const endAngleDeg = isTopHalf ? midAngleDeg + span / 2 : midAngleDeg - span / 2;
  const bgRadius = effectiveR + (isTopHalf ? 6 * scale : -6 * scale);
  const isIncreasing = endAngleDeg > startAngleDeg;
  const paddedStart = startAngleDeg + (isIncreasing ? -1.5 : 1.5);
  const paddedEnd = endAngleDeg + (isIncreasing ? 1.5 : -1.5);
  const bgPath = showBg
    ? arcLine(cx, cy, bgRadius, paddedStart * Math.PI / 180, paddedEnd * Math.PI / 180, isIncreasing ? 1 : 0)
    : null;

  return (
    <G>
      {bgPath && (
        <Path
          d={bgPath}
          stroke="rgba(0,0,0,0.65)"
          strokeWidth={37 * scale}
          strokeLinecap="round"
          fill="none"
        />
      )}
      {words.map((word, index) => {
        const t = visualTotalChars > 0 ? wordPositions[index] / visualTotalChars : 0.5;
        const angleDeg = startAngleDeg + t * (endAngleDeg - startAngleDeg);
        const angleRad = angleDeg * Math.PI / 180;
        const x = cx + effectiveR * Math.cos(angleRad);
        const y = cy + effectiveR * Math.sin(angleRad);
        const rotation = isTopHalf ? angleDeg + 90 : angleDeg - 90;

        return (
          <G key={index} x={x} y={y} rotation={rotation} origin="0, 0">
            <SvgText
              fill={colors.highlight}
              fontSize={fontSize ?? 26 * scale}
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
});

interface ProgressTickRingProps {
  center: number;
  radius: number;
  startAngleDeg: number;
  angleSpanDeg: number;
  currentIndex: number;
  scale: number;
  reverse?: boolean;
}

const ProgressTickRing = React.memo(function ProgressTickRing({
  center,
  radius,
  startAngleDeg,
  angleSpanDeg,
  currentIndex,
  scale,
  reverse = false,
}: ProgressTickRingProps): React.JSX.Element {
  const ticks = useMemo(
    () => Array.from({ length: 60 }, (_, index) => {
      const progress = index / 59;
      const angleDeg = startAngleDeg + (reverse ? -progress : progress) * angleSpanDeg;
      const angleRad = angleDeg * Math.PI / 180;
      return {
        index,
        cx: center + radius * Math.cos(angleRad),
        cy: center + radius * Math.sin(angleRad),
        rotation: angleDeg + 90,
      };
    }),
    [center, radius, startAngleDeg, angleSpanDeg, reverse],
  );

  return (
    <>
      {ticks.map((tick) => {
        const isActive = tick.index <= currentIndex;
        return (
          <G
            key={tick.index}
            x={tick.cx}
            y={tick.cy}
            rotation={tick.rotation}
            origin="0, 0"
          >
            <Path
              d={`M 0 ${7 * scale} C ${-3.5 * scale} ${1.4 * scale}, ${-4.2 * scale} ${-4.2 * scale}, 0 ${-7 * scale} C ${4.2 * scale} ${-4.2 * scale}, ${3.5 * scale} ${1.4 * scale}, 0 ${7 * scale} Z`}
              fill={isActive ? '#FF9933' : 'rgba(255, 255, 255, 0.1)'}
              stroke={isActive ? '#FFD700' : 'rgba(255, 255, 255, 0.2)'}
              strokeWidth={0.8 * scale}
            />
          </G>
        );
      })}
    </>
  );
});

interface ClockReadoutProps {
  muhurta: string;
  kala: string;
  kashtha: string;
  muhurtaName: string;
  deity: string;
  scale: number;
  ringInnerR: number;
}

const ClockReadout = React.memo(function ClockReadout({
  muhurta,
  kala,
  kashtha,
  muhurtaName,
  deity,
  scale,
  ringInnerR,
}: ClockReadoutProps): React.JSX.Element {
  const diameter = ringInnerR * 2 * 1.12;
  return (
    <View
      style={[
        styles.digits,
        {
          transform: [{ translateY: -18 * scale }, { translateX: 0 }],
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
        },
      ]}
      pointerEvents="none"
    >
      <View style={{ transform: [{ translateY: 44 * scale }], alignItems: 'center' }}>
        <View style={[styles.digitsRow, { alignItems: 'flex-start' }]}>
          <View style={{ alignItems: 'center' }}>
            <HeroDigits text={muhurta} scale={scale * 0.65} />
            <Text style={[styles.rashiLabel, { fontSize: 24 * scale, marginTop: 6 * scale, letterSpacing: 1 * scale }]}>मुहूर्त</Text>
          </View>
          <Image source={require('../../assets/numbers/colon.png')} style={{ height: 72 * scale, width: 28 * scale, resizeMode: 'contain', marginHorizontal: 0 }} />
          <View style={{ alignItems: 'center' }}>
            <HeroDigits text={kala} scale={scale * 0.65} />
            <Text style={[styles.rashiLabel, { fontSize: 24 * scale, marginTop: 6 * scale, letterSpacing: 1 * scale }]}>कला</Text>
          </View>
          <Image source={require('../../assets/numbers/colon.png')} style={{ height: 72 * scale, width: 28 * scale, resizeMode: 'contain', marginHorizontal: 0 }} />
          <View style={{ alignItems: 'center' }}>
            <HeroDigits text={kashtha} scale={scale * 0.65} />
            <Text style={[styles.rashiLabel, { fontSize: 24 * scale, marginTop: 6 * scale, letterSpacing: 1 * scale }]}>काष्ठा</Text>
          </View>
        </View>
        <Text
          style={[styles.rashiLabel, { fontSize: 24 * scale, marginTop: 16 * scale, letterSpacing: 1 * scale }]}
          numberOfLines={1}
        >
          {muhurtaName}
        </Text>
        <Text
          style={[styles.rashiLabel, { fontSize: 24 * scale, marginTop: 8 * scale, letterSpacing: 1 * scale }]}
          numberOfLines={1}
        >
          {deity}
        </Text>
      </View>
    </View>
  );
});

export function DialCore({ state, size }: Props): React.JSX.Element {
  const half = size / 2;
  const ringOuterR = half * 0.94; // slightly larger for the brass texture
  const ringInnerR = half * 0.70;

  const targetKaranaSlot = state.panchang?.karana?.slot ?? 0;
  const targetYogaFraction = state.panchang?.yoga?.progressFraction ?? 0;

  // Scale factor for text and spacing (normalized to size 600)
  const scale = size / 600;
  // Responsive Rashi sizing — refined for fluid adaptation
  const rashiSize = useMemo(() => {
    // Non-linear scaling for better balance across device classes
    const baseRashiSize = size * 0.22;
    const sizeFloor = 52 * Math.sqrt(scale);
    return Math.max(baseRashiSize, sizeFloor);
  }, [size, scale]);

  // ── Tuning Values for Frame Cutouts ──
  // These control the exact X/Y offset from the center of the dial for the 4 circular golden cutouts.
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

  const archGeometry = useMemo(() => ({
    leftArchWedge: arcWedge(svgHalf, svgHalf, r_inner_bottom, r_outer_bottom, leftWedgeStart, leftWedgeEnd),
    rightArchWedge: arcWedge(svgHalf, svgHalf, r_inner_bottom, r_outer_bottom, rightWedgeStart, rightWedgeEnd),
    topLeftArchWedge: arcWedge(svgHalf, svgHalf, r_inner_top, r_outer_top, topLeftWedgeStart, topLeftWedgeEnd),
    topRightArchWedge: arcWedge(svgHalf, svgHalf, r_inner_top, r_outer_top, topRightWedgeStart, topRightWedgeEnd),
    leftTextPath: arcLine(svgHalf, svgHalf, r_text_bottom, leftTextStart, leftTextEnd, 0),
    rightTextPath: arcLine(svgHalf, svgHalf, r_text_bottom, rightTextStart, rightTextEnd, 0),
  }), [svgHalf, r_inner_bottom, r_outer_bottom, r_inner_top, r_outer_top, r_text_bottom]);

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
  const yogaTickRadius = (r_yoga_tick_start + r_yoga_tick_end) / 2;

  const currentYogaIndex = Math.max(0, Math.min(59, Math.floor(targetYogaFraction * 60)));

  // Karana calculations (centered at 270°, same 40° budget). 270 ± 20 = 250°–290°
  // Tick line parameters — equal 40° span matching all other arches
  const karanaStartAngleDeg = 250;  // 270 - 20
  const karanaEndAngleDeg = 290;    // 270 + 20
  const karanaAngleSpan = karanaEndAngleDeg - karanaStartAngleDeg; // 40 degrees
  const r_karana_label = r_text_top + 58 * scale;
  const karanaTickRadius = r_text_top + 37 * scale;

  const currentKaranaIndex = Math.max(0, Math.min(59, targetKaranaSlot - 1));

  // Active tick position for the static label "32"
  const activeIndex = Math.max(0, Math.min(59, targetKaranaSlot - 1));
  const activeAngleDeg = karanaStartAngleDeg + (activeIndex / 59) * karanaAngleSpan;
  const activeAngleRad = activeAngleDeg * Math.PI / 180;
  const karanaLabelX = svgHalf + r_karana_label * Math.cos(activeAngleRad);
  const karanaLabelY = svgHalf + r_karana_label * Math.sin(activeAngleRad);

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
            <Path d={archGeometry.leftArchWedge} />
          </ClipPath>
          <ClipPath id="clipRight">
            <Path d={archGeometry.rightArchWedge} />
          </ClipPath>
          <ClipPath id="clipTopLeft">
            <Path d={archGeometry.topLeftArchWedge} />
          </ClipPath>
          <ClipPath id="clipTopRight">
            <Path d={archGeometry.topRightArchWedge} />
          </ClipPath>
          <Path id="pathTextLeft" d={archGeometry.leftTextPath} />
          <Path id="pathTextRight" d={archGeometry.rightTextPath} />
        </Defs>

        {/* Left Arch (Moon Rashi) */}

        <CurvedWords text={`चन्द्र राशि : ${state.panchang?.moonRashi?.nameHi ?? ''}`} cx={svgHalf} cy={svgHalf} radius={r_text_bottom} midAngleDeg={135} scale={scale} showBg maxSpanDeg={ARCH_BUDGET_DEG} />

        {/* Bottom-Center Arch (Yoga) */}
        <CurvedWords text={`योग : ${state.panchang?.yoga?.nameHi ?? ''}`} cx={svgHalf} cy={svgHalf} radius={r_text_bottom} midAngleDeg={90} scale={scale} showBg maxSpanDeg={ARCH_BUDGET_DEG} />

        {/* Yoga Progressive Bar */}
        <ProgressTickRing
          center={svgHalf}
          radius={yogaTickRadius}
          startAngleDeg={yogaStartAngleDeg}
          angleSpanDeg={yogaAngleSpan}
          currentIndex={currentYogaIndex}
          scale={scale}
          reverse
        />

        {/* Yoga Percentage Label */}
        <CurvedWords text={`${targetPercentage}/100`} cx={svgHalf} cy={svgHalf} radius={r_yoga_label} midAngleDeg={yogaLabelAngleDeg} scale={scale} fontSize={20 * scale} />

        {/* Right Arch (Sun Rashi) */}

        <CurvedWords text={`सूर्य राशि : ${state.panchang?.sunRashi?.nameHi ?? ''}`} cx={svgHalf} cy={svgHalf} radius={r_text_bottom} midAngleDeg={45} scale={scale} showBg maxSpanDeg={ARCH_BUDGET_DEG} />

        {/* Top-Left Arch (Nakshatra) */}

        <CurvedWords text={`नक्षत्र : ${state.panchang?.nakshatra?.nameHi ?? ''}`} cx={svgHalf} cy={svgHalf} radius={r_text_top} midAngleDeg={225} scale={scale} isTopHalf showBg maxSpanDeg={ARCH_BUDGET_DEG} />

        {/* Karana (Top-Center) */}
        <CurvedWords text={`करण : ${state.panchang?.karana?.nameHi ?? ''}`} cx={svgHalf} cy={svgHalf} radius={r_text_top} midAngleDeg={270} scale={scale} isTopHalf showBg maxSpanDeg={ARCH_BUDGET_DEG} />

        <ProgressTickRing
          center={svgHalf}
          radius={karanaTickRadius}
          startAngleDeg={karanaStartAngleDeg}
          angleSpanDeg={karanaAngleSpan}
          currentIndex={currentKaranaIndex}
          scale={scale}
        />

        {/* Karana Active Slot Label */}
        <CurvedWords text={`${targetKaranaSlot}/60`} cx={svgHalf} cy={svgHalf} radius={r_karana_label + (15 * scale)} midAngleDeg={activeAngleDeg} scale={scale} isTopHalf fontSize={20 * scale} />

        {/* Top-Right Arch (Tithi) */}

        {/* Top-Right Text (Tithi) */}
        <CurvedWords text={`तिथि : ${state.panchang?.tithi?.nameHi ?? ''}`} cx={svgHalf} cy={svgHalf} radius={r_text_top} midAngleDeg={315} scale={scale} isTopHalf showBg maxSpanDeg={ARCH_BUDGET_DEG} />

      </Svg>



      <ClockReadout
        muhurta={mm}
        kala={kk1}
        kashtha={kk2}
        muhurtaName={`${state.muhurta?.devanagari ?? ''} · ${state.muhurta?.name ?? ''}`}
        deity={`देवता : ${state.muhurta ? (DEITY_HI[state.muhurta.deity] || state.muhurta.deity) : ''}`}
        scale={scale}
        ringInnerR={ringInnerR}
      />

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
