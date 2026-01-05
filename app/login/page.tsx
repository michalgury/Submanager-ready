import { redirect } from "next/navigation";

export default function LoginRedirectPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = searchParams?.next || "/subskrypcja";
  redirect(`/?auth=login&next=${encodeURIComponent(next)}`);
}
