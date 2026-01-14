import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useDatabase, type SupportRequest } from '@/contexts/DatabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Search,
  TrendingUp,
  Users,
  Timer,
  Filter,
  X,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ChatInterface } from './ChatInterface';

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

const statusIcons = {
  pending: Clock,
  'in-progress': Timer,
  resolved: CheckCircle,
  closed: CheckCircle
};

export function AgentDashboard() {
  const {
    requests,
    fetchRequests,
    updateRequest,
    loading,
    error
  } = useDatabase();

  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [activeTab, setActiveTab] = useState<SupportRequest['status']>('PENDING');
  const agentName = user?.name || 'Support Agent';

  useEffect(() => {
    fetchRequests();
  }, []);

  const stats = {
    total: requests.length,
    pending: requests.filter((r: SupportRequest) => r.status === 'PENDING').length,
    inProgress: requests.filter((r: SupportRequest) => r.status === 'IN_PROGRESS').length,
    resolved: requests.filter((r: SupportRequest) => r.status === 'RESOLVED').length,
    urgent: requests.filter((r: SupportRequest) => r.priority === 'URGENT').length
  };

  const filteredRequests = requests
    .filter(req => req.status === activeTab)
    .filter(req =>
      searchTerm === '' ||
      (req.guest?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const categoryStats = requests.reduce((acc: any, req: SupportRequest) => {
    acc[req.category] = (acc[req.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityStats = requests.reduce((acc: any, req: SupportRequest) => {
    acc[req.priority] = (acc[req.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentActivity = requests.slice(0, 5).map((r: SupportRequest) => ({
    type: 'request',
    time: new Date(r.createdAt).getTime(),
    description: `New ${r.priority} priority request from ${r.guest?.name || 'Guest'}`,
    icon: AlertCircle,
    color: 'text-orange-500'
  }));

  // Removed simple "Assign to Me" - Agents must wait for Mentor assignment
  // or we could implement a "Request Assignment" feature later.
  // For now, removing the function to enforce Mentor-driven flow.

  // const handleAssignToMe = ...

  const handleResolve = async (requestId: string) => {
    try {
      await updateRequest(requestId, {
        status: 'RESOLVED'
      });
      setSelectedRequest(null);
      toast.success('Request resolved successfully');
    } catch (err) {
      toast.error('Failed to resolve request. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-700';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'URGENT': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (selectedRequest) {
    return (
      <ChatInterface
        request={selectedRequest}
        onBack={() => setSelectedRequest(null)}
        onResolve={handleResolve}
        currentUserName={agentName}
        currentUserRole="SUPPORT"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:via-green-950 dark:to-gray-900 p-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-green-100 dark:border-green-900">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl mb-2 text-gray-800 dark:text-white font-bold">Support Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage and respond to support requests</p>
            </div>
            {loading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchRequests()}
                  className="h-6 px-2 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm dark:text-white font-medium">Total Requests</CardTitle>
              <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl dark:text-white font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm dark:text-white font-medium">Pending</CardTitle>
              <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl dark:text-white font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm dark:text-white font-medium">In Progress</CardTitle>
              <Timer className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl dark:text-white font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm dark:text-white font-medium">Urgent</CardTitle>
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl dark:text-white font-bold">{stats.urgent}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="dark:text-white">Support Queue</CardTitle>
                <CardDescription className="dark:text-gray-400">View and manage support requests</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-4 dark:bg-gray-700">
                <TabsTrigger value="PENDING" className="dark:data-[state=active]:bg-gray-600">Pending</TabsTrigger>
                <TabsTrigger value="IN_PROGRESS" className="dark:data-[state=active]:bg-gray-600">In Progress</TabsTrigger>
                <TabsTrigger value="RESOLVED" className="dark:data-[state=active]:bg-gray-600">Resolved</TabsTrigger>
                <TabsTrigger value="CLOSED" className="dark:data-[state=active]:bg-gray-600">Closed</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredRequests.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No requests found in this category</p>
                      </div>
                    ) : (
                      filteredRequests.map((request: SupportRequest) => (
                        <Card
                          key={request.id}
                          className={`transition-shadow cursor-default dark:bg-gray-700 dark:border-gray-600 ${request.assignedAgent === agentName ? 'hover:shadow-md cursor-pointer border-l-4 border-l-green-500' : 'opacity-75'}`}
                          onClick={() => {
                            if (request.assignedAgent === agentName) {
                              setSelectedRequest(request);
                            } else {
                              toast.error("This request is not assigned to you.");
                            }
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold truncate dark:text-white">{request.issue}</h3>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <Badge className={getPriorityColor(request.priority)}>
                                    {request.priority}
                                  </Badge>
                                  <Badge variant="outline" className="dark:border-gray-500 dark:text-gray-300">
                                    {request.category}
                                  </Badge>
                                </div>

                                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                  <p><strong>From:</strong> {request.guest?.name || 'Guest'} ({request.email})</p>
                                  <p className="line-clamp-2">{request.description}</p>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                </span>

                                {request.assignedAgent === agentName ? (
                                  <Button size="sm" onClick={() => setSelectedRequest(request)}>
                                    Enter Chat
                                  </Button>
                                ) : (
                                  <div className="flex items-center text-gray-400 gap-1 text-xs">
                                    <Lock className="w-3 h-3" />
                                    <span>Locked</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}