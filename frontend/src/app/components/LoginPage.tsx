import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Headset, Shield, Users, Lock, User, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

export function LoginPage() {
  const { login, loginAsGuest } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('staff');

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Login attempt:', { username, passwordPresent: !!password });
    if (!username || !password) {
      console.log('Validation failed: Missing username or password');
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    const success = await login(username, password);
    setIsLoading(false);

    if (success) {
      toast.success('Welcome back! 👋');
    } else {
      toast.error('Invalid credentials. Please try again.');
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);
    await loginAsGuest(guestName);
    setIsLoading(false);
    toast.success(`Welcome ${guestName}! 🎉`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center p-4 transition-colors">
      {/* Theme Toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border-2"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </Button>

      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-gray-800 shadow-lg rounded-full mb-6 border-4 border-blue-200 dark:border-blue-700">
            <Headset className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-5xl text-gray-800 dark:text-white mb-4 font-bold">Support Chat Ecosystem</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Connect with our team for instant support and assistance
          </p>
        </div>

        {/* Login Card */}
        <Card className="max-w-md mx-auto shadow-2xl border-2 border-blue-100 dark:border-blue-900 dark:bg-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl dark:text-white">Welcome</CardTitle>
            <CardDescription className="dark:text-gray-400">Sign in to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="staff" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Staff Login
                </TabsTrigger>
                <TabsTrigger value="guest" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Guest
                </TabsTrigger>
              </TabsList>

              {/* Staff Login */}
              <TabsContent value="staff">
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="dark:text-gray-200">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="dark:text-gray-200">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="dark:bg-gray-700 dark:text-white dark:border-gray-600 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Signing In...
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Welcome to our support portal. Please sign in with your credentials to continue.
                    </p>
                  </div>
                </form>
              </TabsContent>

              {/* Guest Login */}
              <TabsContent value="guest">
                <form onSubmit={handleGuestLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="guestName" className="dark:text-gray-200">Your Name</Label>
                    <Input
                      id="guestName"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Enter your name"
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" size="lg">
                    <Users className="w-4 h-4 mr-2" />
                    Continue as Guest
                  </Button>

                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Guest Access:</strong> Start a live chat with our support team instantly.
                      No account required!
                    </p>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-blue-100 dark:border-blue-900">
            <div className="text-3xl font-bold mb-2 text-blue-600 dark:text-blue-400">💬 Live Chat</div>
            <p className="text-gray-600 dark:text-gray-300">Instant messaging with support team</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-green-100 dark:border-green-900">
            <div className="text-3xl font-bold mb-2 text-green-600 dark:text-green-400">🔒 Secure</div>
            <p className="text-gray-600 dark:text-gray-300">Your conversations are protected</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-purple-100 dark:border-purple-900">
            <div className="text-3xl font-bold mb-2 text-purple-600 dark:text-purple-400">⚡ Fast</div>
            <p className="text-gray-600 dark:text-gray-300">Quick response times</p>
          </div>
        </div>
      </div>
    </div>
  );
}
