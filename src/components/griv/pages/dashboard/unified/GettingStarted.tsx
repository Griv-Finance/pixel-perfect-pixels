import { useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { FormDialog } from "@/components/griv/kit";
import {
  ONBOARDING_TASKS,
  completeOnboardingTask,
  onboardingAllDone,
  useOnboarding,
} from "@/lib/demo/dashboard";
import { cn } from "@/lib/utils";

/**
 * MailerLite's "Ready to get started?" checklist: two columns, completed tasks show a green
 * check, and the whole section hides once every task is done.
 */
export function GettingStarted() {
  const done = useOnboarding();
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  if (onboardingAllDone(done)) return null;

  return (
    <>
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="grid lg:grid-cols-[1fr_1.25fr]">
          <div className="p-8 lg:border-r">
            <h2 className="text-2xl font-semibold tracking-tight">Ready to get started?</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              You're ready to start taking payments, invoicing customers and selling online with
              Griv. Cross off the final task to unlock your account completely.
            </p>
            <p className="mt-10 text-sm font-semibold">Need help?</p>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              Read this guide to set up your account
            </button>
          </div>
          <div>
            {ONBOARDING_TASKS.map((t, i) => {
              const isDone = !!done[t.id];
              return (
                <div key={t.id} className={cn("flex items-center gap-4 px-8 py-6", i < ONBOARDING_TASKS.length - 1 && "border-b")}>
                  {isDone ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-success" aria-label="Completed" />
                  ) : (
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-medium", isDone && "text-muted-foreground")}>{t.label}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>
                  </div>
                  {isDone ? (
                    <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                      Done <ChevronRight className="h-4 w-4" aria-hidden />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVerifyOpen(true)}
                      className="flex shrink-0 items-center gap-1 text-sm font-semibold underline-offset-2 hover:text-primary hover:underline"
                    >
                      Complete <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <FormDialog
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        title="Verify your business"
        description="Real document verification isn't wired up in this demo yet. In the live product this opens the verification flow: upload your CAC certificate, ID and proof of address, then track the review."
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                completeOnboardingTask("verify");
                setVerifyOpen(false);
              }}
              className="btn btn-outline h-9 text-sm"
            >
              Mark as verified (demo)
            </button>
            <button type="button" onClick={() => setVerifyOpen(false)} className="btn btn-primary h-9 text-sm">
              Got it
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-lg border border-dashed border-input bg-muted/40 p-4 text-sm">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent font-semibold text-primary">i</span>
          <p className="text-muted-foreground">Nothing was submitted — this step isn't wired up in the demo yet.</p>
        </div>
      </FormDialog>

      <FormDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title="Getting started guide"
        description="The full guide isn't part of this demo yet — this link would open it in the live product."
        footer={
          <button type="button" onClick={() => setHelpOpen(false)} className="btn btn-primary h-9 text-sm">
            Got it
          </button>
        }
      >
        <div className="flex items-start gap-3 rounded-lg border border-dashed border-input bg-muted/40 p-4 text-sm">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent font-semibold text-primary">i</span>
          <p className="text-muted-foreground">Nothing was submitted — this step isn't wired up in the demo yet.</p>
        </div>
      </FormDialog>
    </>
  );
}
