import "./globals.css";

function ThemeInitScript() {
  // Ustawiamy theme zanim React się zhydratuje (żeby uniknąć "flash" przy przełączaniu).
  // "system" = preferencja systemowa (fallback).
  const code = `(() => {
    try {
      const stored = localStorage.getItem('ui_theme');
      const theme = stored === 'dark' || stored === 'light' ? stored : 'system';
      const root = document.documentElement;
      if (theme === 'system') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', theme);
      }
    } catch {}
  })();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">{children}</body>
    </html>
  );
}
