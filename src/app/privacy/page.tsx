import Link from "next/link";
import { getBrand } from "@/lib/branding";

const metadataBrand = getBrand();

export const metadata = {
  title: `Privacy Policy | ${metadataBrand.issuingAgent} bookings`,
  description: `How we collect, use, and protect personal data when you book flights through ${metadataBrand.issuingAgent}.`,
};

export default function PrivacyPage() {
  const brand = getBrand();

  return (
    <main className="page-shell pb-safe">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Legal
        </p>
        <h1 className="heading-gradient mt-2 font-[family-name:var(--font-syne)] text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted">
          Last updated 25 July 2026. This policy explains how{" "}
          {brand.issuingAgent} (“we”, “us”) handles personal information when you
          search for and book {brand.airlineName} charter flights on this site.
        </p>

        <div className="prose-privacy mt-10 space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              What we collect
            </h2>
            <p className="mt-2 text-muted">
              When you request a quote or complete a booking we may collect your
              name, email address, phone number, passport number, nationality,
              travel dates, payment and billing details (processed by Stripe for
              card payments), and messages you send us about your booking.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              How we use it
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-muted">
              <li>To hold seats, create bookings, invoices, and e-tickets</li>
              <li>To process card payments or verify bank transfers</li>
              <li>To email invoices, confirmation, and travel documents</li>
              <li>To prevent fraud and keep the booking system secure</li>
              <li>To respond to support requests about your reservation</li>
            </ul>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              Who we share it with
            </h2>
            <p className="mt-2 text-muted">
              We share only what is needed to fulfil your booking:{" "}
              {brand.airlineName} / operational partners for travel documents,
              Stripe for card processing, our email provider for transactional
              messages, and our hosting/database provider. We do not sell your
              personal information.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              Retention
            </h2>
            <p className="mt-2 text-muted">
              Booking and invoice records are kept for as long as required for
              aviation, tax, and dispute resolution purposes. Soft-held quotes
              that are not completed expire automatically and related temporary
              data is removed or marked expired.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              Your choices
            </h2>
            <p className="mt-2 text-muted">
              You can ask for access to, correction of, or deletion of personal
              data we hold about you where applicable law allows. Contact{" "}
              <a
                href={`mailto:${brand.supportEmail || brand.agentEmail}`}
                className="font-semibold text-accent underline"
              >
                {brand.supportEmail || brand.agentEmail}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              Cookies &amp; session
            </h2>
            <p className="mt-2 text-muted">
              We use a session cookie so your cart, seat holds, and checkout stay
              tied to your browser. It is required for booking and is not used
              for advertising.
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm text-muted">
          <Link
            href="/"
            className="font-semibold text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Back to search
          </Link>
        </p>
      </div>
    </main>
  );
}
