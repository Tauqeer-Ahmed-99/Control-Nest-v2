# Mobile UI design standards

This document defines the visual vocabulary and conventions for the Control Nest mobile app. Use it when adding or updating screens and components. The live color values and spacing constants are maintained in [`src/constants/theme.ts`](src/constants/theme.ts), and the React Native Elements theme is assembled in [`src/app/_layout.tsx`](src/app/_layout.tsx).

## Design intent

The app should feel calm, clear, and dependable for everyday home control. Use a quiet graphite and green foundation, with mint for the primary action and selection accent. Give content room to breathe, keep cards and controls easy to scan, and make important states legible without relying on color alone.

## Theme vocabulary

Use semantic roles rather than choosing colors by appearance. `Colors` names are the source of truth; React Native Elements color names are mapped to these roles by the app theme provider.

| App token            | Meaning                                               | Light     | Dark      |
| -------------------- | ----------------------------------------------------- | --------- | --------- |
| `text`               | Main text and icons                                   | `#17231F` | `#F2F7F4` |
| `background`         | Screen canvas                                         | `#F3F7F5` | `#101817` |
| `backgroundElement`  | Cards, sheets, and raised surfaces                    | `#FFFFFF` | `#1A2421` |
| `backgroundSelected` | Subtle selected or emphasized surface                 | `#E6EEEA` | `#26342F` |
| `textSecondary`      | Supporting labels and descriptions                    | `#56655F` | `#B0BDB7` |
| `accent`             | Primary action, active navigation, and selected state | `#126B5B` | `#68D4B5` |
| `border`             | Borders and separators                                | `#D9E3DE` | `#30403A` |
| `warning`            | Caution or attention state                            | `#9A6B0C` | `#EAC56D` |
| `error`              | Destructive action or error state                     | `#B83D45` | `#FF807F` |

The React Native Elements names have app-specific meanings:

| `theme.colors` token        | Use in this app                                                             |
| --------------------------- | --------------------------------------------------------------------------- |
| `primary` and `background`  | Main screen canvas                                                          |
| `secondary`                 | Raised surface, card, or sheet                                              |
| `success`                   | Mint accent and primary action color; it is not limited to success messages |
| `warning`, `error`          | Caution and destructive/error states                                        |
| `black` and `grey0`         | Main text color, adapted for light or dark mode                             |
| `grey1`                     | Strong secondary text                                                       |
| `grey2`                     | Supporting text and inactive icons                                          |
| `grey3`                     | Tertiary text and placeholder content                                       |
| `grey4`                     | Very low emphasis or disabled content                                       |
| `grey5`                     | Subtle selected surface; older components also use it for light borders     |
| `greyOutline` and `divider` | Semantic border and separator color                                         |
| `disabled`                  | Disabled control state                                                      |

Prefer `greyOutline` for new borders. When updating an existing component that uses `grey5` as a border, keep the surrounding screen consistent unless you are intentionally correcting its border treatment.

## Color and theme rules

- Use `useTheme()` in components so colors follow the system light or dark appearance.
- Use the app tokens or their mapped `theme.colors` roles. Avoid adding one-off black, white, gray, or accent values to screen styles.
- For text or icons on a filled accent, use a contrasting foreground that remains legible in both modes. Follow the contrast treatment in the shared button theme.
- Use `warning` for caution and `error` for destructive actions. Do not use the accent color to imply an error or warning.
- Keep translucent fills theme-aware. If an overlay color is reused, promote it to a named token instead of repeating raw RGBA values.

## Typography

Use the bundled Lexend family. The app loads these weights in the root layout:

- `Lexend_400Regular` for body and default labels.
- `Lexend_500Medium` for emphasized labels and control captions.
- `Lexend_600SemiBold` for headings, selected navigation labels, and button titles.
- `Lexend_700Bold` only where stronger emphasis is needed.

