import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";

import { MarketingFooter } from "../components/MarketingFooter";
import { MarketingNavbar } from "../components/MarketingNavbar";

export function MarketingLayout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-100" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <div className="pointer-events-none fixed inset-0 bg-mesh-slate-violet" />
      <motion.div
        className="pointer-events-none fixed -left-20 top-10 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl"
        animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none fixed right-[-80px] top-[18%] h-[360px] w-[360px] rounded-full bg-violet-500/20 blur-3xl"
        animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.06, 1], y: [0, -14, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <MarketingNavbar />
        <main className="flex-1 w-full">
          <Outlet />
        </main>
        <MarketingFooter />
      </div>
    </div>
  );
}
