import { Outlet, createFileRoute } from "@tanstack/react-router";

// Layout for the /portfolio segment. The grid lives at /portfolio (portfolio.index)
// and each case study at /portfolio/$id (portfolio.$id). Same pattern as /services.
export const Route = createFileRoute("/portfolio")({
  component: () => <Outlet />,
});