Typical mobile sizes are 11-13 units for helper text, 14-16 units for body and control labels, 18-20 units for card or screen headings, and 15 units for button titles. Keep text readable, use line height that prevents clipping, and allow long names to wrap or truncate intentionally.

## Surfaces, spacing, and shape

- React Native numeric sizes are logical layout units (points on iOS and density-independent units on Android). `Spacing` in `src/constants/theme.ts` provides the shared scale: 2, 4, 8, 16, 24, 32, and 64 units. Use it where practical; intermediate values such as 12 or 20 are fine when a component needs them.
- Use the canvas for page backgrounds and `secondary` for cards, tiles, fields, navigation, and sheets.
- Cards and tiles generally use 18-20 unit corner radii and a quiet one-unit outline. Inputs use a 14 unit radius.
- Sheets use generously rounded top corners. The bottom navigation uses a fully rounded capsule; keep its shadow restrained.
- Avoid decorative circles, gradients, or outlines that do not communicate grouping, selection, or action.
- Use responsive widths and scrollable content rather than fixed layouts that clip on smaller screens.

## Controls and interaction

- Shared solid buttons have a 48-unit minimum height, 14-unit radius, and 18-unit horizontal padding. Keep secondary actions clear or outlined, and mark destructive actions with `error`.
- Inputs and dropdowns use a 52-unit minimum height, the same label spacing, and no built-in horizontal outer inset; their parent owns the form margins. Keep a clear focus/disabled state.
- Keep touch targets at least 44 units high or wide, even when the visible icon is smaller.
- The bottom navigation is 76 units high, respects safe-area insets, labels each destination, and exposes selected state to accessibility services. Selected icons sit inside a circular, low-contrast accent surface; the Add action remains visually distinct and always opens the same Room / Device / Controller menu.
- Preserve existing routes, handlers, validation, and data behavior when making a visual-only change.

## Loading states

- For an initial data load, show a theme-aware skeleton that matches the content's size and layout. Replace each placeholder in place to prevent page-level jumps.
- Keep already loaded content visible during background refreshes. Show a skeleton only when no usable result exists yet.
- Keep activity indicators beside an action while a button or mutation is working; use content-shaped placeholders for page and list fetches.
- Use restrained placeholder contrast and motion. Stop animations when the skeleton unmounts, and hide decorative placeholder shapes from screen readers.

## Accessibility and review

- Maintain clear text and icon contrast in both modes. Do not communicate status through color alone; pair it with text, an icon, or an accessible state.
- Add accessible labels and roles to icon-only actions, and expose selected, checked, or disabled state when applicable.
- Respect safe areas and ensure controls remain usable with larger text and on narrow screens.
- Before adding a new visual pattern, check for an existing component with the same role and extend it rather than creating a second style convention.

## Example

```tsx
const { theme } = useTheme();

<View
  style={{
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.greyOutline,
    borderWidth: 1,
    borderRadius: 18,
  }}
>
  <Text style={{ color: theme.colors.black }}>Device name</Text>
</View>;
```

## Focused flows and materials

