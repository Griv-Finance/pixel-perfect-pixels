import { describe, expect, it, beforeEach } from "vitest";
import { searchSettings, SETTINGS } from "@/lib/settings/registry";
import {
  INITIAL_MEMBERS, isLastActiveOwner, membersStore, removeMember, setMemberStatus, changeMemberRole, togglePermission, viewerStore,
  can, parseInviteEmails, reviewAccessRequest, accessRequestsStore,
} from "@/lib/demo/settings/access";
import { cannotApproveReason, decide, requestsStore, rulesStore, canSetDefault, type ApprovalRequest } from "@/lib/demo/settings/finance";
import { forEnv, validateIpOrCidr, wouldBlock, apiKeysStore, createApiKey, ipMatches, type IpRule } from "@/lib/demo/settings/developers";
import { ALL_EVENTS, normalize, setPref, prefsStore, isLocked } from "@/lib/demo/settings/notifications";
import { overallVerification, validateDocFile, splitVerifiedChanges, businessStore, type ComplianceDoc } from "@/lib/demo/settings/business";
import { SETTINGS_PAGES } from "@/components/griv/settings/pages";

const slugs = (q: string) => searchSettings(q).map((s) => s.slug);

describe("Settings directory and search", () => {
  it("every setting has its own page", () => {
    for (const s of SETTINGS) expect(SETTINGS_PAGES[s.slug], s.slug).toBeDefined();
  });
  it("'password' finds Security & authentication", () => expect(slugs("password")).toContain("security"));
  it("'bank' finds Settlement accounts", () => expect(slugs("bank")).toContain("settlement-accounts"));
  it("'API' finds API keys, Webhooks and API logs", () => expect(slugs("API")).toEqual(expect.arrayContaining(["api-keys", "webhooks", "api-logs"])));
  it("'team' finds Team & permissions", () => expect(slugs("team")[0]).toBe("team"));
  it("'invoice' finds Invoice settings", () => expect(slugs("invoice")).toContain("invoices"));
});

describe("Team permissions", () => {
  beforeEach(() => { membersStore.set(INITIAL_MEMBERS); viewerStore.set("mem_owner"); });

  it("the last active Owner can't be removed, suspended or demoted", () => {
    expect(isLastActiveOwner(membersStore.get(), "mem_owner")).toBe(true);
    viewerStore.set("mem_owner");
    // Removing yourself is blocked separately; check as if another admin acted.
    membersStore.set((all) => [...all, { id: "mem_admin", name: "Admin", email: "a@x.ng", roleId: "admin", status: "Active", lastSignIn: null, addedAt: "2026-01-01" }]);
    viewerStore.set("mem_admin");
    expect(removeMember("mem_owner").error).toMatch(/only active Owner/);
    expect(setMemberStatus("mem_owner", "Suspended").error).toMatch(/only active Owner/);
    expect(changeMemberRole("mem_owner", "viewer").error).toMatch(/only active Owner/);
  });

  it("a Viewer can't manage the team", () => {
    viewerStore.set("mem_femi");
    expect(can("team.manage")).toBe(false);
    expect(removeMember("mem_seyi").error).toMatch(/permission/);
  });

  it("turning on Approve payouts also turns on View payouts; removing View removes the rest", () => {
    const on = togglePermission([], "transfers_payouts.approve");
    expect(on).toEqual(expect.arrayContaining(["transfers_payouts.approve", "transfers_payouts.view"]));
    expect(togglePermission(on, "transfers_payouts.view")).toEqual([]);
  });

  it("invites reject bad and already-used emails", () => {
    const r = parseInviteEmails("new@x.ng, bad-email, ada@novaretail.ng", membersStore.get(), []);
    expect(r.valid).toEqual(["new@x.ng"]);
    expect(r.invalid).toEqual(["bad-email"]);
    expect(r.existing).toEqual(["ada@novaretail.ng"]);
  });

  it("nobody can review their own access request", () => {
    accessRequestsStore.set((all) => [{ id: "acr_self", memberId: "mem_owner", requested: "x", resource: "x", reason: "", createdAt: "2026-10-01", status: "Pending" }, ...all]);
    expect(reviewAccessRequest("acr_self", "Approved").error).toMatch(/own request/);
  });
});

