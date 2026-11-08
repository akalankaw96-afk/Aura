import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Card, CardTitle } from "@/components/ui";

/** Placeholder — the full Terms of Service page is designed in Figma (📄 Info Pages) and comes next. */
export default function Page() {
  return (
    <AuthShell>
      <Card className="w-full max-w-[680px] p-8">
        <CardTitle title="Terms of Service" subtitle="The full page is coming in the next build (designed on the Info Pages in Figma)." />
        <div className="mt-6 text-center">
          <Link href="/register" className="font-semibold text-brand underline">Back to registration</Link>
        </div>
      </Card>
    </AuthShell>
  );
}