- Account sign-in is immediately available. Signup separates account details, name, and email verification. Password recovery and second-factor verification keep one task visible at a time.
- House selection lists the houses available to the signed-in account. A selected house has its own controller list. Connecting a Pi is a separate two-step task: nearby Pi, then controller key. Do not show keys or network setup during everyday house selection.
- Show the selected house on Home and provide direct switching without signing out or deleting the saved house. Restore a saved selection only for the account that chose it.
- Keep Add consistent across destinations. Use one sheet whose content changes between its menu and forms. Its header places the title and a 44-unit X close control in one row. Room/device creation failures stay in the form, which stays open for correction.
- Keep the palette and Lexend family above. Flow headings use 28/36 semibold with -0.6 tracking; explanatory body uses 16/24; choice titles use 17 medium; secondary choice text uses 14/21. Fields and primary actions retain the shared 52- and 48-unit minimums.
- Native glass belongs to floating navigation and controls. Use regular glass on supported iOS versions, material blur on older iOS, and a quiet solid toolbar fallback on Android. The bottom island retains its Android SDK 31+ blur. Content rows and forms stay opaque. Honor Reduce Transparency and increased contrast with opaque surfaces; honor Reduce Motion with static sheets and switches. Read these settings once through the accessibility provider.
- Use labeled accordion rows with visible chevrons and brief summaries for schedule options, recent changes, connection details, and optional form sections. Keep the section title visible when collapsed.
- Schedule weekdays stay in one horizontal row, with Every day as a separate checkbox above it. Let the row scroll on narrow displays or at larger text sizes instead of wrapping Friday and Saturday.
- Switch taps update the action immediately while the thumb animates. Incoming optimistic values and server changes retarget the spring rather than snapping it to the endpoint.
- On narrow displays and with larger text, card grids become one column and summary cards stack. Choice rows grow vertically. Choice fields open a scrollable selection screen instead of squeezing an iOS wheel into a 50-unit field.

### Theme contrast reference

Computed from the existing token hex values on the opaque raised surface; these are not measurements of a rendered translucent surface.

| Foreground role                    | Light on #FFFFFF | Dark on #1A2421 |
| ---------------------------------- | ---------------- | --------------- |
| Main text (#17231F / #F2F7F4)      | 16.20:1          | 14.71:1         |
| Secondary text (#56655F / #B0BDB7) | 6.14:1           | 8.20:1          |
| Accent (#126B5B / #68D4B5)         | 6.40:1           | 8.86:1          |
| Error (#B83D45 / #FF807F)          | 5.54:1           | 6.56:1          |

### Flow review and decisions

The app's thesis is calm, house-first control: choose a place, then act on its rooms and devices. The graphite/mint palette, Lexend type, and floating navigation island remain its visual identity.

| Severity | Finding addressed                                                              | Guideline and concrete response                                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | An iOS picker was constrained to a 50-unit clipped wheel.                      | `accessibility.md > Cognitive`: "Keep actions simple and intuitive." Choice fields now open full-size, labeled lists with an explicit Cancel action.                                                 |
| High     | House choice, nearby hardware, and API keys competed on one page.              | `layout.md > Visual hierarchy`: "Use progressive disclosure to make layouts cleaner and easier to interact with." House selection, controller overview, discovery, and key entry are separate tasks. |
| High     | Signup occupied an absolute sheet over a large brand panel.                    | `onboarding.md > Best practices`: "Teach through interactivity." Use scrollable, keyboard-aware account/name/verification steps with direct navigation.                                              |
| High     | Add changed behavior by screen, and controller setup was absent from Settings. | Product judgment: retain the distinctive Add control, give it the same three explicit choices everywhere, and add house/controller entries to Settings.                                              |
| Medium   | Device detail exposed schedule, defaults, history, and diagnostics together.   | Product judgment: explain the room shortcut in everyday terms; disclose scheduling, history, and connection diagnostics on request.                                                                  |

The layout is intentionally the same sequence at compact and regular widths; the regular-width flow is centered at a maximum of 560 units. This avoids a second navigation model on tablets.

```text
Compact (320+)          Regular (560+ available)
[Back  House name]      [     Back  House name     ]
Find your Pi            [     Find your Pi        ]
One short instruction   [     One instruction     ]
[Nearby Pi       >]     [     Nearby Pi         > ]
[Nearby Pi       >]     [     Nearby Pi         > ]
[Search again]          [     Search again        ]
```

Craft judgment: keep the local Pi list as the recognizable setup moment; avoid decorative onboarding, extra status badges, repeated branding, and glass content cards. The website remains the owner of house creation and controller key issuance. Cross-platform behavior shares the flow and palette, while native glass and iOS time controls adapt to platform capabilities. These changes require real-device review for actual discovery, keyboard behavior, large text, screen readers, and material rendering; static checks do not establish those results.
