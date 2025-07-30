import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStudent?: boolean;
  allowedRoles?: string[];
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requireStudent = false,
  allowedRoles 
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  // Show loading state while checking auth
  if (isAuthenticated === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Redirect to="/login" />;
  }

  // Check role-based access
  if (requireAdmin && user.role !== 'admin') {
    return <Redirect to="/unauthorized" />;
  }

  if (requireStudent && user.role !== 'student') {
    return <Redirect to="/unauthorized" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/unauthorized" />;
  }

  return <>{children}</>;
}

export function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-lg text-gray-600">
          You don't have permission to access this page.
        </p>
        <p className="text-sm text-gray-500">
          Current role: {user?.role || 'Unknown'}
        </p>
        <button
          onClick={logout}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}