import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { GuestView } from '@/app/components/GuestView';
import { AgentDashboard } from '@/app/components/AgentDashboard';
import { MentorView } from '@/app/components/MentorView';
import { LoginPage } from '@/app/components/LoginPage';
import { Toaster } from '@/app/components/ui/sonner';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { Users, Headset, Shield, LogOut } from 'lucide-react';

type ViewMode = 'selector' | 'guest' | 'agent' | 'mentor';

function AppContent() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('selector');

  // Auto-select view based on user role (moved to useEffect to avoid render-time setState)
  useEffect(() => {
    if (isAuthenticated && user && viewMode === 'selector') {
      if (user.role === 'SUPPORT') {
        setViewMode('agent');
      } else if (user.role === 'MENTOR') {
        setViewMode('mentor');
      } else if (user.role === 'GUEST') {
        setViewMode('guest');
      }
    }
  }, [isAuthenticated, user, viewMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleLogout = () => {
    logout();
    setViewMode('selector');
  };

  if (viewMode === 'guest') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <Button variant="ghost" onClick={() => setViewMode('selector')} className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            ← Back to Selection
          </Button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 flex flex-col relative">
          <GuestView />
        </main>
        <Toaster />
      </div>
    );
  }

  if (viewMode === 'agent') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <Button variant="ghost" onClick={() => setViewMode('selector')} className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            ← Back to Selection
          </Button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 flex flex-col relative">
          <AgentDashboard />
        </main>
        <Toaster />
      </div>
    );
  }

  if (viewMode === 'mentor') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <Button variant="ghost" onClick={() => setViewMode('selector')} className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            ← Back to Selection
          </Button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 flex flex-col relative">
          <MentorView />
        </main>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center p-4 transition-colors">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-gray-800 shadow-lg rounded-full mb-6 border-4 border-blue-200 dark:border-blue-700">
            <Headset className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-5xl text-gray-800 dark:text-white mb-4 font-bold">Welcome, {user?.name}!</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Choose your workspace
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Guest Card */}
          {user?.role === 'GUEST' && (
            <Card
              className="group hover:shadow-xl hover:shadow-blue-200 dark:hover:shadow-blue-900 hover:scale-105 transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500"
              onClick={() => setViewMode('guest')}
            >
              <CardContent className="pt-8 pb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4 group-hover:bg-blue-500 transition-colors">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-300 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-2xl mb-3 text-gray-800 dark:text-white">Guest Portal</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Submit support requests and chat with our team
                </p>
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-md">
                  Start Chatting
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Support Agent Card */}
          {user?.role === 'SUPPORT' && (
            <Card
              className="group hover:shadow-xl hover:shadow-green-200 dark:hover:shadow-green-900 hover:scale-105 transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500"
              onClick={() => setViewMode('agent')}
            >
              <CardContent className="pt-8 pb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4 group-hover:bg-green-500 transition-colors">
                  <Headset className="w-8 h-8 text-green-600 dark:text-green-300 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-2xl mb-3 text-gray-800 dark:text-white">Agent Dashboard</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Chat with customers in real-time
                </p>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white shadow-md">
                  Open Dashboard
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Mentor Card */}
          {user?.role === 'MENTOR' && (
            <Card
              className="group hover:shadow-xl hover:shadow-purple-200 dark:hover:shadow-purple-900 hover:scale-105 transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500"
              onClick={() => setViewMode('mentor')}
            >
              <CardContent className="pt-8 pb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4 group-hover:bg-purple-500 transition-colors">
                  <Shield className="w-8 h-8 text-purple-600 dark:text-purple-300 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-2xl mb-3 text-gray-800 dark:text-white">Mentor View</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Monitor team performance and insights
                </p>
                <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white shadow-md">
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={handleLogout} size="lg" className="dark:bg-gray-800 dark:text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DatabaseProvider>
          <AppContent />
        </DatabaseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}