import { useState, useEffect, useRef } from 'react';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { useDatabase, type SupportRequest, type Message } from '@/contexts/DatabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Headset, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function GuestChatView() {
  const { user } = useAuth();
  const db = useDatabase();

  const {
    requests = [],
    fetchRequests,
    createRequest,
    sendMessage,
    currentChatMessages = [],
    fetchMessages,
    socket,
    loading = false,
    isInitialized = false,
    error
  } = db || {};

  const [currentRequest, setCurrentRequest] = useState<SupportRequest | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isCreatingRequest = useRef(false);

  // Robust Find or Create Request logic
  useEffect(() => {
    // Wait until logged in, data is initialized, and not currently loading list
    if (!user?.id || !isInitialized || loading) return;

    // Filter valid requests related to this guest
    const guestRequests = requests.filter(r => r && typeof r === 'object' && r.guestId === user.id);

    // Check if we already have an active request
    const existingRequest = guestRequests.find(
      (r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS'
    );

    if (existingRequest) {
      if (currentRequest?.id !== existingRequest.id) {
        console.log('GuestChatView: Attaching to request', existingRequest.id);
        setCurrentRequest(existingRequest);
        if (fetchMessages) fetchMessages(existingRequest.id);
      }
    } else if (!currentRequest && !isCreatingRequest.current) {
      console.log('GuestChatView: Starting request creation');
      isCreatingRequest.current = true;
      if (createRequest) {
        createRequest({
          email: `${user.username || 'guest'}@example.com`,
          issue: 'Live Chat Support',
          description: 'Guest initiated live chat',
          priority: 'MEDIUM',
          category: 'General'
        }).then(newReq => {
          if (newReq && newReq.id) {
            console.log('GuestChatView: Created and attaching to', newReq.id);
            setCurrentRequest(newReq);
            if (fetchMessages) fetchMessages(newReq.id);
          }
        }).catch(err => {
          console.error('GuestChatView: Create failed', err);
        }).finally(() => {
          isCreatingRequest.current = false;
        });
      }
    }
  }, [user?.id, requests, loading, isInitialized, currentRequest, fetchMessages, createRequest]);

  // Socket Event for remote typing
  useEffect(() => {
    if (!socket) return;
    const handleRemoteTyping = ({ isTyping: remoteIsTyping }: { isTyping: boolean }) => {
      setRemoteTyping(remoteIsTyping);
    };
    socket.on('user_typing', handleRemoteTyping);
    return () => {
      socket.off('user_typing', handleRemoteTyping);
    };
  }, [socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChatMessages, remoteTyping]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentRequest?.id || !sendMessage || sendingMessage) return;
    const content = newMessage;
    setNewMessage('');
    setSendingMessage(true);
    try {
      await sendMessage(currentRequest.id, content);
    } catch (err) {
      setNewMessage(content);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRetry = () => {
    if (fetchRequests) fetchRequests();
  };

  if (!currentRequest) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">
            {loading ? 'Connecting to support...' : 'Preparing session...'}
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-sm italic">
            This might take a moment depending on your connection.
          </p>
          {!loading && isInitialized && !currentRequest && (
            <Button onClick={handleRetry} variant="outline" className="mt-4 gap-2">
              <RotateCcw className="w-4 h-4" />
              Retry Connection
            </Button>
          )}
        </div>
      </div>
    );
  }

  const isResolved = currentRequest.status === 'RESOLVED' || currentRequest.status === 'CLOSED';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col max-w-4xl mx-auto shadow-2xl border-x dark:border-slate-800 animate-in fade-in duration-500">
      <header className="bg-white dark:bg-slate-900 p-4 border-b dark:border-slate-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-green-500/20 ring-offset-2 dark:ring-offset-slate-900">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
              <Headset className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white leading-tight">
              {currentRequest.assignedAgent || 'Support Team'}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live Now
            </div>
          </div>
        </div>
        {isResolved && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none px-3 py-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Resolved
          </Badge>
        )}
      </header>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 mx-4 mt-2 rounded">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-4 bg-slate-50/50 dark:bg-slate-950/50">
        <div className="space-y-6">
          {currentChatMessages.length === 0 ? (
            <div className="text-center py-24 opacity-60">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Headset className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold mb-2">How can we help?</h3>
              <p className="text-sm max-w-[240px] mx-auto text-slate-500">Our team is ready to assist you. Send a message to start the conversation.</p>
            </div>
          ) : (
            currentChatMessages.map((msg: Message) => {
              if (!msg) return null;
              const fromMe = msg.senderId === user?.id;
              let dateStr = '';
              try {
                dateStr = msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : '';
              } catch (e) { }

              return (
                <div key={msg.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md text-sm transition-all hover:shadow-lg ${fromMe
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                    }`}>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    <div className={`text-[10px] mt-2 opacity-60 font-medium ${fromMe ? 'text-blue-100 text-right' : 'text-slate-500 text-left'}`}>
                      {dateStr}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {remoteTyping && (
            <div className="flex justify-start animate-in slide-in-from-left-2 duration-300">
              <div className="bg-white dark:bg-slate-800 rounded-full px-5 py-2.5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Agent is typing</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <footer className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {!isResolved ? (
          <div className="flex gap-3">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Start typing your message..."
              className="flex-1 bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-inner h-12 rounded-xl"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 shrink-0 h-12 w-12 rounded-xl transition-all active:scale-90 disabled:opacity-50"
            >
              {sendingMessage ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-slate-500 font-semibold bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            Conversation has concluded.
          </div>
        )}
      </footer>
    </div>
  );
}
