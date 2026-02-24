import { Compass, Home, MessageSquare, Users } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
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
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 pb-24 pt-4 lg:px-6 lg:pb-6">
        <aside className="hidden w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:block">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{appTitle}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{appSubtitle}</p>
          <div className="mt-5">{modeSelector}</div>
          <nav className="mt-6 space-y-1">
            {navigationItems.map((item, index) => {
              const IconComponent = icons[index % icons.length];
              return (
                <NavLink
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    }`
                  }
                  key={item.id}
                  to={item.href}
                  end={item.href === "/"}
                >
                  <IconComponent className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-2 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {navigationItems.slice(0, 4).map((item, index) => {
            const IconComponent = icons[index % icons.length];
            return (
              <NavLink
                className={({ isActive }) =>
                  `flex flex-col items-center rounded-lg px-2 py-1 text-xs transition ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`
                }
                key={item.id}
                to={item.href}
                end={item.href === "/"}
              >
                <IconComponent className="mb-1 h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}