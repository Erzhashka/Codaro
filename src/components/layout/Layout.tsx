import { Compass, Home, MessageSquare, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { NavigationItem } from "../../types";

type LayoutProps = {
  appTitle: string;
  appSubtitle: string;
  navigationItems: NavigationItem[];
  modeSelector: ReactNode;
  children: ReactNode;
};

const icons = [Home, Users, Compass, MessageSquare];

export function Layout({ appTitle, appSubtitle, navigationItems, modeSelector, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 pb-24 pt-4 lg:px-6 lg:pb-6">
        <aside className="hidden w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-5 lg:block">
          <p className="text-lg font-semibold text-slate-900">{appTitle}</p>
          <p className="mt-1 text-sm text-slate-500">{appSubtitle}</p>
          <div className="mt-5">{modeSelector}</div>
          <nav className="mt-6 space-y-1">
            {navigationItems.map((item, index) => {
              const IconComponent = icons[index % icons.length];
              return (
                <a
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  href={item.href}
                  key={item.id}
                >
                  <IconComponent className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {navigationItems.slice(0, 4).map((item, index) => {
            const IconComponent = icons[index % icons.length];
            return (
              <a
                className="flex flex-col items-center rounded-lg px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                href={item.href}
                key={item.id}
              >
                <IconComponent className="mb-1 h-4 w-4" />
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}