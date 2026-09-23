"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { Menu, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { WorkspaceNav } from "@/components/workspace-nav";
import { PlayerSwitcher } from "@/components/player-switcher";
import { useFcStore } from "@/hooks/use-fc-store";
import { getSettings } from "@/lib/services/fc-service";

function Brand({ groupName }: { groupName?: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-goat-lime text-black">
        <Trophy className="size-5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-black tracking-tight">FC GOAT Tracker</span>
        {groupName ? <span className="text-xs text-muted-foreground">{groupName}</span> : null}
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: settings } = useFcStore(getSettings);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh w-full">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-border bg-sidebar py-6 md:flex">
        <div className="px-4">
          <Brand groupName={settings?.groupName} />
        </div>
        <WorkspaceNav />
        <div className="mt-auto px-3">
          <Button
            render={<Link href="/matches/new" />}
            nativeButton={false}
            className="w-full gap-2 bg-goat-lime text-black hover:bg-goat-lime-2"
          >
            <Plus className="size-4" />
            Registrar partido
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur supports-backdrop-filter:bg-background/70 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>

          <div className="md:hidden">
            <Brand />
          </div>

          <div className="flex-1" />

          <PlayerSwitcher />
        </header>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 bg-sidebar p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navegación</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 py-6">
              <div className="px-4">
                <Brand groupName={settings?.groupName} />
              </div>
              <WorkspaceNav onNavigate={() => setMobileOpen(false)} />
              <div className="px-3">
                <Button
                  render={<Link href="/matches/new" onClick={() => setMobileOpen(false)} />}
                  nativeButton={false}
                  className="w-full gap-2 bg-goat-lime text-black hover:bg-goat-lime-2"
                >
                  <Plus className="size-4" />
                  Registrar partido
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
