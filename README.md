# Vikramaditya Vedic Clock — React Native (Expo)

Offline kiosk clock that displays the live Vedic Panchang for **Bhopal**: the running muhurta / kala / kashtha trio, the five Panchang limbs (tithi · nakshatra · yoga · karana · vara), sun + moon rashis, Hindu lunar month, Vikram Samvat year, and a sun-altitude-driven sky backdrop.

This is the **React Native (Expo SDK 51) port** of the original Flutter app at [`varunC28/Vedic-clock`](https://github.com/varunC28/Vedic-clock). Same math, same data tables, same visual hierarchy — re-implemented for the Expo runtime so it can run on iOS / Android / web from a single TypeScript codebase with zero native modules.

---

## What's inside

```
src/
├── theme.ts                 colour + typography tokens (10-foot-viewing TV palette)
├── config.ts                Bhopal location + IST offset + UTC↔IST helpers
├── models.ts                Panchang / Muhurta / Festival / VedicClockState types
├── data/
│   ├── muhurtas.ts          all 30 Muhurtas (name · devanagari · deity · nature)
│   ├── panchangNames.ts     tithi / nakshatra / yoga / karana / rashi / vara names
│   ├── hinduCalendar.ts     Vikram Samvat dates + lunar-month rashi map
│   └── festivals.ts         Drik-verified festival list, 2025-2035
├── core/
│   ├── ayanamsha.ts         Lahiri ayanamsha, tropical→sidereal helper
│   ├── solar.ts             sunrise / sunset / sun-longitude / moon-longitude
│   │                        via the `astronomy-engine` pure-JS package
│   ├── panchangService.ts   sidereal longitudes → 5-limb Panchang projection
│   └── vedicClockService.ts MM:KK:KK integer-ms time math
├── hooks/
│   └── useVedicClock.ts     1 Hz React hook — sunrise rollover + Panchang per day
└── components/
    ├── LivingSkyBackdrop.tsx   altitude-driven 3-stop sky gradient
    ├── YantraRosette.tsx       8-petal corner ornament (SVG)
    ├── GiltArch.tsx            quadratic-curve arch with bindu apex
    ├── HeroDigits.tsx          big tabular-num MM / KK / KK
    ├── TopBar.tsx              IST clock + brand tagline + Devanagari date
    ├── BottomStrip.tsx         vara · samvat · location
    ├── DialCore.tsx            30-wedge muhurta dial + rotating hand
    └── Wings.tsx               flanking tithi/nakshatra cards + sun/yoga/karana cards
__tests__/
├── vedicClockService.test.ts   integer-ms muhurta/kala/kashtha invariants
└── panchangService.test.ts     longitude → 5-limb projection
App.tsx                          screen composition
```

## Highlights

- **No native modules.** `astronomy-engine` is pure JS, so the app runs in Expo Go on iOS / Android and as a web app via Metro. No custom dev client, no NDK toolchain.
- **Integer-millisecond time math.** No floating-point drift across the 24-hour day — same trick as the Flutter app's integer-microsecond pipeline, just one decimal place coarser (JS `Date` is 1 ms-precise).
- **Lahiri ayanamsha** computed analytically from J2000.0 + linear precession. Verified against Drik Panchang to within 1 arcsec/year over 1990-2050.
- **Per-Vedic-day Panchang**, never per-second. Sunrise rollover triggers a single recompute; the ticker just advances the hero digits.
- **Landscape lock** + `expo-keep-awake` for kiosk usage.

## Running it

Requires Node ≥ 18 and the Expo CLI (`npm i -g expo` if you don't have it).

```bash
git clone https://github.com/varunC28/vedic_clock_reactnative.git
cd vedic_clock_reactnative
npm install

# Run in Expo Go on a phone (scan the QR code).
npm run start

# Or boot into a specific target:
npm run android
npm run ios
npm run web
```

### Tests

```bash
npm test
```

The test suite covers the pure-TS math/service layer (vedic-clock projection, Panchang limb projection, ayanamsha sanity). UI components are validated by running the app — they don't ship under Jest because `react-native-svg` + `expo-linear-gradient` want a real Metro bundler.

### Typecheck

```bash
npm run typecheck
```

## Configuration

`src/config.ts` hard-codes Bhopal (23.26 °N, 77.41 °E, IST). To switch cities, change `LOCATION` — every downstream service reads from it.

Festivals beyond 2026-11-24 need to be appended to `src/data/festivals.ts` from a Drik-verified Panchang source. The Vikram Samvat year-start table in `src/data/hinduCalendar.ts` is similarly authored through 2035 and must be extended before then.

## Architecture notes

| Concern | Flutter origin | RN/Expo port |
|---|---|---|
| Ephemeris | `package:swisseph` (native plugin) | `astronomy-engine` (pure JS) |
| State container | `ChangeNotifier` controller + `Provider` | `useVedicClock` React hook with `setInterval` |
| Drawing | `CustomPaint` + `Canvas` | `react-native-svg` paths/circles |
| Gradients | `RadialGradient` / `LinearGradient` widgets | `expo-linear-gradient` |
| Theme | `lib/theme.dart` const Colors | `src/theme.ts` const object |
| Test runner | `flutter_test` | `jest` + `ts-jest` |

## Kiosk deployment (24/7 tablet / Android TV)

The kiosk requirements from the project agenda:

| # | Requirement | How it's covered |
|---|---|---|
| 1 | Show precise daily Bhopal sunrise / sunset | `SunBar` component between TopBar and the dial; live IST + daylight duration |
| 2 | Run permanently without user interaction | `expo-keep-awake` + `expo-screen-orientation` lock + hidden status bar |
| 3 | Auto-start after reboot | `plugins/withKiosk.js` injects a `BootReceiver` broadcast handler + `RECEIVE_BOOT_COMPLETED` permission |
| 4 | **Never `+24h` shortcut for next sunrise** | `src/core/sunrisePair.ts` calls the ephemeris twice — once per pair member. Locked down by `__tests__/sunrisePair.test.ts` |
| 5 | Android kiosk configuration | `plugins/withKiosk.js` adds `intent.category.HOME` to MainActivity so the app can be set as the default launcher |
| 6 | Memory-leak prevention (24/7) | `setInterval` cleanup; DayBundle ref reused, only recomputed at sunrise rollover |
| 7 | Validation & testing | 144 tests across 19 suites covering math, services, widgets, and 48 h tick simulation |
| 8 | Kiosk stability test | `__tests__/kioskStability.test.ts` pumps 172,800 simulated 1 Hz ticks (48 h) and asserts state-bound invariants |
| 9 | APK size checklist | See "APK build + size" below |
| 10 | Lahiri ayanamsha (sidereal) | `src/core/ayanamsha.ts` analytic implementation, verified against Drik for 2020-2035 |
| 11 | **Live Panchang** — tithi/karana/etc advance through the day | `src/core/livePanchang.ts` recomputes the variable limbs every tick from current sun + moon longitudes; only Vara, VS year, lunar month, and festival stay sunrise-anchored. Locked down by `__tests__/livePanchang.test.ts` (Gemini regression: Dwadashi at sunrise → Trayodashi at 15:55 IST) |

### Building the kiosk APK

```bash
# 1. One-time: install EAS CLI if you don't have it.
npm i -g eas-cli

# 2. Log in (uses your Expo account).
eas login

# 3. Build a release APK that targets your Android device. EAS will run
#    `expo prebuild` (which applies the `withKiosk` plugin), then build
#    with Gradle in the cloud. Output is a downloadable .apk URL.
eas build --platform android --profile preview
```

Once installed, set the app as the device's default launcher:

```
Settings → Apps → Default apps → Home app → Vedic Clock
```

After the next reboot, Android will boot directly into the kiosk —
no user interaction required — and the `BootReceiver` we injected
re-launches MainActivity even if the launcher path is unavailable.

### APK build + size

| Aspect | Target | Notes |
|---|---|---|
| APK size | < 60 MB | RN Expo APKs typically ship 30-50 MB. The Flutter equivalent was 55 MB |
| `assetBundlePatterns` | `**/*` | All assets bundled into the APK; no runtime download |
| JS bundle | < 5 MB minified | Tracked by `Web Bundled` line on `expo start --web` |
| Native modules | 0 | astronomy-engine is pure JS — no NDK/`.so` libs |
| Inspect after build | `unzip -l app-release.apk \| sort -k4 -n -r \| head -20` | Lists the heaviest files |

### Long-running operation

| Behaviour | Implementation |
|---|---|
| Screen stays awake | `activateKeepAwakeAsync()` in `App.tsx` |
| Landscape lock | `ScreenOrientation.lockAsync(LANDSCAPE)` in `App.tsx` |
| Status bar hidden | `<StatusBar hidden />` + `app.json:androidStatusBar.hidden:true` |
| Sunrise rollover | `useVedicClock` recomputes the day bundle when `nowUtc >= nextSunriseUtc` |
| Per-Vedic-day Panchang | Recomputed once at each rollover, never per-second |
| Tick interval | 1 Hz (`setInterval(tick, 1000)`); cleared on hook unmount |
| Memory | Per-tick state allocation is O(1); no growing arrays / refs |

### Verification before you ship

```bash
npm run typecheck       # tsc --noEmit, must be clean
npm test                # 144 tests, all must pass
npx expo-doctor         # SDK-version sanity
eas build --profile preview --platform android
```

## License

MIT (matches the Flutter project's licence).
