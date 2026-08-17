import { Auth0Provider, type AppState } from "@auth0/auth0-react";
import type { ReactNode } from "react";

function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

type Auth0ProviderWithConfigProps = {
  children: ReactNode;
};

export function Auth0ProviderWithConfig({ children }: Auth0ProviderWithConfigProps) {
  const domain = requireEnv("VITE_AUTH0_DOMAIN");
  const clientId = requireEnv("VITE_AUTH0_CLIENT_ID");
  const audience = requireEnv("VITE_AUTH0_AUDIENCE");

  const onRedirectCallback = (appState?: AppState) => {
    window.history.replaceState({}, document.title, appState?.returnTo ?? window.location.pathname);
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        audience,
        redirect_uri: window.location.origin,
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
}
