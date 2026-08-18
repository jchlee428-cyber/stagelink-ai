import { useNavigate, type NavigateFunction, useRoutes } from "react-router-dom";
import { useEffect } from "react";
import routes from "./config";

let navigateResolver: ((navigate: NavigateFunction) => void) | null = null;

declare global {
  interface Window {
    REACT_APP_NAVIGATE?: ReturnType<typeof useNavigate>;
  }
}

export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve;
});

export function AppRoutes() {
  const element = useRoutes(routes);
  const navigate = useNavigate();

  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate;
    if (typeof navigateResolver === 'function') {
      try {
        navigateResolver(navigate);
      } catch {
        // ignore
      }
      navigateResolver = null;
    }
  }, [navigate]);

  return element;
}
