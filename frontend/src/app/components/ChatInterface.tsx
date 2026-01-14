import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { ArrowLeft, Send, CheckCircle2, User, Headset, Circle, AlertCircle, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { useDatabase, type SupportRequest, type Message } from '@/contexts/DatabaseContext';
import { type UserRole } from '@/contexts/AuthContext';

interface ChatInterfaceProps {
  request: SupportRequest;
  onBack: () => void;
  onResolve: (requestId: string) => void;
  currentUserName: string;
  currentUserRole: UserRole;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export function ChatInterface({
  request,
  onBack,
  onResolve,
  currentUserName,
  currentUserRole
}: ChatInterfaceProps) {
  console.log('ChatInterface mounted', { requestId: request?.id, currentUserRole, hasGuest: !!request?.guest });
  if (!request) {
    console.error('ChatInterface: Request is missing');
    return <div className="p-8 text-center text-red-500">Error: Request data unavailable</div>;
  }

  const {
    currentChatMessages,
    fetchMessages,
    sendMessage,
    socket,
    error,
    loading
  } = useDatabase();

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Safe date formatting helpers
  const safeFormatDistance = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'some time ago';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch (e) {
      console.error('Invalid date for distance:', dateStr);
      return 'invalid date';
    }
  };

  const safeFormat = (dateStr: string | null | undefined, fmt: string) => {
    if (!dateStr) return 'unknown time';
    try {
      return format(new Date(dateStr), fmt);
    } catch (e) {
      console.error('Invalid date for format:', dateStr);
      return 'invalid date';
    }
  };

  useEffect(() => {
    fetchMessages(request.id);
  }, [request.id]);

  useEffect(() => {
    if (!socket) return;

    const handleRemoteTyping = ({ userId, isTyping: remoteIsTyping }: { userId: string, isTyping: boolean }) => {
      // For now, any remote typing shows as typing (simplified)
      setRemoteTyping(remoteIsTyping);
    };

    socket.on('user_typing', handleRemoteTyping);
    return () => {
      socket.off('user_typing', handleRemoteTyping);
    };
  }, [socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatMessages, remoteTyping]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;

    const content = newMessage;
    setNewMessage('');
    setSendingMessage(true);

    try {
      await sendMessage(request.id, content);
      if (socket) {
        socket.emit('typing', { requestId: request.id, isTyping: false });
      }
    } catch (err) {
      // Error is handled by DatabaseContext, but restore message on failure
      setNewMessage(content);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (socket) {
      socket.emit('typing', { requestId: request.id, isTyping: e.target.value.length > 0 });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    try {
      return name
        .split(' ')
        .map(n => n[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2);
    } catch (e) {
      return '??';
    }
  };

  const otherUserName = currentUserRole === 'GUEST'
    ? (request.assignedAgent || 'Support Team')
    : (request.guest?.name || 'Guest');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 flex flex-col transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-blue-50 dark:hover:bg-gray-700 dark:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex-1 flex items-center gap-3">
              <Avatar className="border-2 border-blue-200 dark:border-blue-700">
                <AvatarFallback className={currentUserRole === 'GUEST' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'}>
                  {currentUserRole === 'GUEST' ? <Headset className="w-5 h-5" /> : getInitials(request.guest?.name || 'Guest')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white">{otherUserName}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{request.issue}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={request.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                {request.priority}
              </Badge>

              {request.status !== 'RESOLVED' && request.status !== 'CLOSED' && (currentUserRole === 'SUPPORT' || currentUserRole === 'MENTOR') && (
                <Button
                  size="sm"
                  onClick={() => {
                    onResolve(request.id);
                    toast.success('Chat resolved successfully! 🎉');
                  }}
                  className="ml-2 bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Resolve
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mx-4 mt-4 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchMessages(request.id)}
              className="h-6 px-2 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          {loading && currentChatMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Loading messages...</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="text-center py-4">
                  <div className="inline-block bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full text-sm text-blue-700 dark:text-blue-300 mb-2">
                    Chat started {safeFormatDistance(request.createdAt)}
                  </div>
                </div>

                {currentChatMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-300 mb-2">Start the conversation!</p>
                  </div>
                ) : (
                  currentChatMessages.map((message: Message, index: number) => {
                    const isCurrentUser = message.sender?.name === currentUserName;
                    const isAgent = message.sender?.role === 'SUPPORT' || message.sender?.role === 'MENTOR';
                    const showAvatar = index === 0 || currentChatMessages[index - 1].senderId !== message.senderId;

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} ${!showAvatar && 'mt-1'}`}
                      >
                        {showAvatar ? (
                          <Avatar className="flex-shrink-0">
                            <AvatarFallback className={isAgent ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'}>
                              {isAgent ? <Headset className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-10 flex-shrink-0" />
                        )}

                        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
                          {showAvatar && (
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{message.sender?.name || 'User'}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {safeFormat(message.createdAt, 'h:mm a')}
                              </span>
                            </div>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 shadow-sm ${isCurrentUser
                              ? 'bg-blue-500 text-white rounded-tr-sm'
                              : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-tl-sm text-gray-800 dark:text-gray-100'
                              }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {remoteTyping && (
                  <div className="flex gap-3">
                    <Avatar className="flex-shrink-0">
                      <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                        <Headset className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* Message Input */}
          {request.status !== 'RESOLVED' && request.status !== 'CLOSED' ? (
            <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-lg">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      className="pr-4 py-6 text-base border-2 border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-500 rounded-xl dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="h-12 px-6 bg-blue-500 hover:bg-blue-600 rounded-xl shadow-md disabled:opacity-50"
                    size="lg"
                  >
                    {sendingMessage ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">Press Enter to send</p>
              </div>
            </div>
          ) : (
            <div className="border-t dark:border-gray-700 bg-green-50 dark:bg-green-950 p-4 text-center">
              <p className="text-green-700 dark:text-green-300 font-medium">✓ This chat has been resolved</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}