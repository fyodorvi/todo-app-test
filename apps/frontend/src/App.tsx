import { useAuth0 } from "@auth0/auth0-react";
import { LogOut } from "lucide-react";
import { configureTodosApi } from "@/api/todos";
import { TodoApp } from "@/components/TodoApp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function LoginScreen() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Garden Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">Sign in to manage your garden schedule.</p>
          <Button className="w-full" onClick={() => loginWithRedirect()}>
            Sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AuthenticatedApp() {
  const { user, logout, getAccessTokenSilently, loginWithRedirect } = useAuth0();

  configureTodosApi({
    getAccessToken: () =>
      getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        },
      }),
    onUnauthorized: () => {
      void loginWithRedirect();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.email ?? "Signed in"}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              logout({
                logoutParams: {
                  returnTo: window.location.origin,
                },
              })
            }
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </header>
      <TodoApp />
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <AuthenticatedApp />;
}
