import { startTransition, useLayoutEffect, type ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { createRouter, useRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function RouterInnerWrap({ children }: { children: ReactNode }) {
  const router = useRouter();

  useLayoutEffect(() => {
    // A suspended first render can expose Transitioner's callback before it commits.
    router.startTransition = (callback) => startTransition(callback);
  }, [router]);

  return <>{children}</>;
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    InnerWrap: RouterInnerWrap,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
