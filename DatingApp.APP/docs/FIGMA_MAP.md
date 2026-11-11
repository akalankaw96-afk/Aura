# Figma ↔ code map

Figma file: **AI-Learning-2** — `https://www.figma.com/design/jyoGCUqvQuZsoUp2uUi95W/AI-Learning-2`
To open a node, add `?node-id=` plus the ID with `:` changed to `-` (e.g. `15:930` → `?node-id=15-930`).

## Foundations (🎨 Foundations) → `src/styles/tokens.css`, `tailwind.config.ts`
| Figma | Code |
|---|---|
| Variables: Primitives, Color (Light/Dark), Spacing, Radius, Layout, Typography | `tokens.css` (same names, `/` → `-`) |
| Text styles (Display, Heading, Body, Label, Button, Caption, Overline, Sinhala, Tamil) | `fontSize` in `tailwind.config.ts` → `text-{style}` |
| Effect styles (Shadow/*, Focus/*) | `--shadow-*` → `shadow-*` |
| Paint styles (Gradient/*) | `--gradient-*` → `bg-*` |

## Components (🧩 Components) → `src/components/ui`
| Figma component | Node | Code |
|---|---|---|
| Button / Button Gradient | 15:930 / 15:964 | `ui/Button.tsx` |
| Input (Type = Text) | 15:1111 | `ui/Input.tsx` + `ui/Field.tsx` |
| Input (Type = Select, incl. State = Open) + Dropdown Menu + Dropdown Option | 15:1111 / 133:33402 / 133:33314 | `ui/Select.tsx` (custom listbox with search when > 4 options) |
| Phone Field + Country Picker + Country Option | 76:15025 / 140:21837 / 140:21707 | `ui/PhoneField.tsx` (`COUNTRIES` list, searchable picker with flags) |
| Password Field | 76:15101 | `ui/PasswordField.tsx` |
| OTP Input | 76:15147 | `ui/OtpInput.tsx` |
| Checkbox | 76:15155 | `ui/Checkbox.tsx` |
| Textarea (incl. Error) | 84:19406 | `ui/Textarea.tsx` |
| Chip | 16:753 | `ui/Chip.tsx` |
| Badge (7 tones) | 16:745 | `ui/Badge.tsx` |
| Toast | 111:49218 | `ui/Toast.tsx` (`useToast`) |
| Alert | 111:49219 | `ui/Alert.tsx` |
| Stepper | 74:15069 | `ui/Stepper.tsx` |
| Section Header | 17:1026 | `ui/SectionHeader.tsx` |
| Logo / Language Switch / Theme Toggle | 25:1409 / 69:12913 / 69:13014 | `ui/Brand.tsx` |
| Country Flag | 42:7464 | `ui/Flag.tsx` + `public/images/flags/*` |
| Illustration / Avatar | 54:10576 | `ui/Brand.tsx` → `CoupleAvatar` |
| Love Sticker / Pattern Heart Lines / Love Scene | 46:7153 / 49:7217 / 77:15140 | `ui/Decor.tsx` + `public/images/decor/*` |
| Auth Header (Action = Create account / Log in / Avatar) | 142:21950 | `auth/AuthHeader.tsx` (via `<AuthShell action="…">`) |
| Navbar / Navbar Mobile | 55:10818 / 70:48330 | `layout/Navbar.tsx` |
| Footer | 17:1304 | `layout/Footer.tsx` |
| Profile Card | 16:1057 | `cards/ProfileCard.tsx` |
| Profile Photo Card (Style = Glass / Card × State = Default / Hover) | 150:21863 | `cards/ProfilePhotoCard.tsx` (`variant="glass" \| "card"`) — hero marquee uses Card |
| Profile Marquee (auto-scroll) | 26:3656 | marquee in `sections/home/Hero.tsx` (uses Profile Photo Card) |
| Profile Card Glass (legacy, kept) | 26:1390 | `cards/ProfileGlassCard.tsx` |
| Search Bar + Search Popover (Looking for) | 8:97883 / 97:21510 | `sections/home/Hero.tsx` (`HeroSearch`) |
| Search Popover (Type = Age / Age (error)) | 97:20213 / 139:21926 | `sections/home/AgeRangePopover.tsx` |
| Number Field (Default / Focus / Error) | 139:21708 | `ui/NumberField.tsx` |
| Range Slider | 86:19394 | `ui/RangeSlider.tsx` (thumb CSS in `globals.css` → `.range-thumb`) |

## Home (🏠 Home Page → Home — Desktop 1442 `8:112648`, Mobile 390 `71:10390`)
| Figma frame | Code |
|---|---|
| 01 Hero `8:112650` | `sections/home/Hero.tsx` |
| How It Works Notes `8:112666` | `sections/home/HowItWorks.tsx` |
| 04 Featured profiles `51:115612` | `sections/home/FeaturedProfiles.tsx` |
| 05 Success stories `51:116428` | `sections/home/SuccessStories.tsx` |
| Category Brick Wall `62:13045` | `sections/home/CategoryWall.tsx` |
| 06 Pricing `8:112716` | `sections/home/Pricing.tsx` |
| 07 FAQ `8:112722` | `sections/home/Faq.tsx` |
| 08 Sign up `8:112737` | `sections/home/SignUp.tsx` |
| 09 Footer `8:112754` | `layout/Footer.tsx` |

## Registration (🔐 Registration Flow, 8 journey sections)
| Journey | Figma frames | Code / route |
|---|---|---|
| 1 Login | 01, 01a–01c, 01g | `auth/LoginScreen.tsx` · `/login` |
| 2 Forgot password | 01d–01f | `auth/ForgotPasswordScreen.tsx` · `/forgot-password` |
| 3 Create account | 02, 02a–02e | `auth/RegisterFlow.tsx` → `AccountStep` · `/register` |
| 4 Verify mobile | 03, 03a–03f | `RegisterFlow.tsx` → `VerifyStep` |
| 5 Profile details | 04, 04a–04c | `RegisterFlow.tsx` → `ProfileStep` |
| 6 Photos | 05, 05a–05c | `RegisterFlow.tsx` → `PhotosStep` |
| 7 Review & go live | 06, 06a–06f | `auth/ReviewStatus.tsx` · `/register/status` |
| 8 Upgrade plan | 07, 07a–07b | `auth/PlansScreen.tsx` · `/plans` |

## Member Dashboard (📊 Member Dashboard `167:12645`)
| Frame | Code / route |
|---|---|
| Dashboard — Desktop 1441 `165:27877` | `app/dashboard/page.tsx` · `/dashboard` |
| Requests — Desktop 1440 `171:15511` | `app/friends/page.tsx` · `/friends` (page renamed "Friends"; `/requests` redirects) |
| Messages — Desktop 1440 `172:15691` | `app/messages/page.tsx` · `/messages` |

## Not built yet
🔍 Search Results (grid / list), 📄 Info Pages (About, Terms, Privacy), profile detail modal.

## Motion (code only — Figma prototypes use Smart Animate)

| What | Where |
| --- | --- |
| First-visit page loader (logo + heart beat) | `components/motion/PageLoader.tsx` (root layout) |
| Scroll reveal — add `reveal`, `reveal-zoom` or `reveal-stagger` to any element | `components/motion/RevealObserver.tsx` + `globals.css` → Motion |
| Hero entrance — add `enter` + `--enter-delay` | `globals.css` → Motion (starts when the loader leaves) |
| Page fade between routes | `app/template.tsx` |
| Success Stories sliding carousel (5 s, pauses on hover, swipe) | `sections/home/SuccessStories.tsx` |

All motion respects `prefers-reduced-motion`.
