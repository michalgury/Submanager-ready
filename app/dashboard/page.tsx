import { redirect } from "next/navigation";

export default function DashboardRedirectPage() {
  // Zachowujemy kompatybilność z wcześniejszą trasą.
  // Główna funkcjonalna podstrona jest pod /subskrypcja.
  redirect("/subskrypcja");
}
