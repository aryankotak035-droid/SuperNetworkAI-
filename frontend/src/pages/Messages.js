import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ArrowLeft, Send, MessageCircle, Clock, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "../components/ThemeToggle";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Convert HTTP URL to WebSocket URL
const getWebSocketUrl = () => {
  const url = new URL(BACKEND_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.origin;
};

const Messages = () => {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // WebSocket connection
  const connectWebSocket = useCallback((userId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      const wsUrl = `${getWebSocketUrl()}/api/ws/${userId}`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setWsConnected(true);
        console.log('WebSocket connected');
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message') {
            // Add new message to state if it's from the selected conversation
            if (selectedConversation === data.sender_id || currentProfile?.profile_id === data.sender_id) {
              setMessages(prev => [...prev, {
                message_id: data.message_id,
                sender_id: data.sender_id,
                content: data.content,
                created_at: data.created_at,
                read: false
              }]);
            }
            // Refresh conversations to update unread count
            fetchConversations();
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };
      
      wsRef.current.onclose = () => {
        setWsConnected(false);
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (userId) connectWebSocket(userId);
        }, 5000);
      };
      
      wsRef.current.onerror = () => {
        setWsConnected(false);
      };
    } catch (e) {
      console.error('WebSocket connection failed:', e);
    }
  }, [selectedConversation, currentProfile]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Connect WebSocket when user profile is available
  useEffect(() => {
    if (currentProfile?.user_id) {
      // We need the user_id for WebSocket, but profile has profile_id
      // Let's fetch the user data to get the user_id
      const fetchUser = async () => {
        try {
          const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
            withCredentials: true
          });
          if (response.data?.user_id) {
            connectWebSocket(response.data.user_id);
          }
        } catch (e) {
          console.error('Failed to fetch user for WebSocket:', e);
        }
      };
      fetchUser();
    }
  }, [currentProfile, connectWebSocket]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (profileId) {
      selectConversation(profileId);
    }
  }, [profileId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      const interval = setInterval(() => fetchMessages(selectedConversation), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/messages/conversations`, {
        withCredentials: true
      });
      setConversations(response.data);
      
      // Get current user profile
      if (!currentProfile) {
        const profileResponse = await axios.get(`${BACKEND_URL}/api/profile/me`, {
          withCredentials: true
        });
        setCurrentProfile(profileResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (profile_id) => {
    setSelectedConversation(profile_id);
    await fetchMessages(profile_id);
  };

  const fetchMessages = async (profile_id) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/messages/${profile_id}`, {
        withCredentials: true
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/messages/send`,
        {
          receiver_profile_id: selectedConversation,
          content: newMessage
        },
        { withCredentials: true }
      );
      setNewMessage("");
      await fetchMessages(selectedConversation);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  const selectedProfile = conversations.find(c => c.profile?.profile_id === selectedConversation)?.profile;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border backdrop-blur-xl bg-card/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Conversations List */}
          <div className="glass-card rounded-2xl p-4 overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Conversations</h2>
            
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Connect with people to start chatting</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <motion.button
                    key={conv.profile?.profile_id}
                    whileHover={{ x: 4 }}
                    onClick={() => selectConversation(conv.profile?.profile_id)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedConversation === conv.profile?.profile_id
                        ? 'bg-primary/20 border-primary/30'
                        : 'hover:bg-muted/50'
                    } border border-transparent`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold flex-shrink-0">
                        {conv.profile?.full_name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold truncate">{conv.profile?.full_name}</span>
                          {conv.unread_count > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 glass-card rounded-2xl flex flex-col">
            {selectedConversation && selectedProfile ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {selectedProfile.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold">{selectedProfile.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedProfile.role_intent}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <AnimatePresence>
                    {messages.map((msg, index) => {
                      const isOwn = msg.sender_id === currentProfile?.profile_id;
                      return (
                        <motion.div
                          key={msg.message_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`mb-4 flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isOwn ? 'order-1' : 'order-2'}`}>
                            <div className={`rounded-2xl px-4 py-2 ${
                              isOwn 
                                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                                : 'bg-muted rounded-tl-sm'
                            }`}>
                              <p className="leading-relaxed">{msg.content}</p>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${isOwn ? 'justify-end' : ''}`}>
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(msg.created_at)}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="btn-primary gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
