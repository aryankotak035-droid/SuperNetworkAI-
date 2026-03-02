import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ArrowLeft, Send, MessageCircle, Clock, User, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "../components/ThemeToggle";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Demo conversations for static messaging
const DEMO_CONVERSATIONS = [
  {
    profile: {
      profile_id: "demo_1",
      full_name: "Alex Chen",
      role_intent: "COFOUNDER",
      skills: ["Python", "Machine Learning", "Product Strategy"]
    },
    messages: [
      { id: 1, sender: "them", content: "Hey! I saw your profile and I think we could be great co-founders.", time: "2 hours ago" },
      { id: 2, sender: "me", content: "Thanks for reaching out! I'd love to hear more about your idea.", time: "1 hour ago" },
      { id: 3, sender: "them", content: "I'm building an AI-powered platform for startups. Your ML background would be perfect!", time: "45 min ago" }
    ]
  },
  {
    profile: {
      profile_id: "demo_2",
      full_name: "Sarah Johnson",
      role_intent: "TEAMMATE",
      skills: ["React", "TypeScript", "UI/UX Design"]
    },
    messages: [
      { id: 1, sender: "them", content: "Hi! I'm looking for a team to join. Your project sounds interesting!", time: "1 day ago" },
      { id: 2, sender: "me", content: "Welcome! We're always looking for talented frontend developers.", time: "1 day ago" }
    ]
  },
  {
    profile: {
      profile_id: "demo_3",
      full_name: "Marcus Williams",
      role_intent: "CLIENT",
      skills: ["Business Development", "Sales", "Marketing Strategy"]
    },
    messages: [
      { id: 1, sender: "them", content: "I represent a company interested in your services.", time: "3 days ago" }
    ]
  }
];

const Messages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(DEMO_CONVERSATIONS);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchCurrentProfile();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  const fetchCurrentProfile = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/profile/me`, {
        withCredentials: true
      });
      setCurrentProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    // Add message to the conversation
    const updatedConversations = conversations.map(conv => {
      if (conv.profile.profile_id === selectedConversation.profile.profile_id) {
        return {
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: Date.now(),
              sender: "me",
              content: newMessage.trim(),
              time: "Just now"
            }
          ]
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    setSelectedConversation(updatedConversations.find(
      c => c.profile.profile_id === selectedConversation.profile.profile_id
    ));
    setNewMessage("");
    toast.success("Message sent!");

    // Simulate a response after 2 seconds
    setTimeout(() => {
      const responses = [
        "That sounds great! Let's discuss more.",
        "Thanks for the message! I'll get back to you soon.",
        "Interesting! Tell me more about your experience.",
        "I appreciate your interest. When are you available to chat?"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      setConversations(prev => prev.map(conv => {
        if (conv.profile.profile_id === selectedConversation.profile.profile_id) {
          return {
            ...conv,
            messages: [
              ...conv.messages,
              {
                id: Date.now() + 1,
                sender: "them",
                content: randomResponse,
                time: "Just now"
              }
            ]
          };
        }
        return conv;
      }));

      // Update selected conversation too
      setSelectedConversation(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: Date.now() + 1,
            sender: "them",
            content: randomResponse,
            time: "Just now"
          }
        ]
      }));
    }, 2000);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role) => {
    switch (role) {
      case "COFOUNDER": return "bg-purple-500/20 text-purple-400";
      case "TEAMMATE": return "bg-blue-500/20 text-blue-400";
      case "CLIENT": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="messages-page">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="rounded-full"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Messages
              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">Demo</span>
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          {/* Conversations List */}
          <div className="glass-card rounded-2xl p-4 overflow-hidden flex flex-col">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
                data-testid="search-conversations"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredConversations.map((conv) => (
                <motion.button
                  key={conv.profile.profile_id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    selectedConversation?.profile.profile_id === conv.profile.profile_id
                      ? 'bg-primary/20 border border-primary/50'
                      : 'hover:bg-muted/50'
                  }`}
                  data-testid={`conversation-${conv.profile.profile_id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                      {conv.profile.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate">{conv.profile.full_name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {conv.messages[conv.messages.length - 1]?.time}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(conv.profile.role_intent)}`}>
                        {conv.profile.role_intent}
                      </span>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conv.messages[conv.messages.length - 1]?.content}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border/50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold text-white">
                    {selectedConversation.profile.full_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-semibold">{selectedConversation.profile.full_name}</h2>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(selectedConversation.profile.role_intent)}`}>
                        {selectedConversation.profile.role_intent}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {selectedConversation.profile.skills?.slice(0, 2).join(", ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {selectedConversation.messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl ${
                            msg.sender === 'me'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <span className={`text-xs mt-1 block ${
                            msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {msg.time}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 rounded-xl"
                      data-testid="message-input"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="rounded-xl px-6"
                      data-testid="send-message-button"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-sm">Choose from your connections to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Demo Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Demo Mode:</span> This is a static messaging demo. 
            Messages are simulated locally and will be reset on page refresh.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Messages;
