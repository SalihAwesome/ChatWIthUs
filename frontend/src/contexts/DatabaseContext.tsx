import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { requestService, userService } from '../services/api';
import { useAuth } from './AuthContext';

export interface UserSummary {
  id: string;
  name: string;
  username: string;
  role?: string;
}

export interface Message {
  id: string;
  requestId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender?: UserSummary;
}

export interface SupportRequest {
  id: string;
  guestId: string;
  email: string;
  issue: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  category: string;
  assignedAgent: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  guest?: UserSummary;
  messages?: Message[];
}

interface DatabaseContextType {
  requests: SupportRequest[];
  currentChatMessages: Message[];
  loading: boolean;
  isInitialized: boolean;
  error: string | null;
  fetchRequests: () => Promise<void>;
  fetchMessages: (requestId: string) => Promise<void>;
  createRequest: (data: any) => Promise<SupportRequest | null>;
  sendMessage: (requestId: string, content: string) => Promise<void>;
  updateRequest: (id: string, data: any) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  deleteAllRequests: () => Promise<void>;
  socket: Socket | null;
  // User Management
  fetchUsers: () => Promise<UserSummary[]>;
  createUser: (data: any) => Promise<UserSummary | null>;
  updateUser: (id: string, data: any) => Promise<UserSummary | null>;
  deleteUser: (id: string) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [currentChatMessages, setCurrentChatMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const currentRequestIdRef = useRef<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.getRequests();
      const requests = (response?.data?.requests || []).filter((r: any) => r && typeof r === 'object');
      setRequests(requests);
    } catch (err: any) {
      console.error('API: Fetch requests error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch requests';
      setError(errorMessage);
    } finally {
      setIsInitialized(true);
      setLoading(false);
    }
  }, []);

  // Socket Connection & Auto-Fetch
  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setRequests([]);
      setIsInitialized(false);
      return;
    }

    // Auto-fetch requests when authenticated
    fetchRequests();

    const token = localStorage.getItem('token');
    if (!token) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    console.log('Socket: Connecting to', socketUrl);

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Socket: Connected');
      setError(null);
      if (currentRequestIdRef.current) {
        newSocket.emit('join_request', currentRequestIdRef.current);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket: Disconnected', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, need to manually reconnect
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket: Connection error', error);
      setError('Failed to connect to server. Please check your connection.');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket: Reconnected after', attemptNumber, 'attempts');
      setError(null);
      if (currentRequestIdRef.current) {
        newSocket.emit('join_request', currentRequestIdRef.current);
      }
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket: Reconnection error', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket: Reconnection failed');
      setError('Lost connection to server. Please refresh the page.');
    });

    newSocket.on('new_request', (request: SupportRequest) => {
      if (!request || !request.id) return;
      setRequests((prev) => {
        if (prev.some(r => r && r.id === request.id)) return prev;
        return [request, ...prev];
      });
    });

    newSocket.on('request_updated', (updated: SupportRequest) => {
      if (!updated || !updated.id) return;
      setRequests((prev) => prev.map(r => r && r.id === updated.id ? updated : r));
    });

    newSocket.on('request_deleted', (deletedId: string) => {
      setRequests((prev) => prev.filter(r => r.id !== deletedId));
      if (currentRequestIdRef.current === deletedId) {
        // If viewing the deleted request, clear the current messages
        setCurrentChatMessages([]);
        currentRequestIdRef.current = null;
      }
    });

    newSocket.on('all_requests_deleted', () => {
      setRequests([]);
      setCurrentChatMessages([]);
      currentRequestIdRef.current = null;
    });

    newSocket.on('new_message', (message: Message) => {
      if (!message || !message.id) return;
      console.log('Socket: Received message', message.id);
      setCurrentChatMessages((prev) => {
        if (prev.some(m => m && m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, fetchRequests]);

  const fetchMessages = useCallback(async (requestId: string) => {
    if (!requestId) return;
    currentRequestIdRef.current = requestId;
    setError(null);
    try {
      const response = await requestService.getMessages(requestId);
      const messages = (response?.data?.messages || []).filter((m: any) => m && typeof m === 'object');
      setCurrentChatMessages(messages);
      if (socket) {
        socket.emit('join_request', requestId);
      }
    } catch (err: any) {
      console.error('API: Fetch messages error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch messages';
      setError(errorMessage);
    }
  }, [socket]);

  const createRequest = useCallback(async (data: any): Promise<SupportRequest | null> => {
    setError(null);
    try {
      const response = await requestService.createRequest(data);
      const newReq = response?.data?.request;
      if (newReq && newReq.id) {
        setRequests(prev => [newReq, ...prev]);
      }
      return newReq || null;
    } catch (err: any) {
      console.error('API: Create request error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create request';
      setError(errorMessage);
      return null;
    }
  }, []);

  const sendMessage = useCallback(async (requestId: string, content: string) => {
    if (!requestId) return;
    setError(null);
    try {
      const response = await requestService.sendMessage(requestId, content);
      const newMsg = response?.data?.message;
      if (newMsg && newMsg.id) {
        setCurrentChatMessages(prev => {
          if (prev.some(m => m && m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (err: any) {
      console.error('API: Send message error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send message';
      setError(errorMessage);
      throw err; // Re-throw so UI can handle it
    }
  }, []);

  const updateRequest = useCallback(async (id: string, data: any) => {
    if (!id) return;
    setError(null);
    try {
      const response = await requestService.updateRequest(id, data);
      const updated = response?.data?.request;
      if (updated && updated.id) {
        setRequests(prev => prev.map(r => r && r.id === updated.id ? updated : r));
      }
    } catch (err: any) {
      console.error('API: Update request error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update request';
      setError(errorMessage);
    }
  }, []);

  const deleteRequest = useCallback(async (id: string) => {
    if (!id) return;
    setError(null);
    try {
      await requestService.deleteRequest(id);
      // Optimistic update
      setRequests((prev) => prev.filter(r => r.id !== id));
    } catch (err: any) {
      console.error('API: Delete request error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete request';
      setError(errorMessage);
    }
  }, []);

  const deleteAllRequests = useCallback(async () => {
    setError(null);
    try {
      await requestService.deleteAllRequests();
      // Optimistic update
      setRequests([]);
    } catch (err: any) {
      console.error('API: Delete all requests error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete all requests';
      setError(errorMessage);
    }
  }, []);

  // User Management Implementations
  const fetchUsers = useCallback(async () => {
    try {
      const response = await userService.getUsers();
      return response.data || [];
    } catch (err: any) {
      console.error('API: Fetch users error:', err);
      return [];
    }
  }, []);

  const createUser = useCallback(async (data: any) => {
    try {
      const response = await userService.createUser(data);
      return response.data;
    } catch (err: any) {
      console.error('API: Create user error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create user';
      setError(errorMessage);
      return null;
    }
  }, []);

  const updateUser = useCallback(async (id: string, data: any) => {
    try {
      const response = await userService.updateUser(id, data);
      return response.data;
    } catch (err: any) {
      console.error('API: Update user error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update user';
      setError(errorMessage);
      return null;
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    try {
      await userService.deleteUser(id);
    } catch (err: any) {
      console.error('API: Delete user error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete user';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const contextValue = useMemo(() => ({
    requests,
    currentChatMessages,
    loading,
    isInitialized,
    error,
    fetchRequests,
    fetchMessages,
    createRequest,
    sendMessage,
    updateRequest,
    deleteRequest,
    deleteAllRequests,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    socket
  }), [
    requests,
    currentChatMessages,
    loading,
    isInitialized,
    error,
    fetchRequests,
    fetchMessages,
    createRequest,
    sendMessage,
    updateRequest,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    socket
  ]);

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
