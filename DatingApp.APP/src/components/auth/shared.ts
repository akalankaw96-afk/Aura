import { formatMobile } from "@/components/ui/PhoneField";

/** "771234567" → "+94 77 123 4567" */
export const formatPhone = (digits: string) => `+94 ${formatMobile(digits)}`;
