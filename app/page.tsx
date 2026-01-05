import AppShell from "./components/AppShell";
import AuthPanel from "./components/AuthPanel";
import IntroSplash from "./components/IntroSplash";

export default function HomePage() {
  return (
    <AppShell title="Start">
      <IntroSplash />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            SubManager
          </h1>
          <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-white/60">
            Minimalistyczny panel do zarządzania subskrypcjami (profile, budżety, wykresy, eksport, przypomnienia).
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-black tracking-wide text-zinc-500 dark:text-white/50">Czym jest ta strona</div>
              <p className="mt-2 text-sm font-semibold text-zinc-700 dark:text-white/70">
                {/* TODO: tutaj wkleisz swój opis */}
                To jest miejsce na krótki opis produktu i korzyści. Podmień tekst na swój (sekcja „Kim jesteśmy”).
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-black tracking-wide text-zinc-500 dark:text-white/50">Jak to działa</div>
              <ol className="mt-2 space-y-2 text-sm font-semibold text-zinc-700 dark:text-white/70">
                <li>1) Zaloguj się albo załóż konto.</li>
                <li>2) Wybierz plan, aby odblokować podstronę Subskrypcja.</li>
                <li>3) Dodawaj subskrypcje, ustaw cykle, eksport i alerty.</li>
              </ol>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-black tracking-wide text-zinc-500 dark:text-white/50">Podstrony</div>
            <p className="mt-2 text-sm font-semibold text-zinc-700 dark:text-white/70">
              Start jest przedsionkiem do reszty aplikacji. Nawiguj z bocznego paska po lewej.
              Kluczowa funkcjonalność znajduje się w zakładce <span className="font-black">Subskrypcja</span>.
            </p>
          </div>
        </section>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <AuthPanel />
          <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-black tracking-wide text-zinc-500 dark:text-white/50">Uwaga</div>
            <p className="mt-2 text-sm font-semibold text-zinc-700 dark:text-white/70">
              Logowanie i rejestracja są tylko tutaj (na stronie głównej). Dostęp do podstrony Subskrypcja wymaga aktywnego planu.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
