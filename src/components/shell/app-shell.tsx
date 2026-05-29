import { SidebarNav } from "./sidebar-nav";
import { TopBar } from "./top-bar";

export function AppShell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex min-h-0 flex-1">
        <SidebarNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar title={title} actions={actions} />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
