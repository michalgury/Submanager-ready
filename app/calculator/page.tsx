'use client';

import { useState } from 'react';

export default function SubscriptionCalculator() {
  const [monthlyCost, setMonthlyCost] = useState<number>(0);
  const [hoursUsed, setHoursUsed] = useState<number>(0);
  const [pricePerHour, setPricePerHour] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<string>('');

  const calculate = () => {
    if (hoursUsed <= 0 || monthlyCost <= 0) {
      setPricePerHour(null);
      setVerdict('Podaj poprawne dane');
      return;
    }

    const price = monthlyCost / hoursUsed;
    setPricePerHour(price);

    if (price < 1) {
      setVerdict('Bardzo opłacalne');
    } else if (price < 5) {
      setVerdict('Średnio opłacalne');
    } else {
      setVerdict('Mało opłacalne');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-black text-black dark:text-white">
      <h1 className="text-3xl font-bold mb-6">Przelicznik opłacalności subskrypcji</h1>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <label className="flex flex-col">
          Koszt miesięczny (PLN):
          <input
            type="number"
            value={monthlyCost}
            onChange={(e) => setMonthlyCost(parseFloat(e.target.value))}
            className="mt-1 p-2 border rounded bg-white text-black"
          />
        </label>

        <label className="flex flex-col">
          Liczba godzin użycia w miesiącu:
          <input
            type="number"
            value={hoursUsed}
            onChange={(e) => setHoursUsed(parseFloat(e.target.value))}
            className="mt-1 p-2 border rounded bg-white text-black"
          />
        </label>

        <button
          onClick={calculate}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Przelicz
        </button>

        {pricePerHour !== null && (
          <div className="mt-4 p-4 border rounded bg-white text-black">
            <p>Koszt za godzinę: <strong>{pricePerHour.toFixed(2)} PLN</strong></p>
            <p>Ocena: <strong>{verdict}</strong></p>
          </div>
        )}
      </div>
    </main>
  );
}