describe("Approvals", () => {
  beforeEach(() => { membersStore.set(INITIAL_MEMBERS); viewerStore.set("mem_owner"); });
  const rule = () => rulesStore.get().find((r) => r.id === "rule_1")!;
  const req = (patch: Partial<ApprovalRequest> = {}): ApprovalRequest => ({ id: "APR-T", title: "t", ruleId: "rule_1", requestedBy: "mem_tunde", amount: 6_000_000, currency: "NGN", createdAt: "2026-10-20", status: "Pending", decisions: [], reference: "PAY-T", ...patch });

  it("people can't approve their own request when the rule forbids it", () => {
    expect(cannotApproveReason(req(), rule(), "mem_tunde")).toMatch(/you made/);
  });
  it("a Viewer can't approve", () => expect(cannotApproveReason(req(), rule(), "mem_femi")).toMatch(/can't approve/));
  it("payouts above ₦5,000,000 need two approvals before they're approved", () => {
    requestsStore.set((all) => [req(), ...all]);
    viewerStore.set("mem_chioma");
    expect(decide("APR-T", "Approved").request?.status).toBe("Pending");
    viewerStore.set("mem_owner"); // Owner is not in this rule's roles (Finance Manager or Administrator)
    expect(decide("APR-T", "Approved").error).toMatch(/needs/);
    membersStore.set((all) => all.map((m) => (m.id === "mem_seyi" ? { ...m, roleId: "admin" } : m)));
    viewerStore.set("mem_seyi");
    expect(decide("APR-T", "Approved").request?.status).toBe("Approved");
  });
});

describe("Developer settings stay in their environment", () => {
  it("Live pages never list Test keys and vice versa", () => {
    createApiKey("test", "Only test");
    expect(forEnv(apiKeysStore.get(), "live").every((k) => k.env === "live")).toBe(true);
    expect(forEnv(apiKeysStore.get(), "live").some((k) => k.label === "Only test")).toBe(false);
  });
  it("a new secret is returned once and only its last 4 characters are stored", () => {
    const { key, secret } = createApiKey("live", "Once");
    expect(secret.startsWith("sk_live_")).toBe(true);
    expect(key.secretLast4).toBe(secret.slice(-4));
    expect(JSON.stringify(apiKeysStore.get())).not.toContain(secret);
  });
  it("IP whitelist accepts IPv4, IPv6 and CIDR, and rejects junk", () => {
    for (const ok of ["105.112.216.228", "34.89.120.0/24", "2001:db8::/32", "::1"]) expect(validateIpOrCidr(ok), ok).toBeNull();
    for (const bad of ["300.1.1.1", "10.0.0.0/40", "hello", "1.2.3", "2001:db8:::1"]) expect(validateIpOrCidr(bad), bad).not.toBeNull();
  });
  it("warns when the current IP would be blocked", () => {
    const rule = (value: string): IpRule => ({ id: value, env: "live", value, label: "", addedAt: "", addedBy: "", status: "Active" });
    expect(ipMatches("34.89.120.14", "34.89.120.0/24")).toBe(true);
    expect(wouldBlock("105.112.216.228", [rule("34.89.120.0/24")])).toBe(true);
    expect(wouldBlock("105.112.216.228", [])).toBe(false);
  });
});

describe("Notifications, compliance and settlements", () => {
  it("required security alerts can't be switched off by email or in-app", () => {
    const ev = ALL_EVENTS.find((e) => e.id === "password_changed")!;
    expect(isLocked(ev, "email")).toBe(true);
    const p = setPref(prefsStore.get(), "password_changed", "email", false);
    expect(p["password_changed"]!.email).toBe(true);
  });
  it("channels Griv can't send on stay off", () => {
    const p = normalize({ ...prefsStore.get(), features: { email: true, sms: true, push: true, inApp: true } });
    expect(p["features"]!.sms).toBe(false);
  });
  it("uploading documents never makes the business Verified", () => {
    const docs: ComplianceDoc[] = [{ id: "a", name: "A", requirement: "Required", section: "Business", status: "In review", uploadedAt: "x", updatedAt: "x", fileName: "a.pdf" }];
    expect(overallVerification(docs, 0)).not.toBe("Verified");
    expect(validateDocFile({ type: "application/zip", size: 10, name: "a.zip" })).toMatch(/PDF/);
    expect(validateDocFile({ type: "application/pdf", size: 11 * 1024 * 1024, name: "a.pdf" })).toMatch(/10 MB/);
  });
  it("changing registered details goes to review instead of applying", () => {
    const before = businessStore.get();
    const { direct, review } = splitVerifiedChanges(before, { ...before, legalName: "New Name Ltd", supportEmail: "help@x.ng" });
    expect(review).toEqual({ legalName: "New Name Ltd" });
    expect(direct).toEqual({ supportEmail: "help@x.ng" });
  });
  it("only verified accounts can become the default settlement account", () => {
    expect(canSetDefault({ id: "x", bank: "b", accountName: "n", last4: "1", currency: "NGN", country: "Nigeria", status: "Pending verification", isDefault: false, addedAt: "" })).toMatch(/verified/);
  });
});
