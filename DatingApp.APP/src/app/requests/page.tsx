import { redirect } from "next/navigation";

/** Old address — the page is now "Friends" at /friends. Keeps saved links and bookmarks working. */
export default async function RequestsRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  const query = params.toString();
  redirect(query ? `/friends?${query}` : "/friends");
}
