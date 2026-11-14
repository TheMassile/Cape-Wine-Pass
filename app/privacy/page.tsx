import type { Metadata } from "next";
import Link from "next/link";
import { H2, LegalPage, P, UL } from "../components/LegalPage";
import { POLICY_UPDATED, PRIVACY_EMAIL, RESPONSIBLE_PARTY } from "../lib/legal";

export const metadata: Metadata = {
  title: "Privacy policy · Cape Wine Pass",
  description: "How Cape Wine Pass collects, uses and protects your personal information, in line with POPIA.",
};

const mail = <a href={`mailto:${PRIVACY_EMAIL}`} style={{ color: "var(--gold-light)" }}>{PRIVACY_EMAIL}</a>;

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow={`Last updated ${POLICY_UPDATED}`} title="Privacy policy">
      <P>
        Cape Wine Pass (the website at capewinepass.co.za and the Cape Wine Pass app) helps you discover Western Cape
        wine estates, keep track of your visits and share them with friends. This policy explains what personal
        information we collect, why, who can see it and the choices you have. We follow South Africa&apos;s Protection
        of Personal Information Act (POPIA).
      </P>

      <H2>Who is responsible</H2>
      <P>
        Cape Wine Pass is run by {RESPONSIBLE_PARTY}, who is the responsible party and Information Officer under POPIA.
        For any privacy question or request, email {mail}.
      </P>

      <H2>What we collect</H2>
      <UL>
        <li><strong>Your account:</strong> your email address and a password (stored only in scrambled, hashed form), and confirmation that you are 18 or older.</li>
        <li><strong>Your profile:</strong> the handle, display name, home region, short bio and profile photo you choose to add.</li>
        <li><strong>Your wine journey:</strong> estates you visit and check in to, the date, your star rating, notes, favourite wines and estates you mark as favourites.</li>
        <li><strong>Location, only when you check in or use Near me:</strong> the app asks your phone for its location while you are using it. We use it to show nearby estates and to confirm you were at the estate when you checked in. For check-ins, we save the location with that visit. We never track your location in the background.</li>
        <li><strong>Social activity:</strong> who you follow and who follows you, cheers you give, people you block and reports you make.</li>
        <li><strong>Contributions:</strong> wines you add to an estate&apos;s wine list and kid-friendly votes.</li>
        <li><strong>Technical information:</strong> our hosting providers keep standard logs (such as IP address and device type) to keep the service secure and working.</li>
      </UL>
      <P>We do not collect payment details from members, and we do not use advertising trackers.</P>

      <H2>Why we use it</H2>
      <UL>
        <li>To run your account and show you your visits, badges and progress.</li>
        <li>To power the social features you choose to use: the feed, followers, cheers and leaderboards.</li>
        <li>To verify check-ins for leaderboards fairly.</li>
        <li>To keep the community safe, including handling reports and blocks.</li>
        <li>To keep the service working and secure, and to fix problems.</li>
      </UL>
      <P>
        We use your information because you asked us to provide the service (POPIA section 11(1)(b)) and, for location,
        because you gave permission on your phone, which you can withdraw at any time in your phone settings.
      </P>

      <H2>Who can see your information</H2>
      <P>
        You choose who sees your profile and visits under <em>You → Who can see my visits</em> in the app:
        <strong> Everyone</strong>, <strong>Followers</strong> (only people you approve) or <strong>Only me</strong>.
        Your email address and the exact location saved with a check-in are never shown to other members. Blocked people
        can&apos;t see you or follow you.
      </P>
      <P>
        Sponsored spots such as &ldquo;Wine farm of the week&rdquo; are paid by wine estates to appear on the home page.
        Sponsors do not receive any member information.
      </P>
      <P><strong>We never sell your personal information.</strong></P>

      <H2>Service providers and storage outside South Africa</H2>
      <P>We use a few trusted providers to run Cape Wine Pass. They process information only on our behalf:</P>
      <UL>
        <li><strong>Supabase:</strong> database, file storage and sign-in.</li>
        <li><strong>Vercel:</strong> hosting for the website.</li>
        <li><strong>Expo:</strong> building and delivering the app.</li>
        <li><strong>Google Play and the Apple App Store:</strong> app downloads, under their own privacy policies.</li>
      </UL>
      <P>
        Some of these providers store information on servers outside South Africa. We only use providers that protect
        personal information to a standard comparable to POPIA (section 72).
      </P>

      <H2>How long we keep it</H2>
      <P>
        We keep your information for as long as you have an account. When you delete your account, your profile, visits,
        check-ins, follows, cheers, blocks and reports are deleted straight away. Copies in our providers&apos; backups are
        overwritten within about 30 days. Wines you added to an estate&apos;s list stay on the list without your name.
      </P>

      <H2>Your rights</H2>
      <P>Under POPIA you may:</P>
      <UL>
        <li>ask what personal information we hold about you and get a copy;</li>
        <li>correct your information (most of it you can edit yourself in the app or on the website);</li>
        <li>delete your account and information at any time: see <Link href="/delete-account" style={{ color: "var(--gold-light)" }}>Delete your account</Link>;</li>
        <li>object to how we use your information; and</li>
        <li>
          complain to the Information Regulator at{" "}
          <a href="https://inforegulator.org.za" style={{ color: "var(--gold-light)" }}>inforegulator.org.za</a> or{" "}
          <a href="mailto:POPIAComplaints@inforegulator.org.za" style={{ color: "var(--gold-light)" }}>POPIAComplaints@inforegulator.org.za</a>.
        </li>
      </UL>
      <P>To make a request, email {mail}. We will reply within 30 days.</P>

      <H2>Age</H2>
      <P>
        Cape Wine Pass is about wine and is only for people aged 18 and over. We do not knowingly collect information
        from anyone under 18. If you think a child has signed up, email us and we will delete the account.
      </P>

      <H2>Security</H2>
      <P>
        Information is sent over encrypted connections, passwords are hashed, and database rules make sure members can
        only see what the owner allows. No system is perfect. If a breach ever affects your information, we will tell
        you and the Information Regulator as POPIA requires.
      </P>

      <H2>Changes</H2>
      <P>
        If we change this policy, we will update the date at the top. If a change is significant, we will tell you
        in the app or by email.
      </P>
    </LegalPage>
  );
}
