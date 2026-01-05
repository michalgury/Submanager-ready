import { redirect } from "next/navigation";

export default function RegisterRedirectPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = searchParams?.next || "/subskrypcja";
  redirect(`/?auth=register&next=${encodeURIComponent(next)}`);
}
