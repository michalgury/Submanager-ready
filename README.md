## SubManager — uruchomienie lokalnie

Wymagania:
- Node.js 18+ (zalecane 20+)

### 1) Instalacja

```bash
npm install
```

### 2) Sekret sesji

W pliku `.env.local` ustaw `SUBMANAGER_SECRET` (dowolny długi losowy ciąg).

Przykład generacji w PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Wklej wynik do `.env.local`, np.:

```
SUBMANAGER_SECRET=...tu_wklej...
```

### 3) Start dev

```bash
npm run dev
```

Otwórz `http://localhost:3000`.

## Strony
- `/` — przedsionek: logowanie + rejestracja + opis
- `/subskrypcja` — pełna funkcjonalna podstrona (wymaga aktywnego planu)
- `/chat` — prosty chat (wysyła wiadomości na Discord)
- `/profile` — profil + zmiana hasła

Uwaga: w `data/users.json` jest pusta baza użytkowników (start od zera).

## Discord (opcjonalnie)

Ustaw jedną z opcji w `.env.local`:

### A) Webhook (najszybciej)

```
DISCORD_WEBHOOK_URL=...twoj_webhook...
```

### B) Bot Token + Channel ID

```
DISCORD_BOT_TOKEN=...token...
DISCORD_CHANNEL_ID=...id_kanalu...
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
