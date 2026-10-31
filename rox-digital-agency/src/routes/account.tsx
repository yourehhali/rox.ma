import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ClientLogin } from "@/components/client/client-login";
import { ClientPortal } from "@/components/client/client-portal";
import { ClientProvider } from "@/components/client/client-provider";
import { useClientAuth } from "@/hooks/use-client-auth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Espace client — Suivi de vos demandes | ROX Agency" },
      {
        name: "description",
        content:
          "Suivez l'avancement de vos demandes, échangez avec un conseiller et réservez un appel — ROX Agency.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { status, user, requestOtp, resendOtp, verifyOtp, logout } = useClientAuth();

  // Login ↔ portal swap cross-fades instead of snapping.
  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "checking" ? (
        <motion.div
          key="checking"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid min-h-screen place-items-center bg-background"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
        </motion.div>
      ) : status === "guest" || !user ? (
        <motion.div
          key="login"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <ClientLogin onRequestOtp={requestOtp} onResendOtp={resendOtp} onVerifyOtp={verifyOtp} />
        </motion.div>
      ) : (
        <motion.div
          key="portal"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <ClientProvider clientId={user.id}>
            <ClientPortal user={user} onLogout={logout} />
          </ClientProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
