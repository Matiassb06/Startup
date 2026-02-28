import { AnimatePresence, motion } from "framer-motion";
import { Home, LogOut, Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

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
  roleColor = "indigo",
  navItems,
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

  /* Palette per role */
  const palettes = {
    indigo: {
      activeBg: "bg-indigo-50 text-indigo-700",
      activeIcon: "text-indigo-600",
      inactive: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
      inactiveIcon: "text-gray-400 group-hover:text-gray-500",
      badge: "bg-indigo-100 text-indigo-700",
      avatar: "bg-indigo-100 text-indigo-700",
      countActive: "bg-indigo-100 text-indigo-600",
      countInactive: "bg-gray-100 text-gray-500",
      logoGradient: "from-indigo-600 to-indigo-700",
    },
    violet: {
      activeBg: "bg-violet-50 text-violet-700",
      activeIcon: "text-violet-600",
      inactive: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
      inactiveIcon: "text-gray-400 group-hover:text-gray-500",
      badge: "bg-violet-100 text-violet-700",
      avatar: "bg-violet-100 text-violet-700",
      countActive: "bg-violet-100 text-violet-600",
      countInactive: "bg-gray-100 text-gray-500",
      logoGradient: "from-violet-600 to-violet-700",
    },
    rose: {
      activeBg: "bg-rose-50 text-rose-700",
      activeIcon: "text-rose-600",
      inactive: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
      inactiveIcon: "text-gray-400 group-hover:text-gray-500",
      badge: "bg-rose-100 text-rose-700",
      avatar: "bg-rose-100 text-rose-700",
      countActive: "bg-rose-100 text-rose-600",
      countInactive: "bg-gray-100 text-gray-500",
      logoGradient: "from-rose-600 to-rose-700",
    },
  };
  const p = palettes[roleColor] || palettes.indigo;

  /* ─── Sidebar content (shared desktop & mobile) ─── */
  const SidebarContent = ({ onNavigate }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 px-5">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${p.logoGradient} shadow-sm`}
        >
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-gray-900">Train-to-Hire</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {navSection}
        </p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onTabChange(item.key);
                  onNavigate?.();
                }}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                  isActive ? p.activeBg : p.inactive
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${isActive ? p.activeIcon : p.inactiveIcon}`}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== null && item.count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                      isActive ? p.countActive : p.countInactive
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="my-3 border-t border-gray-100" />

        <Link
          to="/"
          onClick={() => onNavigate?.()}
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <Home className="h-[18px] w-[18px] text-gray-400 group-hover:text-gray-500" />
          Ir al inicio
        </Link>
      </nav>

      {/* User card */}
      <div className="shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${p.avatar}`}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{userName}</p>
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.badge}`}>
              {roleDisplay}
            </span>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="flex h-screen overflow-hidden bg-gray-50 text-gray-900"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
    >
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col border-r border-gray-200 bg-white">
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
              className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              key="drawer"
              variants={drawerVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl lg:hidden"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{title}</h1>
          <div className="flex items-center gap-2">{headerActions}</div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8 py-5">
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
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
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-rose-200 bg-rose-50 text-rose-800"
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
