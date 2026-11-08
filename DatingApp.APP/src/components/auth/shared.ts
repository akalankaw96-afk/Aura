import { formatMobile } from "@/components/ui/PhoneField";
export { DEMO } from "@/lib/demo";

/** "771234567" → "+94 77 123 4567" */
export const formatPhone = (digits: string) => `+94 ${formatMobile(digits)}`;
