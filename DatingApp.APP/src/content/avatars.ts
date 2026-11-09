/**
 * Illustrated profile avatars — for members who'd rather not post real photos yet.
 * Flat style that matches /brand/bride.png & /brand/groom.png: pastel circle,
 * soft skin, blush cheeks, simple eyes. Generated as SVG (crisp, ~2 KB each) and
 * used as a data URI, so they work anywhere an <img src> photo does.
 */

export type AvatarGender = "female" | "male";

export interface AvatarSpec {
  id: string;
  gender: AvatarGender;
  name: string; // short label shown under the option
  bg: string;
  skin: string;
  hair: string;
  outfit: string;
  accent: string;
  style: "long" | "bun" | "side" | "crown" | "short" | "beard" | "glasses" | "curly";
}

export const AVATARS: AvatarSpec[] = [
  { id: "f-crown", gender: "female", name: "Flower crown", bg: "#FCE4EC", skin: "#F6CDB0", hair: "#5B2245", outfit: "#F8E1E8", accent: "#F28C38", style: "crown" },
  { id: "f-bun", gender: "female", name: "Jasmine bun", bg: "#FFF1D6", skin: "#DDA27A", hair: "#2B1B17", outfit: "#B8043B", accent: "#FFFFFF", style: "bun" },
  { id: "f-long", gender: "female", name: "Long hair", bg: "#E3F2FD", skin: "#C68A5E", hair: "#3A2420", outfit: "#2E7D6B", accent: "#F2C14E", style: "long" },
  { id: "f-side", gender: "female", name: "Side braid", bg: "#EDE7F6", skin: "#F1C29C", hair: "#4A2A20", outfit: "#7B3FA0", accent: "#F2C14E", style: "side" },
  { id: "m-quiff", gender: "male", name: "Classic", bg: "#FDF0D5", skin: "#F3C9A5", hair: "#5A2E22", outfit: "#1F2A44", accent: "#FFFFFF", style: "short" },
  { id: "m-beard", gender: "male", name: "Beard", bg: "#E8F5E9", skin: "#D49A6A", hair: "#2B1B17", outfit: "#B8043B", accent: "#FFFFFF", style: "beard" },
  { id: "m-glasses", gender: "male", name: "Glasses", bg: "#E3F2FD", skin: "#C68A5E", hair: "#1E1513", outfit: "#2E5E8C", accent: "#FFFFFF", style: "glasses" },
  { id: "m-curly", gender: "male", name: "Curly", bg: "#FCE4EC", skin: "#9C6644", hair: "#1E1513", outfit: "#3E7C59", accent: "#FFFFFF", style: "curly" },
];

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, "0")).join("")}`;
};

/** SVG markup for one avatar (240 × 240, circular). */
export function avatarSvg(a: AvatarSpec): string {
  const skinShadow = shade(a.skin, -0.08);
  const female = a.gender === "female";

  // hair behind the head
  const backHair =
    a.style === "long" || a.style === "crown"
      ? `<path d="M58 118c0-46 28-74 62-74s62 28 62 74v92H58z" fill="${a.hair}"/>`
      : a.style === "side"
      ? `<path d="M62 116c0-44 26-70 58-70s58 26 58 70v20H62z" fill="${a.hair}"/><path d="M160 130c14 18 12 46 2 70-4 10-16 10-18 0-4-18 2-44 6-60z" fill="${a.hair}"/>`
      : a.style === "bun"
      ? `<circle cx="120" cy="50" r="24" fill="${a.hair}"/><g fill="${a.accent}"><circle cx="100" cy="44" r="5"/><circle cx="110" cy="33" r="5"/><circle cx="124" cy="29" r="5"/><circle cx="138" cy="35" r="5"/><circle cx="144" cy="47" r="5"/></g>`
      : a.style === "curly"
      ? `<g fill="${a.hair}"><circle cx="78" cy="88" r="20"/><circle cx="96" cy="66" r="22"/><circle cx="120" cy="58" r="24"/><circle cx="144" cy="66" r="22"/><circle cx="162" cy="88" r="20"/></g>`
      : "";

  // body: neck + outfit
  const neck = `<path d="M104 160h32v22c0 8-32 8-32 0z" fill="${skinShadow}"/>`;
  const outfit = female
    ? `<path d="M40 240c4-40 34-62 80-62s76 22 80 62z" fill="${a.outfit}"/>` +
      // saree pallu drape across the shoulder
      `<path d="M150 182c18 6 36 22 44 58h-34c-4-22-10-40-24-52z" fill="${shade(a.outfit, -0.12)}"/>` +
      `<path d="M150 182c18 6 36 22 44 58" stroke="${a.accent}" stroke-width="4" fill="none" opacity=".9"/>`
    : `<path d="M40 240c4-40 34-62 80-62s76 22 80 62z" fill="${a.outfit}"/>` +
      `<path d="M100 180l20 24 20-24 6 6-26 30-26-30z" fill="${a.accent}"/>` +
      (a.style === "short" ? `<path d="M114 204h12l-3 8h-6z" fill="#B8043B"/><path d="M116 212h8l4 22h-16z" fill="#B8043B"/>` : "");

  // head
  const ears = `<circle cx="66" cy="124" r="11" fill="${a.skin}"/><circle cx="174" cy="124" r="11" fill="${a.skin}"/>`;
  const head = `<ellipse cx="120" cy="118" rx="54" ry="60" fill="${a.skin}"/>`;

  // front hair
  const frontHair: Record<AvatarSpec["style"], string> = {
    long: `<path d="M64 112c0-40 26-64 56-64s56 24 56 64c-18-4-34-16-44-34-12 20-38 32-68 34z" fill="${a.hair}"/>`,
    crown: `<path d="M64 112c0-40 26-64 56-64s56 24 56 64c-14 0-30-10-40-30-10 20-40 30-72 30z" fill="${a.hair}"/>` +
      `<g><circle cx="80" cy="66" r="9" fill="#F28C38"/><circle cx="98" cy="54" r="9" fill="#FFFFFF"/><circle cx="120" cy="49" r="10" fill="#F28C38"/><circle cx="142" cy="54" r="9" fill="#FFFFFF"/><circle cx="160" cy="66" r="9" fill="#F28C38"/>` +
      `<circle cx="80" cy="66" r="3" fill="#C2410C"/><circle cx="120" cy="49" r="3.5" fill="#C2410C"/><circle cx="160" cy="66" r="3" fill="#C2410C"/><path d="M68 74c4-6 8-8 12-8M170 74c-4-6-8-8-12-8" stroke="#3E8E41" stroke-width="5" stroke-linecap="round"/></g>`,
    bun: `<path d="M64 114c0-42 26-64 56-64s56 22 56 64c-10-20-30-34-56-36-26 2-46 16-56 36z" fill="${a.hair}"/>`,
    side: `<path d="M64 116c0-42 26-66 56-66s56 24 56 66c-24-2-50-20-60-44-6 22-24 40-52 44z" fill="${a.hair}"/>`,
    short: `<path d="M66 110c-4-40 20-66 54-66 30 0 54 18 54 54l-6 14c-4-18-14-28-30-30-22-2-46 6-62 24z" fill="${a.hair}"/><path d="M96 46c20-12 54-10 70 8-20-4-44-2-70-8z" fill="${shade(a.hair, 0.08)}"/>`,
    beard: `<path d="M66 108c-2-38 22-62 54-62s56 24 54 62c-6-14-18-24-34-26-24-2-52 8-74 26z" fill="${a.hair}"/>`,
    glasses: `<path d="M66 106c-2-36 22-60 54-60s56 24 54 60c-8-16-24-26-54-26s-46 10-54 26z" fill="${a.hair}"/>`,
    curly: `<g fill="${a.hair}"><circle cx="84" cy="80" r="14"/><circle cx="104" cy="70" r="15"/><circle cx="124" cy="68" r="15"/><circle cx="144" cy="72" r="14"/><circle cx="160" cy="86" r="12"/></g>`,
  };

  // face
  const eyes =
    `<ellipse cx="98" cy="122" rx="7" ry="8" fill="#fff"/><ellipse cx="142" cy="122" rx="7" ry="8" fill="#fff"/>` +
    `<circle cx="99" cy="123" r="4.5" fill="#2B1B17"/><circle cx="141" cy="123" r="4.5" fill="#2B1B17"/>` +
    `<circle cx="100.5" cy="121.5" r="1.4" fill="#fff"/><circle cx="142.5" cy="121.5" r="1.4" fill="#fff"/>`;
  const brows = female
    ? `<path d="M88 108c6-4 14-4 20-1M132 107c6-3 14-3 20 1" stroke="${a.hair}" stroke-width="3" stroke-linecap="round" fill="none"/>`
    : `<path d="M86 107c8-5 16-5 22-2M132 105c6-3 14-3 22 2" stroke="${a.hair}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  const lashes = female ? `<path d="M90 116l-4-3M150 116l4-3" stroke="#2B1B17" stroke-width="2.5" stroke-linecap="round"/>` : "";
  const nose = `<path d="M118 128c-2 8-2 12 4 13" stroke="${shade(a.skin, -0.2)}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  const cheeks = `<circle cx="86" cy="142" r="10" fill="#F08A8A" opacity=".45"/><circle cx="154" cy="142" r="10" fill="#F08A8A" opacity=".45"/>`;
  const mouth = female
    ? `<path d="M108 152c6 7 18 7 24 0" stroke="#B8043B" stroke-width="4" stroke-linecap="round" fill="#E85D75"/>`
    : `<path d="M108 152c6 6 18 6 24 0" stroke="#7A2E2E" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  const bindi = female ? `<circle cx="120" cy="104" r="3.2" fill="#B8043B"/>` : "";
  const earrings = female ? `<circle cx="66" cy="140" r="5" fill="${a.accent === "#FFFFFF" ? "#F2C14E" : a.accent}"/><circle cx="174" cy="140" r="5" fill="${a.accent === "#FFFFFF" ? "#F2C14E" : a.accent}"/>` : "";
  const beard =
    a.style === "beard"
      ? `<path d="M68 128c4 40 24 58 52 58s48-18 52-58c-8 14-18 20-26 20-8-6-18-8-26-8s-18 2-26 8c-8 0-18-6-26-20z" fill="${a.hair}"/><path d="M110 156c6 5 14 5 20 0" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>`
      : a.style === "curly"
      ? `<path d="M104 146c8-5 24-5 32 0-6 3-26 3-32 0z" fill="${a.hair}"/>`
      : "";
  const glasses =
    a.style === "glasses"
      ? `<g fill="none" stroke="#1E1513" stroke-width="3.5"><rect x="82" y="110" width="32" height="24" rx="9"/><rect x="126" y="110" width="32" height="24" rx="9"/><path d="M114 120h12M82 118l-14-4M158 118l14-4"/></g>`
      : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">` +
    `<defs><clipPath id="c"><circle cx="120" cy="120" r="120"/></clipPath></defs>` +
    `<g clip-path="url(#c)"><rect width="240" height="240" fill="${a.bg}"/>` +
    // zoom the figure so the face fills the circle like the brand avatars
    `<g transform="translate(-12 -14) scale(1.1)">` +
    backHair + neck + outfit + ears + earrings + head + cheeks + eyes + lashes + brows + nose + mouth + bindi + beard + glasses + frontHair[a.style] +
    `</g></g></svg>`
  );
}

/** data URI usable as an <img src> / stored as the profile photo */
export const avatarDataUri = (a: AvatarSpec) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatarSvg(a))}`;

export const isIllustration = (src: string | null | undefined) => !!src && src.startsWith("data:image/svg+xml");
