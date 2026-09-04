import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & Support — ModeStack" },
      {
        name: "description",
        content:
          "ModeStack privacy policy and support details: your mode library and stacks stay on your own device, with no accounts, analytics, or third-party tracking.",
      },
      { property: "og:title", content: "Privacy & Support — ModeStack" },
      {
        property: "og:description",
        content:
          "How ModeStack handles data: everything is stored locally on your device. No accounts, no analytics, no third-party sharing.",
      },
    ],
  }),
  component: PrivacyPage,
});

const SUPPORT_EMAIL = "ModeStackApp@gmail.com";

function PrivacyPage() {
  return (
    <div className="space-y-5">
      <section className="hud-panel hud-corner p-4 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          <h1 className="text-sm mono tracking-[0.2em] text-primary glow-text">PRIVACY & SUPPORT</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated: August 2026
        </p>
      </section>

      <section className="hud-panel p-4 space-y-3 text-sm leading-relaxed">
        <h2 className="text-xs mono tracking-[0.2em] text-muted-foreground">// WHAT WE COLLECT</h2>
        <p>
          Nothing. ModeStack has no accounts, no sign-in, and no server-side profile. We do not
          collect, transmit, sell, or share personal information.
        </p>

        <h2 className="text-xs mono tracking-[0.2em] text-muted-foreground pt-2">// WHAT IS STORED ON YOUR DEVICE</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your mode library, including any modes you add or edit.</li>
          <li>Your saved favorite stacks and notes.</li>
          <li>Text you type or dictate into the situation box while the app is open.</li>
        </ul>
        <p>
          This data lives in your browser or app local storage on your own device. It is never
          uploaded to us. Clearing your browser data, or uninstalling the app, deletes it
          permanently. You can also export it yourself at any time as a CSV file from the Vault
          screen.
        </p>

        <h2 className="text-xs mono tracking-[0.2em] text-muted-foreground pt-2">// ANALYTICS & THIRD PARTIES</h2>
        <p>
          ModeStack contains no analytics, no advertising SDKs, no crash reporting, and no
          third-party trackers. It does not use cookies for tracking. Recommendations are computed
          entirely on your device — no prompt or situation text is sent to any AI service.
        </p>
        <p>
          The web version loads a web font from Google Fonts, which means your IP address is visible
          to that provider as part of serving the font. No other outbound request is made.
        </p>

        <h2 className="text-xs mono tracking-[0.2em] text-muted-foreground pt-2">// VOICE INPUT</h2>
        <p>
          The optional microphone button uses your device or browser's built-in speech recognition.
          Depending on your platform, that speech may be processed by your operating system or
          browser vendor under their privacy policy. ModeStack never stores or transmits audio, and
          the microphone is only active while you explicitly hold the recording state on.
        </p>

        <h2 className="text-xs mono tracking-[0.2em] text-muted-foreground pt-2">// CHILDREN</h2>
        <p>
          ModeStack is a general-purpose productivity tool and is not directed at children under 13.
          Because no data is collected, no personal information from any age group is processed.
        </p>

        <h2 className="text-xs mono tracking-[0.2em] text-muted-foreground pt-2">// TERMS OF USE</h2>
        <p>
          ModeStack is provided as-is, without warranty. It suggests reasoning approaches for AI
          prompts; it does not provide legal, medical, or financial advice. You are responsible for
          how you use its output. We may update the app and this page; continued use means you
          accept the current version.
        </p>

        <h2 className="text-xs mono tracking-[0.2em] text-muted-foreground pt-2">// SUPPORT & CONTACT</h2>
        <p>
          Questions, bug reports, or data requests:{" "}
          <a
            className="text-primary underline underline-offset-4"
            href={`mailto:${SUPPORT_EMAIL}`}
          >
            {SUPPORT_EMAIL}
          </a>
          . Because nothing is collected, there is no account to delete on our side — deleting your
          local data removes everything.
        </p>
      </section>
    </div>
  );
}
