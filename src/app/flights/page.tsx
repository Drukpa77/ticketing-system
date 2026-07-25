import { redirect } from "next/navigation";

/** Legacy URL — search results now live on the home page. */
export default async function FlightsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value) params.set(key, value);
  }
  const qs = params.toString();
  redirect(qs ? `/?${qs}` : "/");
}
