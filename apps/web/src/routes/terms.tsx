import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="August 12, 2026">
      <Section title="What Prezzy is">
        <p>
          Prezzy is a free, web-based tool for creating and presenting interactive presentations,
          operated by Arif Kobel (arif@kobel.click). By creating an account or using the service you
          agree to these terms.
        </p>
      </Section>

      <Section title="Your account">
        <p>
          You need an account to create presentations, and you must be at least 18 years old. Keep
          your credentials confidential; you are responsible for
          activity under your account. You can sign in with a password or with Google. Audience
          members joining a session with a join code do not need an account.
        </p>
      </Section>

      <Section title="Your content">
        <p>
          Presentations, slides, and files you upload remain yours. You grant us the technical
          rights needed to store, display, and transmit them so the service works, nothing more. You
          are responsible for the content you upload and present, including content your audience
          submits during your sessions, and for having the rights to use it.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>
          Do not use Prezzy to distribute illegal content, malware, or spam, to infringe the rights
          of others, to harvest data, or to attack, probe, or overload the service. We may remove
          content or suspend accounts that violate these rules.
        </p>
      </Section>

      <Section title="Availability and warranty">
        <p>
          Prezzy is provided free of charge and as is. We do not warrant uninterrupted availability
          or fitness for a particular purpose, and we may change, suspend, or discontinue features
          at any time. Keep local copies of anything important.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          We are liable without limitation for intent, gross negligence, and injury to life, body,
          or health. For simple negligence we are liable only for breaches of essential contractual
          duties, limited to the damage typical and foreseeable for a free service of this kind.
          Liability for data loss is limited to the effort of restoration from reasonable backups.
        </p>
      </Section>

      <Section title="Termination">
        <p>
          You can stop using the service at any time and have your account deleted by emailing
          arif@kobel.click. We may terminate or suspend access for violations of these terms, with
          reasonable notice where feasible.
        </p>
      </Section>

      <Section title="Final provisions">
        <p>
          German law applies, excluding the UN Convention on Contracts for the International Sale of
          Goods; statutory consumer protections of your country of residence remain unaffected. We
          are neither obligated nor willing to participate in dispute resolution before a consumer
          arbitration board (§ 36 VSBG). If a provision of these terms is invalid, the rest remains
          in effect.
        </p>
        <p>
          We may update these terms as the service evolves. The current version is always available
          at this page, with the date of the last change shown above.
        </p>
      </Section>
    </LegalPage>
  );
}
