import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, User, Shield, Users, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    studentId?: string;
  };
  studentInfo?: any;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return await response.json() as LoginResponse;
    },
    onSuccess: (data) => {
      // Store auth data
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      // Redirect based on role
      if (data.user.role === 'admin') {
        setLocation('/admin');
      } else if (data.user.role === 'student') {
        setLocation(`/student/${data.user.username}`);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  const handleDemoLogin = (type: 'admin' | 'student') => {
    if (type === 'admin') {
      setFormData({ username: 'admin', password: 'password' });
    } else {
      // Use a sample student username
      setFormData({ username: 'Ishant_57', password: '12345678' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Hero Section */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900">
              LeetCode Progress
              <span className="block text-blue-600">Tracker</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Comprehensive monitoring system for LeetCode batch progress with real-time analytics, 
              advanced insights, and performance tracking.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">142 Students</p>
                <p className="text-sm text-slate-600">Active tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
              <BarChart3 className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-semibold text-slate-900">Real-time</p>
                <p className="text-sm text-slate-600">Sync & Analytics</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Key Features:</h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>📚 Topic-based mastery tracking</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span>📊 Interactive heatmap calendar</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span>🏅 Achievement badge system</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <span>📈 AI-powered progress prediction</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center space-y-4">
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <p className="text-slate-600">
                Access your personalized dashboard
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Demo Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDemoLogin('admin')}
                  className="flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Demo</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDemoLogin('student')}
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Student Demo</span>
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or continue with credentials</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    required
                    disabled={loginMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      disabled={loginMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginMutation.error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {loginMutation.error.message || 'Login failed. Please check your credentials.'}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="text-sm text-slate-600 space-y-2">
                <p><strong>Admin:</strong> username: admin, password: password</p>
                <p><strong>Students:</strong> username: [leetcode_username], password: 12345678</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}