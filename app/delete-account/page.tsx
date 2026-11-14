import type { Metadata } from "next";
import { H2, LegalPage, P, UL } from "../components/LegalPage";
import { PRIVACY_EMAIL } from "../lib/legal";
import DeleteAccountClient from "./DeleteAccountClient";

export const metadata: Metadata = {
  title: "Delete your account · Cape Wine Pass",
  description: "How to delete your Cape Wine Pass account and personal information.",
};

export default function DeleteAccountPage() {
  return (
    <LegalPage eyebrow="Cape Wine Pass" title="Delete your account">
      <P>You can delete your Cape Wine Pass account and personal information at any time, in any of these ways.</P>

      <H2>In the app</H2>
      <P>Open the <strong>You</strong> tab, scroll to the bottom and tap <strong>Delete my account</strong>, then confirm.</P>

      <H2>On this website</H2>
      <DeleteAccountClient />

      <H2>By email</H2>
      <P>
        If you can&apos;t sign in, email{" "}
        <a href={`mailto:${PRIVACY_EMAIL}?subject=Delete%20my%20Cape%20Wine%20Pass%20account`} style={{ color: "var(--gold-light)" }}>{PRIVACY_EMAIL}</a>{" "}
        from the email address on your account. We will delete it within 30 days and confirm by email.
      </P>

      <H2>What gets deleted</H2>
      <UL>
        <li>Your sign-in details (email and password) and your profile, including your photo.</li>
        <li>All your visits, check-ins, ratings, notes, favourite wines and saved locations.</li>
        <li>Your followers, who you follow, cheers, blocks and reports.</li>
      </UL>
      <P>
        Deletion happens straight away and can&apos;t be undone. Copies in our providers&apos; backups are overwritten
        within about 30 days. Wines you added to an estate&apos;s shared wine list stay on the list, without your name.
      </P>
    </LegalPage>
  );
}
