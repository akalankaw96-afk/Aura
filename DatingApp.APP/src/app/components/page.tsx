"use client";

import React, { useState } from "react";
import { ArrowRight2, Profile2User, User } from "iconsax-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  CoupleAvatar,
  DropdownMenu,
  DropdownOption,
  Input,
  LanguageSwitch,
  Logo,
  OtpInput,
  PasswordField,
  PhoneField,
  Select,
  SortDropdown,
  Stepper,
  Textarea,
  ToastCard,
  useToast,
} from "@/components/ui";

/**
 * /components — living preview of the UI kit, mirroring the Figma
 * 🧩 Components page. Every page in the app is built from these.
 */
function Section({ id, title, figma, children }: { id: string; title: string; figma: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-line pb-2">
        <h2 className="text-h4">{title}</h2>
        <span className="text-body-xs text-ink-tertiary">Figma: {figma}</span>
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 py-3 md:grid-cols-[160px_1fr] md:items-center">
      <p className="text-body-sm font-semibold text-ink-tertiary">{label}</p>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

const NAV = ["Buttons", "Inputs", "Dropdowns", "Phone & Password", "OTP", "Selection", "Badges", "Feedback", "Stepper", "Brand"];

export default function ComponentsPage() {
  const toast = useToast();
  const [phone, setPhone] = useState("771234567");
  const [pw, setPw] = useState("Vikasitha1");
  const [otp, setOtp] = useState("482");
  const [check, setCheck] = useState(true);
  const [chip, setChip] = useState("Myself");
  const [about, setAbout] = useState("I’m a doctor working in Kandy, close to my family.");
  const [step, setStep] = useState(2);
  const [religion, setReligion] = useState("Christian");
  const [sortValue, setSortValue] = useState("Newest first");

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-subtle">
      <header className="sticky top-0 z-30 border-b border-line bg-surface-glass-strong backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center gap-6 px-6 py-3">
          <Logo />
          <nav className="flex flex-1 gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <a key={n} href={`#${n.toLowerCase().replace(/\W+/g, "-")}`} className="whitespace-nowrap rounded-full px-3 py-1.5 text-body-sm font-semibold text-ink-secondary hover:bg-brand-subtle hover:text-brand">
                {n}
              </a>
            ))}
          </nav>
          <a href="/login" className="text-body-sm font-bold text-brand">
            Open the flow →
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] space-y-10 px-6 py-10">
        <div>
          <h1 className="text-h1">Vikasitha UI kit</h1>
          <p className="mt-2 text-ink-secondary">React components built from the Figma design system. Tokens live in <code>tailwind.config.ts</code>.</p>
        </div>

        <Card className="p-6">
          <Section id="buttons" title="Buttons" figma="Button, Button Gradient">
            {(["primary", "secondary", "outline", "ghost"] as const).map((v) => (
              <Row key={v} label={v[0].toUpperCase() + v.slice(1)}>
                <Button variant={v} size="lg" rightIcon={<ArrowRight2 size={18} color="currentColor" />}>
                  Continue
                </Button>
                <Button variant={v} size="md">Button</Button>
                <Button variant={v} size="sm">Button</Button>
                <Button variant={v} size="md" disabled>Disabled</Button>
              </Row>
            ))}
            <Row label="Loading">
              <Button loading>Saving</Button>
            </Row>
          </Section>
        </Card>

        <Card className="p-6">
          <Section id="inputs" title="Inputs" figma="Input, Textarea">
            <div className="grid gap-6 md:grid-cols-3">
              <Input label="Full name" placeholder="Enter your full name" icon={<User size={20} color="currentColor" />} helper="Helper text" />
              <Input label="Full name" defaultValue="Nethmi Perera" icon={<User size={20} color="currentColor" />} error="Please enter your full name" />
              <Input label="Full name" placeholder="Enter your full name" icon={<User size={20} color="currentColor" />} disabled helper="Disabled" />
              <Select label="Religion" placeholder="Select" options={["Buddhist", "Hindu", "Christian", "Catholic", "Islam", "Other"]} value={religion} onChange={setReligion} helper="More than 4 options → search appears" />
              <Select label="Gender" placeholder="Select" options={["Female", "Male"]} value="" onChange={() => {}} helper="4 or fewer → no search" />
              <Select label="Religion" options={["Buddhist", "Hindu"]} value="Buddhist" onChange={() => {}} error="Required" />
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Textarea label="About you" hint="Optional" value={about} onChange={setAbout} helper="Tip: profiles with a short, warm description get more replies." />
              <Textarea label="About you" value="Call me on 077 123 4567" onChange={() => {}} error="Rejected: contains a phone number — please remove it" />
            </div>
          </Section>
        </Card>

        <Card className="p-6">
          <Section id="dropdowns" title="Dropdowns & Select" figma="Input (Type = Select) [15:1111/133:34238], Dropdown Menu [133:33402], Dropdown Option [133:33314], Sort Dropdown [86:19427]">
            <div className="space-y-8">
              <div>
                <h3 className="mb-3 text-label-lg font-bold text-ink">1. Interactive Controls</h3>
                <div className="grid gap-6 md:grid-cols-3">
                  <Select
                    label="Religion"
                    placeholder="Select"
                    icon={<Profile2User size={20} color="currentColor" />}
                    options={["Buddhist", "Hindu", "Christian", "Catholic", "Islam", "Other"]}
                    value={religion}
                    onChange={setReligion}
                    helper="More than 4 options → search appears"
                  />
                  <Select
                    label="Gender"
                    placeholder="Select"
                    options={["Female", "Male"]}
                    value=""
                    onChange={() => {}}
                    helper="4 or fewer → no search"
                  />
                  <Select
                    label="Religion"
                    options={["Buddhist", "Hindu"]}
                    value="Buddhist"
                    onChange={() => {}}
                    error="Required field"
                  />
                  <Select
                    label="Disabled select"
                    options={["Option 1", "Option 2"]}
                    value="Option 1"
                    onChange={() => {}}
                    disabled
                    helper="Disabled state"
                  />
                  <div>
                    <p className="mb-2 text-label-md text-ink">Sort Dropdown (Figma 86:19427)</p>
                    <SortDropdown value={sortValue} onChange={setSortValue} />
                    <p className="mt-2 text-body-xs text-ink-tertiary">Used in search & profile listings</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-label-lg font-bold text-ink">2. Dropdown Option States (Figma 133:33314)</h3>
                <div className="grid max-w-xl gap-3 rounded-md border border-line bg-surface-card p-4">
                  <div className="space-y-1">
                    <p className="text-body-xs text-ink-tertiary">State = Default</p>
                    <ul className="list-none p-0 m-0">
                      <DropdownOption label="Buddhist" state="Default" />
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <p className="text-body-xs text-ink-tertiary">State = Hover</p>
                    <ul className="list-none p-0 m-0">
                      <DropdownOption label="Hindu" state="Hover" />
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <p className="text-body-xs text-ink-tertiary">State = Selected</p>
                    <ul className="list-none p-0 m-0">
                      <DropdownOption label="Christian" state="Selected" />
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-label-lg font-bold text-ink">3. Dropdown Menu Variants (Figma 133:33402)</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <span className="mb-2 inline-block text-body-xs font-semibold text-ink-secondary">
                      Search = On, State = Default
                    </span>
                    <DropdownMenu
                      search
                      options={["Buddhist", "Hindu", "Christian", "Catholic", "Islam", "Other"]}
                      selectedValue="Christian"
                    />
                  </div>

                  <div>
                    <span className="mb-2 inline-block text-body-xs font-semibold text-ink-secondary">
                      Search = On, State = Filtered
                    </span>
                    <DropdownMenu
                      search
                      searchQuery="Chr"
                      options={["Buddhist", "Hindu", "Christian", "Catholic", "Islam", "Other"]}
                      selectedValue="Christian"
                    />
                  </div>

                  <div>
                    <span className="mb-2 inline-block text-body-xs font-semibold text-ink-secondary">
                      Search = On, State = Empty
                    </span>
                    <DropdownMenu
                      search
                      searchQuery="xyz"
                      options={["Buddhist", "Hindu", "Christian", "Catholic", "Islam", "Other"]}
                    />
                  </div>

                  <div>
                    <span className="mb-2 inline-block text-body-xs font-semibold text-ink-secondary">
                      Search = Off, State = Default
                    </span>
                    <DropdownMenu
                      search={false}
                      options={["Female", "Male", "Other"]}
                      selectedValue="Female"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </Card>

        <Card className="p-6">
          <Section id="phone-password" title="Phone & Password" figma="Phone Field, Password Field">
            <div className="grid gap-6 md:grid-cols-3">
              <PhoneField value="" onChange={() => {}} helper="We’ll send a 6-digit code to verify this number" />
              <PhoneField value={phone} onChange={setPhone} helper="Valid number shows a tick" />
              <PhoneField value="12345" onChange={() => {}} error="Enter a valid Sri Lankan mobile number" />
              <PasswordField value="" onChange={() => {}} showStrength helper="At least 6 characters, with a number" />
              <PasswordField value={pw} onChange={setPw} showStrength helper="At least 6 characters, with a number" />
              <PasswordField value="abc" onChange={() => {}} showStrength error="Password must be at least 6 characters" />
            </div>
          </Section>
        </Card>

        <Card className="p-6">
          <Section id="otp" title="OTP Input" figma="OTP Input (Empty / Filling / Error / Success)">
            <div className="grid gap-6 md:grid-cols-2">
              <Row label="Filling">
                <OtpInput value={otp} onChange={setOtp} />
              </Row>
              <Row label="Error">
                <OtpInput value="482911" onChange={() => {}} state="error" />
              </Row>
              <Row label="Success">
                <OtpInput value="482913" onChange={() => {}} state="success" />
              </Row>
            </div>
          </Section>
        </Card>

        <Card className="p-6">
          <Section id="selection" title="Selection" figma="Chip, Checkbox">
            <Row label="Chips">
              {["Myself", "Son", "Daughter", "Brother"].map((c) => (
                <Chip key={c} selected={chip === c} onClick={() => setChip(c)}>
                  {c}
                </Chip>
              ))}
            </Row>
            <Row label="Chip + avatar">
              <Chip avatar="/brand/bride.png">Bride</Chip>
              <Chip avatar="/brand/groom.png" selected>
                Groom
              </Chip>
            </Row>
            <Row label="Checkbox">
              <Checkbox checked={check} onChange={setCheck}>I agree to the Terms of Service and Privacy Policy</Checkbox>
              <Checkbox checked={false} onChange={() => {}} error>
                Error state
              </Checkbox>
            </Row>
          </Section>
        </Card>

        <Card className="p-6">
          <Section id="badges" title="Badges" figma="Badge (7 tones)">
            <Row label="Tones">
              <Badge tone="success">Approved</Badge>
              <Badge tone="premium">Gold</Badge>
              <Badge tone="info">Info</Badge>
              <Badge tone="brand">Great match</Badge>
              <Badge tone="neutral">Neutral</Badge>
              <Badge tone="error">Rejected</Badge>
              <Badge tone="warning">Pending</Badge>
            </Row>
          </Section>
        </Card>

        <Card className="p-6">
          <Section id="feedback" title="Feedback" figma="Toast, Alert">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Alert type="success" title="Mobile verified">Your number +94 77 123 4567 is confirmed.</Alert>
                <Alert type="error" title="Login failed" action={<button className="font-bold text-brand">Reset password</button>}>
                  Mobile number or password is incorrect.
                </Alert>
                <Alert type="warning" title="Code expired">Codes are valid for 10 minutes.</Alert>
                <Alert type="info" title="Tip">The code expires in 10 minutes.</Alert>
              </div>
              <div className="space-y-3">
                <ToastCard static item={{ type: "success", title: "Code sent", message: "We sent a 6-digit code to +94 77 123 4567." }} />
                <ToastCard static item={{ type: "error", title: "Upload failed", message: "Photos must be JPG or PNG, under 5 MB." }} />
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => toast.success("Progress saved", "You can continue anytime.")}>Fire success toast</Button>
                  <Button size="sm" variant="outline" onClick={() => toast.error("Something went wrong", "Check your connection and try again.")}>Fire error toast</Button>
                  <Button size="sm" variant="outline" onClick={() => toast.warning("No photo yet", "Profiles with photos get 5× more interest.")}>Fire warning toast</Button>
                  <Button size="sm" variant="outline" onClick={() => toast.info("New code sent", "Check your SMS.")}>Fire info toast</Button>
                </div>
              </div>
            </div>
          </Section>
        </Card>

        <Card className="p-6">
          <Section id="stepper" title="Stepper" figma="Stepper (Step 1–4 / Complete)">
            <div className="mx-auto max-w-[680px] space-y-4">
              <Stepper step={step} />
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Chip key={s} selected={step === s} onClick={() => setStep(s)}>
                    {s === 5 ? "Complete" : `Step ${s}`}
                  </Chip>
                ))}
              </div>
            </div>
          </Section>
        </Card>

        <Card className="p-6">
          <Section id="brand" title="Brand" figma="Logo, Illustration / Avatar, Language Switch">
            <Row label="Logo">
              <Logo />
            </Row>
            <Row label="Illustrations">
              <CoupleAvatar size={72} />
              <CoupleAvatar size={72} type="bride" />
              <CoupleAvatar size={72} type="groom" />
            </Row>
            <Row label="Language">
              <LanguageSwitch />
            </Row>
          </Section>
        </Card>
      </main>
    </div>
  );
}
