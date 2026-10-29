import { Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { DashboardSection, InlineSelect } from "./Section";
import { MiniLine } from "./Charts";
import type { Pt } from "@/lib/demo/dashboard";
import { cn } from "@/lib/utils";

/** MailerLite's Forms/Sites layout: heading dropdown, supporting text + manage link, two metric columns with tiny trends. */
export function CollectionSection({ icon, title, options, value, onValueChange, supporting, manageLabel, manageTo, paid, conversion, className }: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (v: string) => void;
  supporting: string;
  manageLabel: string;
  manageTo: string;
  paid: { label: string; value: string; series: Pt[] };
  conversion: { label: string; value: string; series: Pt[] };
  className?: string | undefined;
}) {
  return (
    <DashboardSection icon={icon} title={title} className={className}>
      <div className="grid lg:grid-cols-3">
        <div className="p-6 lg:border-r">
          <InlineSelect value={value} onChange={onValueChange} options={options} className="text-base" />
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{supporting}</p>
          <Link to={manageTo} className="mt-6 inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline">
            {manageLabel}
          </Link>
        </div>
        {[
          { m: paid, cls: "lg:border-l" },
          { m: conversion, cls: "border-t lg:border-t-0 lg:border-l" },
        ].map(({ m, cls }) => (
          <div key={m.label} className={cn("p-6", cls)}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-sm font-medium">{m.label}</p>
              <p className="tnum shrink-0 text-3xl font-semibold tracking-tight">{m.value}</p>
            </div>
            <div className="mt-6">
              <MiniLine data={m.series} />
            </div>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}
