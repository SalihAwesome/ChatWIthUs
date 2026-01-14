import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Progress } from '@/app/components/ui/progress';
import { useDatabase } from '@/contexts/DatabaseContext';
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  User,
  Plus,
  Trash2,
  Edit,
  Shield,
  Headset
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { ChatInterface } from './ChatInterface';
import { toast } from 'sonner';
import { type SupportRequest, type UserSummary } from '@/contexts/DatabaseContext';
const priorityColors = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700'
};

export function MentorView() {
  const { requests, fetchRequests, updateRequest, deleteRequest, deleteAllRequests, currentChatMessages, fetchUsers, createUser, updateUser, deleteUser } = useDatabase();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);

  // User Management State
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'SUPPORT'
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await fetchUsers();
    setUsers(data);
  };

  const handleCreateUser = async () => {
    try {
      if (!userData.username || !userData.password || !userData.name) {
        toast.error('Please fill in all fields');
        return;
      }
      await createUser(userData);
      toast.success('User created successfully');
      setIsUserDialogOpen(false);
      resetUserForm();
      loadUsers();
    } catch (error) {
      // Error handled in context
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUserId) return;
    try {
      const updateData: any = { name: userData.name, role: userData.role };
      if (userData.password) updateData.password = userData.password;

      await updateUser(selectedUserId, updateData);
      toast.success('User updated successfully');
      setIsUserDialogOpen(false);
      resetUserForm();
      loadUsers();
    } catch (error) {
      // Error handled in context
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUser(id);
      toast.success('User deleted');
      loadUsers();
    }
  };

  const openEditUser = (user: UserSummary) => {
    setIsEditMode(true);
    setSelectedUserId(user.id);
    setUserData({
      username: user.username,
      password: '', // Don't show password
      name: user.name,
      role: user.role || 'SUPPORT'
    });
    setIsUserDialogOpen(true);
  };

  const resetUserForm = () => {
    setUserData({ username: '', password: '', name: '', role: 'SUPPORT' });
    setIsEditMode(false);
    setSelectedUserId(null);
  };

  // Fetch requests on mount - MUST be before any conditional returns (Rules of Hooks)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchRequests();
  }, []);

  // Mock list of support agents (in a real app, this would come from an API)
  const supportAgents = [
    { id: 'agent-1', name: 'Sarah Wilson' },
    { id: 'agent-2', name: 'Mike Johnson' },
    { id: 'agent-3', name: 'Alex Brown' }
  ];

  const handleAssignAgent = async (requestId: string, agentName: string) => {
    try {
      await updateRequest(requestId, {
        assignedAgent: agentName,
        status: 'IN_PROGRESS'
      });
      toast.success(`Assigned to ${agentName}`);
    } catch (error) {
      toast.error('Failed to assign agent');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (confirm('Are you sure you want to delete this requests? This action cannot be undone.')) {
      await deleteRequest(requestId);
      toast.success('Request deleted');
    }
  };

  const handleDeleteAll = async () => {
    if (confirm('WARNING: Are you sure you want to delete ALL requests? This action cannot be undone.')) {
      await deleteAllRequests();
      toast.success('All requests deleted');
    }
  };

  // Calculate statistics from the requests array
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    inProgress: requests.filter(r => r.status === 'IN_PROGRESS').length,
    resolved: requests.filter(r => r.status === 'RESOLVED').length,
    urgent: requests.filter(r => r.priority === 'URGENT').length
  };

  // Mock agent metrics for now (could be fetched from a dedicated endpoint later)
  const agentMetrics = [
    { id: '1', name: 'Sarah Wilson', status: 'online', activeChats: 3, assigned: 12, resolved: 10, resolveRate: 83 },
    { id: '2', name: 'Mike Johnson', status: 'away', activeChats: 1, assigned: 8, resolved: 7, resolveRate: 88 }
  ];

  // Distribution calculations
  const priorityStats = requests.reduce((acc, req) => {
    acc[req.priority] = (acc[req.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryStats = requests.reduce((acc, req) => {
    acc[req.category] = (acc[req.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentActivity = requests.slice(0, 10).map(r => ({
    type: 'request',
    time: new Date(r.createdAt),
    description: `New ${r.priority} priority request from ${r.guest?.name || 'Guest'}`,
    icon: AlertTriangle,
    color: 'text-orange-500'
  }));

  // Conditional return for Chat Interface - AFTER all hooks
  if (selectedRequest) {
    return (
      <ChatInterface
        request={selectedRequest}
        onBack={() => setSelectedRequest(null)}
        onResolve={async (id) => {
          await updateRequest(id, { status: 'RESOLVED' });
          setSelectedRequest(null);
        }}
        currentUserName={user?.name || 'Mentor'}
        currentUserRole="MENTOR"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 p-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-purple-100 dark:border-purple-900">
          <h1 className="text-3xl mb-2 text-gray-800 dark:text-white">Mentor Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Monitor team performance and support operations</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm dark:text-gray-200">Total Requests</CardTitle>
              <BarChart3 className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl dark:text-white">{stats.total}</div>
              <Progress value={Math.min(100, (stats.resolved / (stats.total || 1)) * 100)} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm dark:text-gray-200">Pending Queue</CardTitle>
              <Clock className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-blue-600 dark:text-blue-400">{stats.pending}</div>
              <p className="text-xs text-gray-500 mt-2">Awaiting assignment</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm dark:text-gray-200">In Progress</CardTitle>
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-orange-600 dark:text-orange-400">{stats.inProgress}</div>
              <p className="text-xs text-gray-500 mt-2">Being handled</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm dark:text-gray-200">Resolved</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-green-600 dark:text-green-400">{stats.resolved}</div>
              <p className="text-xs text-gray-500 mt-2">Successfully closed</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm dark:text-gray-200">Urgent Cases</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-red-600 dark:text-red-400">{stats.urgent}</div>
              <p className="text-xs text-gray-500 mt-2">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="dark:bg-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requests">Requests Management</TabsTrigger>
            <TabsTrigger value="team">Team Management</TabsTrigger>
            <TabsTrigger value="agents">Agent Performance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Recent Activity</CardTitle>
                  <CardDescription className="dark:text-gray-400">Latest system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {recentActivity.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No recent activity</p>
                      ) : (
                        recentActivity.map((activity, idx) => {
                          const Icon = activity.icon;
                          return (
                            <div key={idx} className="flex items-start gap-3 pb-3 border-b dark:border-gray-700 last:border-0">
                              <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${activity.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm dark:text-gray-200">{activity.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDistanceToNow(activity.time, { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Priority Distribution</CardTitle>
                  <CardDescription className="dark:text-gray-400">Request breakdown by priority</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(priorityStats).length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No data available</p>
                    ) : (
                      Object.entries(priorityStats).map(([priority, count]) => (
                        <div key={priority} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className={priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-100'}>
                              {priority}
                            </Badge>
                            <span className="font-semibold dark:text-white">{count}</span>
                          </div>
                          <Progress
                            value={(count / (stats.total || 1)) * 100}
                            className="h-2"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Category Breakdown</CardTitle>
                <CardDescription className="dark:text-gray-400">Requests by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(categoryStats).length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 py-8">No categories found</div>
                  ) : (
                    Object.entries(categoryStats).map(([category, count]) => (
                      <Card key={category} className="dark:bg-gray-700 dark:border-gray-600">
                        <CardContent className="pt-6 text-center">
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{count}</div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{category}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="dark:text-white">Request Management</CardTitle>
                  <CardDescription className="dark:text-gray-400">Assign agents and manage active requests</CardDescription>
                </div>
                <Button variant="destructive" onClick={handleDeleteAll}>
                  Delete All Requests
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requests.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No requests found</p>
                  ) : (
                    requests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-750">
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={priorityColors[request.priority as keyof typeof priorityColors] || 'bg-gray-100'}>{request.priority}</Badge>
                            <span className="font-semibold dark:text-white truncate">{request.issue}</span>
                            <span className="text-sm text-gray-400">#{request.category}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{request.description}</p>
                          <div className="text-xs text-gray-400 mt-1">
                            From: {request.guest?.name || 'Guest'} • Status: {request.status} • Assigned: {request.assignedAgent || 'Unassigned'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Select
                            defaultValue={request.assignedAgent || undefined}
                            onValueChange={(value) => handleAssignAgent(request.id, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Assign Agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {supportAgents.map(agent => (
                                <SelectItem key={agent.id} value={agent.name}>{agent.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat
                          </Button>

                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteRequest(request.id)}>
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="dark:text-white">Team Management</CardTitle>
                  <CardDescription className="dark:text-gray-400">Manage support agents and mentors</CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={(open) => {
                  if (!open) resetUserForm();
                  setIsUserDialogOpen(open);
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Team Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-gray-800 dark:text-white">
                    <DialogHeader>
                      <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
                      <DialogDescription>
                        {isEditMode ? 'Update user details. Leave password blank to keep current one.' : 'Create a new support agent or mentor account.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          placeholder="Full Name"
                          value={userData.name}
                          onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          placeholder="Username"
                          value={userData.username}
                          onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                          disabled={isEditMode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                          type="password"
                          placeholder={isEditMode ? "Leave blank to keep current" : "Password"}
                          value={userData.password}
                          onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={userData.role}
                          onValueChange={(value) => setUserData({ ...userData, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SUPPORT">Support Agent</SelectItem>
                            <SelectItem value="MENTOR">Mentor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>Cancel</Button>
                      <Button onClick={isEditMode ? handleUpdateUser : handleCreateUser}>
                        {isEditMode ? 'Save Changes' : 'Create User'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.filter(u => u.role !== 'GUEST').map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-750">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${user.role === 'MENTOR' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                          {user.role === 'MENTOR' ? <Shield className="w-5 h-5" /> : <Headset className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-semibold dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-500">@{user.username} • {user.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditUser(user)}>
                          <Edit className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {users.filter(u => u.role !== 'GUEST').length === 0 && (
                    <p className="text-center text-gray-500 py-8">No team members found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Support Agent Metrics</CardTitle>
                <CardDescription className="dark:text-gray-400">Individual performance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agentMetrics.map((agent) => (
                    <Card key={agent.id} className="dark:bg-gray-700 dark:border-gray-600">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                                {agent.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold dark:text-white">{agent.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={agent.status === 'online' ? 'default' : 'secondary'}>
                                  {agent.status}
                                </Badge>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {agent.activeChats} active chats
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-8 text-center">
                            <div>
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{agent.assigned}</div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Assigned</p>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{agent.resolved}</div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Resolved</p>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{agent.resolveRate}%</div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Resolution Progress</span>
                            <span className="text-sm font-medium dark:text-white">{agent.resolveRate}%</span>
                          </div>
                          <Progress value={agent.resolveRate} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Response Time Metrics</CardTitle>
                  <CardDescription className="dark:text-gray-400">Average response times</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">First Response</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">8 min</p>
                      </div>
                      <Clock className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Resolution Time</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">45 min</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Customer Satisfaction</CardTitle>
                  <CardDescription className="dark:text-gray-400">Overall satisfaction metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                      <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">4.8</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">out of 5.0</p>
                      <div className="flex justify-center gap-1 mt-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div key={star} className="w-6 h-6 text-yellow-400">★</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}