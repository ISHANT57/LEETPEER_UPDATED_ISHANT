import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute, UnauthorizedPage } from "@/components/protected-route";
import Sidebar from "@/components/sidebar";
import LoginPage from "@/pages/login";
import StudentDashboard from "@/pages/student-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Leaderboard from "@/pages/leaderboard";
import StudentDirectory from "@/pages/student-directory";
import RealTimeTracker from "@/pages/real-time-tracker";
import BadgesPage from "@/pages/badges";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isAdmin, isStudent } = useAuth();

  return (
    <Switch>
      {/* Public login route */}
      <Route path="/login">
        {isAuthenticated ? (
          isAdmin ? <Redirect to="/admin" /> : <Redirect to="/" />
        ) : (
          <LoginPage />
        )}
      </Route>

      {/* Root redirect based on authentication */}
      <Route path="/">
        {!isAuthenticated ? (
          <Redirect to="/login" />
        ) : isAdmin ? (
          <Redirect to="/admin" />
        ) : (
          <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <StudentDirectory />
          </div>
        )}
      </Route>

      {/* Protected routes with layout */}
      <Route path="/admin">
        <ProtectedRoute requireAdmin>
          <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <AdminDashboard />
          </div>
        </ProtectedRoute>
      </Route>

      <Route path="/student/:username">
        <ProtectedRoute>
          <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <StudentDashboard />
          </div>
        </ProtectedRoute>
      </Route>

      <Route path="/leaderboard">
        <ProtectedRoute>
          <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <Leaderboard />
          </div>
        </ProtectedRoute>
      </Route>

      <Route path="/tracker">
        <ProtectedRoute>
          <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <RealTimeTracker />
          </div>
        </ProtectedRoute>
      </Route>

      <Route path="/badges">
        <ProtectedRoute>
          <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <BadgesPage />
          </div>
        </ProtectedRoute>
      </Route>

      <Route path="/trends">
        <ProtectedRoute>
          <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 p-6">Trends page coming soon...</div>
          </div>
        </ProtectedRoute>
      </Route>

      <Route path="/unauthorized" component={UnauthorizedPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
