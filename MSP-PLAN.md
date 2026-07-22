# MSP Plan — ACIM App (Ultraplan-refined, approved 2026-07-20)

> **This file is the approved MSP execution plan.** It will be executed by a FRESH session on the
> **Sonnet** model after the chat is cleared. Read the execution protocol first.

---

## How we'll execute this together (READ FIRST — non-negotiable)

The person building this is **NOT a developer** and finds the technical plan below hard to follow.
Work this way, every time, no exceptions:

1. **One small step at a time.** Never batch steps. Never do a "big remake" in a single go.
2. **Explain BEFORE doing.** Before running or changing anything, explain in plain, non-technical
   English: *what* the step does, *why* it's needed, and *what could go wrong*. Avoid jargon; when a
   technical term is unavoidable, define it in one short phrase.
3. **Wait for the user's OK**, then do just that one step — nothing more. **Genuinely wait for a
   reply — never ask a question, get no answer, and proceed on a default.** "No answer yet" means
   keep waiting, not "do it my way." (A 60s AskUserQuestion timeout is NOT permission to proceed.)
4. **Report what happened** in plain English, then explain the next step. Repeat the loop.
5. **Safety first.** This app is ALREADY LIVE on Google Play. If anything looks off, stop and explain
   — do not push forward. Going one step at a time means we can always pinpoint exactly which step
   caused any problem.
6. The "verify" gates in the plan (e.g. the red-box render test) are checkpoints: run them, show the
   result in plain terms, and only continue once they pass.

---

## Context

