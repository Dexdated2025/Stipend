import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/NotFound";

// The dashboard (and its chart library) only loads when someone opens /app.
const AppShell = lazy(() => import("@/components/app/AppShell"));
const Overview = lazy(() => import("@/pages/app/Overview"));
const Agents = lazy(() => import("@/pages/app/Agents"));
const AgentDetail = lazy(() => import("@/pages/app/AgentDetail"));
const Mandates = lazy(() => import("@/pages/app/Mandates"));
const Payments = lazy(() => import("@/pages/app/Payments"));
const Treasury = lazy(() => import("@/pages/app/Treasury"));
const Settings = lazy(() => import("@/pages/app/Settings"));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-electric border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Overview />} />
            <Route path="agents" element={<Agents />} />
            <Route path="agents/:agentId" element={<AgentDetail />} />
            <Route path="mandates" element={<Mandates />} />
            <Route path="payments" element={<Payments />} />
            <Route path="treasury" element={<Treasury />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
