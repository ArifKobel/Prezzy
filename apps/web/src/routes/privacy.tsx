import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 12, 2026">
      <Section title="Who is responsible">
        <p>
          The controller for data processing on prezzy.kobel.click is Arif Kobel. For any questions
          about this policy or your data, contact arif@kobel.click.
        </p>
      </Section>

      <Section title="Hosting">
        <p>
          Prezzy runs on a server operated by netcup GmbH, Karlsruhe, Germany. All application data
          is stored and processed within the European Union. When you access the service, the
          server keeps standard access logs (IP address, timestamp, requested URL, user agent) for
          security monitoring and error diagnosis. Logs are deleted automatically after a short
          period.
        </p>
      </Section>

      <Section title="What data we collect">
        <p>
          Account data: when you sign up we store your name, email address, and a hashed password
          (bcrypt). Passwords are never stored or transmitted in plain text.
        </p>
        <p>
          Content: presentations, slides, and files you upload are stored so we can provide the
          service.
        </p>
        <p>
          Audience participation: when someone joins a presentation with a join code, their answers
          (quiz responses, word cloud entries) are stored with the presentation. Joining does not
          require an account, and we do not link answers to identified persons.
        </p>
      </Section>

      <Section title="Sign in with Google">
        <p>
          If you choose to sign in with Google, we receive your name, email address, and its
          verification status from Google Ireland Limited (Gordon House, Barrow Street, Dublin 4,
          Ireland). We request no access to your Google Drive, contacts, or any other Google data,
          and we never see your Google password. Google may process data in the United States;
          Google LLC is certified under the EU-US Data Privacy Framework. Details are in{" "}
          <a
            href="https://policies.google.com/privacy"
            className="text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Google's privacy policy
          </a>
          . Using Google sign-in is optional; email and password work without any data going to
          Google.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          We use one strictly necessary session cookie (valid 30 days) to keep you signed in, and a
          short-lived cookie (10 minutes) to secure the Google sign-in flow against forgery. Both
          are technically required (§ 25 (2) TDDDG), so no consent banner is needed. We use no
          tracking, analytics, or advertising cookies.
        </p>
      </Section>

      <Section title="Purposes and legal bases">
        <p>
          We process your data solely to provide Prezzy: authenticating you, storing and syncing
          your presentations, and running live sessions. The legal basis is the performance of our
          contract with you (Art. 6 (1) (b) GDPR). Access logs and abuse prevention rest on our
          legitimate interest in keeping the service secure (Art. 6 (1) (f) GDPR). We do not sell
          your data, show ads, build profiles, or make automated decisions about you.
        </p>
      </Section>

      <Section title="Recipients">
        <p>
          Your data stays with us and our hosting provider, who processes it on our behalf under a
          data processing agreement (Art. 28 GDPR). Google receives data only if you actively use
          Google sign-in. There are no other recipients.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Presentations and uploads are kept until you delete them in the app. Your account is kept
          until you ask us to delete it: send a short email to arif@kobel.click and we will remove
          your account and all associated content without undue delay. Server logs are deleted
          automatically after a short period.
        </p>
      </Section>

      <Section title="Security">
        <p>
          All traffic is encrypted in transit (TLS). Passwords are stored as bcrypt hashes, and
          session cookies are HttpOnly and Secure, so scripts cannot read them.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Under the GDPR you have the right to access your data (Art. 15), correct it (Art. 16),
          have it deleted (Art. 17), restrict its processing (Art. 18), and receive it in a portable
          format (Art. 20).
        </p>
        <p className="font-semibold text-foreground">
          You also have the right to object to processing based on legitimate interest (Art. 21
          GDPR).
        </p>
        <p>
          To exercise any of these rights, email arif@kobel.click. You may also lodge a complaint
          with a data protection supervisory authority, for example the one of your federal state or
          country of residence.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update this policy as the service evolves. The current version is always available
          at this page, with the date of the last change shown above.
        </p>
      </Section>
    </LegalPage>
  );
}
