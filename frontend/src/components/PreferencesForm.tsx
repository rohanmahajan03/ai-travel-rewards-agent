import { FormEvent, useEffect, useRef, useState } from "react";

import { ApiError, type PreferencesOptions, type PreferencesUpdate } from "../lib/api";

type PreferencesFormProps = {
  options: PreferencesOptions;
  initialValues?: {
    home_city: string;
    cards: string[];
    destination_interests: string[] | null;
    cabin_preference: string | null;
    date_flexibility: string | null;
  };
  submitLabel: string;
  onSubmit: (values: PreferencesUpdate) => Promise<void>;
};

type FieldErrors = {
  homeCity?: string;
  cards?: string;
};

function collectFieldErrors(homeCity: string, cards: string[]): FieldErrors {
  const errors: FieldErrors = {};

  if (!homeCity) {
    errors.homeCity = "Please select your home city.";
  }
  if (cards.length === 0) {
    errors.cards = "Please select at least one rewards card.";
  }

  return errors;
}

export default function PreferencesForm({
  options,
  initialValues,
  submitLabel,
  onSubmit,
}: PreferencesFormProps) {
  const formTopRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [homeCity, setHomeCity] = useState(initialValues?.home_city ?? "");
  const [cards, setCards] = useState<string[]>(initialValues?.cards ?? []);
  const [destinationInterests, setDestinationInterests] = useState<string[]>(
    initialValues?.destination_interests ?? [],
  );
  const [cabinPreference, setCabinPreference] = useState(
    initialValues?.cabin_preference ?? "",
  );
  const [dateFlexibility, setDateFlexibility] = useState(
    initialValues?.date_flexibility ?? "",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (formError) {
      formTopRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [formError]);

  function toggleCard(cardId: string) {
    setCards((current) => {
      const next = current.includes(cardId)
        ? current.filter((id) => id !== cardId)
        : [...current, cardId];

      if (next.length > 0) {
        setFieldErrors((errors) => ({ ...errors, cards: undefined }));
      }

      return next;
    });
  }

  function toggleDestination(interestId: string) {
    setDestinationInterests((current) =>
      current.includes(interestId)
        ? current.filter((id) => id !== interestId)
        : [...current, interestId],
    );
  }

  function handleHomeCityChange(value: string) {
    setHomeCity(value);
    if (value) {
      setFieldErrors((errors) => ({ ...errors, homeCity: undefined }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = collectFieldErrors(homeCity, cards);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please complete all required fields before saving.");
      return;
    }

    setFieldErrors({});

    const payload: PreferencesUpdate = {
      home_city: homeCity,
      cards,
      destination_interests: destinationInterests.length > 0 ? destinationInterests : null,
      cabin_preference: cabinPreference || null,
      date_flexibility: dateFlexibility || null,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCity = options.cities.find((city) => city.id === homeCity);

  return (
    <form ref={formRef} className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div ref={formTopRef} className="scroll-mt-4" />
      {formError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      <section className="space-y-2">
        <label htmlFor="home-city" className="block text-sm font-semibold text-slate-900">
          Home city <span className="text-red-600">*</span>
        </label>
        <p className="text-sm text-slate-500">Where do you usually fly from?</p>
        <select
          id="home-city"
          value={homeCity}
          onChange={(event) => handleHomeCityChange(event.target.value)}
          aria-invalid={Boolean(fieldErrors.homeCity)}
          aria-describedby={fieldErrors.homeCity ? "home-city-error" : undefined}
          data-invalid={fieldErrors.homeCity ? "true" : undefined}
          className={`w-full rounded-md border px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 ${
            fieldErrors.homeCity ? "border-red-400" : "border-slate-300"
          }`}
        >
          <option value="">Select a city</option>
          {options.cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        {fieldErrors.homeCity && (
          <p id="home-city-error" className="text-sm text-red-600">
            {fieldErrors.homeCity}
          </p>
        )}
        {selectedCity && (
          <p className="text-xs text-slate-500">
            Nearby airports: {selectedCity.airports.join(", ")}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">
          Rewards cards <span className="text-red-600">*</span>
        </h3>
        <p className="text-sm text-slate-500">Select all cards you currently hold.</p>
        <div
          className={`grid gap-2 sm:grid-cols-2 ${
            fieldErrors.cards ? "rounded-md border border-red-200 p-2" : ""
          }`}
        >
          {options.cards.map((card) => (
            <label
              key={card.id}
              className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={cards.includes(card.id)}
                onChange={() => toggleCard(card.id)}
                className="mt-0.5"
              />
              <span className="text-sm text-slate-700">
                <span className="font-medium">{card.name}</span>
              </span>
            </label>
          ))}
        </div>
        {fieldErrors.cards && (
          <p id="cards-error" className="text-sm text-red-600">
            {fieldErrors.cards}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">Destination interests</h3>
        <p className="text-sm text-slate-500">Optional — where do you like to travel?</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {options.destination_interests.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={destinationInterests.includes(item.id)}
                onChange={() => toggleDestination(item.id)}
              />
              <span className="text-sm text-slate-700">{item.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="cabin" className="block text-sm font-semibold text-slate-900">
            Cabin preference
          </label>
          <select
            id="cabin"
            value={cabinPreference}
            onChange={(event) => setCabinPreference(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          >
            <option value="">No preference</option>
            {options.cabin_preferences.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="flexibility" className="block text-sm font-semibold text-slate-900">
            Date flexibility
          </label>
          <select
            id="flexibility"
            value={dateFlexibility}
            onChange={(event) => setDateFlexibility(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          >
            <option value="">No preference</option>
            {options.date_flexibility_options.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
