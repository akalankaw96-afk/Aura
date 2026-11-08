import type { Metadata } from "next";
import { ReviewStatus } from "@/components/auth/ReviewStatus";

export const metadata: Metadata = { title: "Profile status | Vikasitha" };

export default function ReviewStatusPage() {
  return <ReviewStatus />;
}
