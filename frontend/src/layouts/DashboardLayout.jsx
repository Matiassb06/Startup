import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";

/* ─── Drawer animation ─── */
const drawerVariants = {
  closed: { x: "-100%", transition: { type: "spring", stiffness: 400, damping: 40 } },
  open: { x: 0, transition: { type: "spring", stiffness: 400, damping: 40 } },
};

export default function DashboardLayout({
  title,
  navSection = "Navegación",
  userName,
  userRole,
  navItems = [],
  bottomNavItems = [],
  activeTab,
  onTabChange,
  onLogout,
  statusToast,
  onDismissStatus,
  headerActions,
  children,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const initials = userName
    ? userName.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const roleLabels = { student: "Estudiante", company: "Empresa", admin: "Administrador" };
  const roleDisplay = roleLabels[userRole] || userRole;

  /* ─── Render a nav button ─── */
  const NavButton = ({ item, onNavigate }) => {
    const isActive = activeTab === item.key;
    const Icon = item.icon;
    return (
      <button
        onClick={() => {
          onTabChange(item.key);
          onNavigate?.();
        }}
        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
          isActive
            ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-zinc-200"
        }`}
      >
        <Icon
          className={`h-[18px] w-[18px] shrink-0 transition-colors ${
            isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-400"
          }`}
        />
        <span className="flex-1 text-left">{item.label}</span>
        {item.count !== null && item.count !== undefined && (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
              isActive ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-zinc-500"
            }`}
          >
            {item.count}
          </span>
        )}
      </button>
    );
  };

  /* ─── Sidebar content (shared desktop & mobile) ─── */
  const SidebarContent = ({ onNavigate }) => (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-900">
      {/* Logo — click goes to first tab (dashboard main view) */}
      <button
        onClick={() => {
          onTabChange(navItems[0]?.key);
          onNavigate?.();
        }}
        className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 dark:border-white/[0.06] px-5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-white">Train-to-Hire</span>
      </button>

      {/* ═══ UPPER ZONE: Main Navigation ═══ */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
          {navSection}
        </p>
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavButton key={item.key} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      {/* ═══ LOWER ZONE: Preferences / System ═══ */}
      <div className="shrink-0 border-t border-gray-200 dark:border-white/[0.06] px-3 py-3">
        {/* Bottom nav items (Currículum, Ajustes, Perfil Empresa, etc.) */}
        {bottomNavItems.length > 0 && (
          <div className="mb-1 space-y-1">
            {bottomNavItems.map((item) => (
              <NavButton key={item.key} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-500 dark:text-zinc-400 transition-all duration-150 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-gray-500 dark:text-zinc-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
          <span className="flex-1 text-left">Cerrar Sesión</span>
        </button>
      </div>

      {/* User card */}
      <div className="shrink-0 border-t border-gray-200 dark:border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800 dark:text-zinc-200">{userName}</p>
            <span className="inline-block rounded-full bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {roleDisplay}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="flex h-screen overflow-hidden bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
    >
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col border-r border-gray-200 dark:border-white/[0.06] bg-white dark:bg-zinc-900">
        <SidebarContent />
      </aside>

      {/* ─── Mobile Drawer ─── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              key="drawer"
              variants={drawerVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 shadow-2xl shadow-black/10 dark:shadow-black/40 lg:hidden"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Area ─── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-950/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</h1>
          <div className="flex items-center gap-2">{headerActions}</div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex shrink-0 items-center justify-between border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/50 px-8 py-5 backdrop-blur-sm">
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-100">{title}</h1>
          <div className="flex items-center gap-3">{headerActions}</div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Status toast */}
            <AnimatePresence>
              {statusToast?.message && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="mb-6"
                >
                  <div
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm shadow-sm ${
                      statusToast.type === "success"
                        ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    <span>{statusToast.message}</span>
                    <button
                      onClick={onDismissStatus}
                      className="ml-3 text-xs font-medium underline opacity-60 hover:opacity-100 transition-opacity"
                    >
                      cerrar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
