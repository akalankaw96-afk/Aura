import { Suspense } from "react";
import { AdminMembers } from "@/components/admin/AdminMembers";

export default function Page() {
  return (
    <Suspense>
      <AdminMembers />
    </Suspense>
  );
}