MLP shipped to Google Play on 2026-07-17; `main` now rolls forward as the **MSP** ("Most Slick
Version") branch. MSP adds no new *content* — it's a UI-tech modernization plus three net-new
features and a stability pass. The largest, most foundational item is adopting
**react-native-reusables (RNR) + NativeWind** so the UI moves off hand-written `StyleSheet`s onto an
ownable, copy-in component library.

**Per user decisions on this plan:**
1. **Preserve the current look** — swap component internals to RNR/NativeWind screen-by-screen with
   no visual regressions. Existing Figma tokens (`constants/Colors.ts`, `constants/Typography.ts`)
   stay the source of truth.
2. **RNR foundation ships first as its own deliverable** (Phases A + B below). Timer, reminders,
   donation, and R8 are scoped here but built in later cycles.
3. **Donation is research-first** — no donation code this cycle; do the Play-policy investigation and
   report before any implementation decision.

All device testing is batched at the **end** of the cycle (standing preference), not per-item. This
document is scoping + the RNR execution plan; nothing is executed yet.

### Addendum — Figma design system + dual color scheme (2026-07-22)

Decided during Step 3 execution, refining decision 1 above (which previously said "preserve current
look, no visual regressions"):

- **This is now a UI-improvement pass, not a strict 1:1 port.** The user is not fully happy with the
  current look and wants to genuinely redesign each screen in Figma as it's migrated — not a total
  visual overhaul, but real polish, not just a like-for-like port of the existing StyleSheet look.
- **Design system work happens in parallel, in Figma:** primitive color tokens are already defined
  there; semantic color tokens plus spacing/border/padding tokens are still being defined, followed by
  per-screen redesigns. RNR components will also be mirrored into Figma so the redesigns are built from
  the same component vocabulary as the code.
- **Step 4 sequencing is now per-screen, not fixed up front:** when we reach a given screen, if its
  Figma redesign is ready, build straight to the new design (skip the 1:1 port). If it isn't ready yet,
  port it 1:1 (old look preserved) as originally planned — still worth doing, since it retires the old
  StyleSheet code either way. The bookmarks → search → contents → home → reader order may get
  resequenced to follow whichever screens have Figma redesigns ready first; confirm with the user before
  reordering.
- **Dual color scheme during the transition:** the existing hand-mirrored colors in `global.css` /
  `tailwind.config.js` (the ones tracking `constants/Colors.ts`) are prefixed **`old-`**
  (`old-background`, `old-font-primary`, etc.) specifically so they can't collide with the new semantic
  token names as they're defined. New semantic tokens get added as their own, separately-named block as
  Figma defines them — not overwriting the `old-*` block. Once every screen is redesigned/migrated and
  nothing references an `old-*` class anymore, delete the whole `old-*` block from both files plus the
  old palette in `constants/Colors.ts` in one cleanup pass (folds into the existing "cleanup / dead code"
  item in the later-cycles section below).
- **RNR/shadcn placeholder slot vars:** the RNR primitives pulled via the CLI (`components/ui/button.tsx`,
  `input.tsx`, `text.tsx`, and any future ones) are hardcoded to a generic slot vocabulary
  (`bg-primary`, `text-foreground`, `bg-secondary`, `bg-muted`, `bg-accent`, `bg-destructive`,
  `border-border`, `border-input`, `ring`) — not the app's own token names. These slots are currently
  aliased in `global.css`/`tailwind.config.js` to the `old-*` scheme (scaffolding, added when Step 3's
  three primitives were pulled) purely so the components render correctly against the current look out
  of the box. `--destructive` has no old-scheme source (app has no destructive actions today) — it's a
  placeholder red. Expect these generic slots to get re-pointed at the new semantic tokens (or overridden
  per-instance) as screens are redesigned, then cleaned up once the `old-*` scheme is deleted.

### Verified current-state facts
- Expo SDK **54.0.35**, RN **0.81.5**, React **19.1.0**, expo-router 6, **new arch ON**, **React
  Compiler ON** (`app.json experiments.reactCompiler: true`).
- `react-native-reanimated ~4.1.1` + `react-native-worklets 0.5.1` + `react-native-safe-area-context ~5.6.0`
  already installed → NativeWind peer deps satisfied. **No NativeWind/Tailwind. No `babel.config.js`**
  (Expo default preset).
- `metro.config.js` pushes `assetExts` `'db'` and `'wasm'` — **both must be preserved** through the
  NativeWind wrap.
- tsconfig path alias is **`@/*` → `./*`** (RNR defaults to `~/*`; point RNR at `@/`).
- `app.json` already loads a **local config plugin** (`./plugins/withAndroidBackupRules.js`) via its
  `plugins` array — the established CNG pattern to follow for any future native config.
- **Theme is manual, persisted, OS-independent** `isDark` (`utils/theme.tsx`, AsyncStorage key
  `acim_theme` — settled/final). `useThemeColors()` in the same file maps tokens per mode.
  `app/_layout.tsx` already has a `NavigationBarSync` component that runs a side-effect on `isDark` —
  the precedent for the theme bridge.
- **Dead boilerplate confirmed** (only self-references, nothing in `app/*` imports them):
  `components/{themed-text,themed-view,parallax-scroll-view,hello-wave,haptic-tab,external-link}.tsx`,
  `components/ui/{collapsible,icon-symbol.tsx,icon-symbol.ios.tsx}`, `constants/theme.ts`,
  `hooks/{use-theme-color.ts,use-color-scheme.ts,use-color-scheme.web.ts}`.
- **Keep, do not replace:** `components/RipplePressable.tsx`, `components/AppScrollView.tsx` (no RNR
  equivalent). **Theme-fixed by design** (always-white): `SearchBar`, `NoteInput`, `ReaderToolButton`
  — don't let `dark:` variants leak in.

---

## RNR foundation — dependency order

```
Step 1  NativeWind + Tailwind foundation
        (babel.config.js, metro wrap, global.css, tailwind.config.js)
              │  verify: <View className="bg-red-500"> renders
              ▼
Step 2  RNR CLI init + THEME BRIDGE + token→CSS-var map
        (components.json@/alias, lib/utils.ts cn(), colorScheme.set() in ThemeProvider)
              │  verify: manual isDark toggle flips a dark: class
              ▼
Step 3  Pull core RNR primitives (text button input ...) styled with mapped tokens
              │
              ▼
Step 4  Migrate screens (preserve visuals), deleting dead code as touched
        bookmarks → search → contents → home → reader
```

The bridge in Step 2 is the load-bearing piece: get `colorScheme.set()` wired **before** migrating
any screen, or every migrated screen mis-themes.

### Step 1 — NativeWind + Tailwind foundation
- `npx expo install nativewind react-native-reanimated react-native-safe-area-context` (last two
  already present — aligns versions), then `npm i tailwindcss class-variance-authority clsx tailwind-merge`.
- **NativeWind version (resolve during setup, don't guess now):** reanimated **v4** is installed.
  NativeWind v4.1 historically targeted reanimated 3; **v5** targets Expo 54 + new arch + reanimated 4.
  Run `npx @react-native-reusables/cli@latest doctor` + `npx expo install --check` and match whatever
  the current RNR registry targets for SDK 54. Prefer newest **stable** that is reanimated-4-compatible.
- **Create `babel.config.js`** (new): `babel-preset-expo` with NativeWind's JSX import source +
  worklets plugin. ⚠️ **React Compiler is ON** — validate plugin ordering (compiler vs worklets vs
  nativewind) with a trivial `className` render before proceeding; this is the most likely setup snag.
- **Edit `metro.config.js`**: wrap with `withNativeWind(config, { input: './global.css' })` and
  **keep both `assetExts.push('db')` / `.push('wasm')` lines**.
- Create `global.css` (root), `tailwind.config.js`, `nativewind-env.d.ts`.
- **Verify:** `<View className="bg-red-500">` renders red on a throwaway screen before touching real code.

### Step 2 — RNR init + theme bridge + token map
- `npx @react-native-reusables/cli@latest init`; write `components.json` pointing at the existing
  **`@/`** alias and `components/ui`. Add `lib/utils.ts` with the `cn()` helper.
- **Theme bridge:** in `utils/theme.tsx`'s `ThemeProvider`, add an effect that calls NativeWind's
  `colorScheme.set(isDark ? 'dark' : 'light')` whenever `isDark` changes (mirror the existing
  `NavigationBarSync` effect pattern in `_layout.tsx`). NativeWind then drives all `dark:` variants
  off the same manual, persisted source of truth — **do not** switch to OS `useColorScheme`.
- **Token map:** mirror `constants/Colors.ts` as CSS vars in `global.css` (`:root` = light `LIGHT_COLORS`,
  `.dark` = `DARK_COLORS` from `utils/theme.tsx`) and reference them in `tailwind.config.js`
  `theme.extend.colors`. Add font families from `constants/Typography.ts` (`Lora_*`, `NotoSans_*`) to
  `theme.extend.fontFamily`. `constants/*` remain the single source of truth — the CSS vars are a mirror.
- **Verify:** a `dark:` utility on a test element flips when the in-app theme toggle fires.

### Step 3 — Pull core RNR primitives — ✅ SIGNED OFF 2026-07-22
- `npx @react-native-reusables/cli@latest add text button input` (+ `card separator label switch` and
  a `dialog`/bottom-sheet + `slider`/`toggle` when the later timer/settings features land).
- Style each primitive with the mapped tokens so it matches the current look out of the box.
- **Done:** `text`, `button`, `input` pulled into `components/ui/`. Their generic `bg-primary` /
  `text-foreground` / etc. slot vocabulary aliased to the `old-*` scheme via new placeholder CSS vars in
  `global.css` + matching keys in `tailwind.config.js` (see addendum above) — renders correctly against
  the current look. `tailwindcss-animate` was flagged as a missing optional dep by `rnr doctor` —
  skipped, only needed for animated components (dialog/sheet) not pulled yet.
- **Device-verified:** confirmed on a real EAS development-client build (Android APK, build
  `be7bbf48-3867-46c7-a86c-68fd0b912672`) — a temporary Button/Input/Text block placed above the home
  screen's hero card rendered correctly against the current look, then removed once confirmed. Expo Go
  does **not** work for this project (custom `withAndroidBackupRules.js` native config plugin +
  `react-native-reanimated` v4 both block it) — the dev-client build is the fast-iteration path instead;
  it only needs rebuilding when native code/deps change, not for JS/styling edits like this.

### Step 4 — Migrate screens incrementally (preserve visuals)
Order = lowest blast radius first:
1. **`app/bookmarks.tsx`** — pilot (small, self-contained).
2. **`app/search.tsx`** → **`app/contents.tsx`** → **`app/home.tsx`**.
3. **`app/reader.tsx`** last (~78KB; highest risk).

As each screen is migrated: delete any now-unused dead boilerplate it was the last (non-)consumer of.
Once nothing imports them, remove all confirmed-dead files listed above. Preserve `RipplePressable`,
`AppScrollView`, and the three theme-fixed components' always-white behavior.

**Files touched:** `babel.config.js` (new), `metro.config.js`, `global.css` (new),
`tailwind.config.js` (new), `nativewind-env.d.ts` (new), `components.json` (new), `lib/utils.ts` (new),
`utils/theme.tsx` (bridge), `components/ui/*` (RNR), then `app/*.tsx` screen-by-screen; deletions per
the dead-code list.

---

## Later cycles (scoped, not built this deliverable)

**Lesson timer/stopwatch (RNR).** Surface in `reader.tsx` when a workbook lesson is active. Reuse the
**existing** `navChapterBlock` memo (`reader.tsx:699`) + the existing `workbook-l(\d+)` regex
(`lessonMatch`, `reader.tsx:774`) to detect the active lesson — no new anchor scan. Use
**timestamp-based** timing (store start epoch, compute elapsed) so it survives backgrounding. Persist
via a new `utils/timer.ts` + `acim_timer_*` key, mirroring `utils/lastRead.ts`'s get/set/clear shape.

**Lesson reminders (local notifications).** Add `expo-notifications`; configure Android channel/icon/color
+ iOS permission via `app.json` plugins (following the existing local-plugin pattern). Local scheduled
notifications only (offline, no server). New settings surface (`app/settings.tsx` route in `_layout.tsx`,
or a reminders panel in the reader). Persist to `acim_reminders`; include an "enable all workbook
alarms from lesson 1" option.

**Donation — research first (decision 3).** No code this cycle. Investigate current Google Play
Payments policy on in-app donations / external payment routing and safe framing, then report back.
Only if approved later: repurpose the live `heroTipButton` → `handleResetAll` anchor (`home.tsx:133`;
note the older top-bar tip button is already commented out) to open PayPal via
`WebBrowser.openBrowserAsync` (`expo-web-browser` already installed), unlocking no in-app content.

**Cleanup / speed / stability.** Dead-code removal folds into the RNR migration. Drop the unused
`@expo-google-fonts/merriweather-sans` dep (Typography actually uses Noto Sans). R8/minification via
the **`expo-build-properties`** plugin in `app.json` (`enableProguardInReleaseBuilds` +
`enableShrinkResourcesInReleaseBuilds`) — never hand-edit gitignored `android/`; add `proguard-rules.pro`
keep-rules for reflection-reliant modules (**expo-sqlite/FTS5**, reanimated, react-native-svg,
`@react-native-menu/menu`). R8 needs a **release-build** device test. `reader.tsx` perf: consider
splitting the 78KB file + memoizing block renderers (React Compiler helps but size is worth addressing).

---

## Verification (RNR foundation deliverable)

- `npx expo install --check` and `npx @react-native-reusables/cli@latest doctor` both clean.
- **Bare render:** `<View className="bg-red-500">` renders red (Step 1 gate) — proves babel/metro/CSS
  wiring incl. React-Compiler-compatible plugin order.
- **Theme bridge:** on a dev-client EAS build, a `className`-styled RNR `<Button>`/`<Text>` renders,
  and flipping the in-app dark toggle switches `dark:` styles in both directions with **no regression**
  on the theme-fixed components (`SearchBar`, `NoteInput`, `ReaderToolButton` stay white).
- **Per screen:** each migrated screen is visually identical to pre-migration in light and dark; no
  dead-code import remains.
- Testing: no local Android SDK → **EAS dev-client build**, tested on device/BlueStacks, as part of
  the single end-of-cycle batch.

## Risks / watch-items
- **Babel plugin ordering** with React Compiler + worklets + NativeWind — validate with the trivial
  render before anything else.
- **NativeWind v4 vs v5** vs reanimated 4 — resolve via RNR `doctor` before mass migration.
- **Theme bridge** is the core mismatch — wire `colorScheme.set()` correctly before migrating screens.
- Preserve the two `metro.config.js` `assetExts` lines and the theme-fixed components' white behavior.
