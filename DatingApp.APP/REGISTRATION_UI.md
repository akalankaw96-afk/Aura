# Vikasitha — Registration flow (front end only)

Built from the Figma file **AI-Learning-2** (pages 🧩 Components and 🔐 Registration Flow).
There are **no API calls** in this flow yet. Every check is a mock, so the whole journey is clickable.

## Run

```bash
npm install
npm run dev        # http://localhost:3001
```

| Page | URL | Figma journey |
|---|---|---|
| UI kit preview | `/components` | 🧩 Components |
| Login | `/login` | Journey 1 (01, 01a–01c, 01g) |
| Forgot password | `/forgot-password` | Journey 2 (01d–01f) |
| Register: Account → Verify → Profile → Photos | `/register` | Journeys 3–6 (02–05 + states) |
| Review status: submitted / changes needed / fix fields / resubmitted / live | `/register/status` | Journey 7 (06, 06a–06f) |
| Plans + payment | `/plans` | Journey 8 (07, 07a–07b) |

## Demo values (no API)

Open **Demo tips** (bottom-right) on any page. The values are in `src/lib/demo.ts`.

| What | Value |
|---|---|
| Login that works | `77 123 4567` / `Vikasitha1` |
| Suspended account | `77 000 0000` |
| Wrong password 5× | Account locked for 15 min |
| Register with an existing number | `77 123 4567` |
| Register → server error | `77 999 9999` |
| Correct OTP | `482913` |
| Expired OTP | `000000` |
| Failing card | `4000 0000 0000 0002` |
| Admin approve / request changes | Buttons in **Demo tips** on `/register/status` |

Set `NEXT_PUBLIC_HIDE_DEMO=1` to hide the Demo tips panel.

## Structure

```
src/components/ui/      React versions of the Figma components (Button, Input, PhoneField,
                        PasswordField, OtpInput, Checkbox, Chip, Badge, Alert, Toast, Stepper,
                        Textarea, Card, Logo, LanguageSwitch, HeartPattern, LoveScene)
src/components/auth/    Pages built only from the ui kit (LoginScreen, ForgotPasswordScreen,
                        RegisterFlow, ReviewStatus, PlansScreen, AuthShell, DemoTips)
src/lib/demo.ts         Mock rules + registration draft (sessionStorage)
tailwind.config.ts      Figma tokens: brand / ink / line / status colours, v-* radius and
                        shadows, brand gradient
public/brand/           Logo, couple / bride / groom illustrations, love scene (exported from Figma)
```

- **Toasts** appear top-centre: `const toast = useToast(); toast.success("Title", "Message")`.
- **Radius and shadow** classes use a `v-` prefix (`rounded-v-md`, `shadow-v-sm`), so the old home-page components keep Tailwind's defaults.
- `src/components/RegistrationFlow.tsx` is now a thin wrapper. The home-page sign-up modal still works and shows the new flow.
- **Connecting the API later:** replace the `window.setTimeout(...)` mocks in each screen with calls from `src/services/api.ts`.
