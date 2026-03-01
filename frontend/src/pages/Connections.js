import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ArrowLeft, Check, X, Clock, UserCircle2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Connections = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/connections/my`, {
        withCredentials: true
      });
      setConnections(response.data);
    } catch (error) {
      console.error('Fetch connections error:', error);
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (connectionId, status) => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/connections/${connectionId}/respond`,
        { status },
        { withCredentials: true }
      );
      toast.success(`Connection ${status.toLowerCase()}`);
      fetchConnections();
    } catch (error) {
      console.error('Respond error:', error);
      toast.error("Failed to respond to connection");
    }
  };

  const pendingReceived = connections.filter(c => c.status === 'PENDING' && !c.is_sender);
  const pendingSent = connections.filter(c => c.status === 'PENDING' && c.is_sender);
  const accepted = connections.filter(c => c.status === 'ACCEPTED');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="animate-pulse-glow">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            data-testid="back-button"
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="rounded-full hover:bg-white/10 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl"
        >
          <h1 className="text-3xl font-outfit font-bold text-white mb-6">Connections</h1>

          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-black/30 mb-8 p-1.5 rounded-xl">
              <TabsTrigger value="received" data-testid="received-tab" className="rounded-lg data-[state=active]:bg-primary">
                Received ({pendingReceived.length})
              </TabsTrigger>
              <TabsTrigger value="sent" data-testid="sent-tab" className="rounded-lg data-[state=active]:bg-primary">
                Sent ({pendingSent.length})
              </TabsTrigger>
              <TabsTrigger value="accepted" data-testid="accepted-tab" className="rounded-lg data-[state=active]:bg-primary">
                Accepted ({accepted.length})
              </TabsTrigger>
            </TabsList>

            {/* Received Requests */}
            <TabsContent value="received" className="space-y-4">
              {pendingReceived.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No pending requests
                </div>
              ) : (
                pendingReceived.map((conn) => (
                  <div
                    key={conn.connection_id}
                    data-testid="connection-card"
                    className="border border-white/10 rounded-2xl p-6 bg-white/5 hover:bg-white/10 transition-all hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-white shadow-lg">
                          {conn.other_profile?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="text-lg font-outfit font-semibold text-white">
                            {conn.other_profile?.full_name || 'Unknown'}
                          </h3>
                          <div className="text-sm text-gray-400">
                            {conn.other_profile?.role_intent || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          data-testid="accept-button"
                          onClick={() => handleRespond(conn.connection_id, 'ACCEPTED')}
                          size="sm"
                          className="rounded-full bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20 hover:scale-105 transition-all"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          data-testid="reject-button"
                          onClick={() => handleRespond(conn.connection_id, 'REJECTED')}
                          size="sm"
                          variant="destructive"
                          className="rounded-full hover:scale-105 transition-all"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Sent Requests */}
            <TabsContent value="sent" className="space-y-4">
              {pendingSent.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No sent requests
                </div>
              ) : (
                pendingSent.map((conn) => (
                  <div
                    key={conn.connection_id}
                    data-testid="connection-card"
                    className="border border-white/10 rounded-xl p-6 bg-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold text-white">
                          {conn.other_profile?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="text-lg font-outfit font-semibold text-white">
                            {conn.other_profile?.full_name || 'Unknown'}
                          </h3>
                          <div className="text-sm text-gray-400">
                            {conn.other_profile?.role_intent || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Pending</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Accepted Connections */}
            <TabsContent value="accepted" className="space-y-4">
              {accepted.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No accepted connections yet
                </div>
              ) : (
                accepted.map((conn) => (
                  <div
                    key={conn.connection_id}
                    data-testid="connection-card"
                    className="border border-white/10 rounded-xl p-6 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold text-white">
                          {conn.other_profile?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="text-lg font-outfit font-semibold text-white">
                            {conn.other_profile?.full_name || 'Unknown'}
                          </h3>
                          <div className="text-sm text-gray-400">
                            {conn.other_profile?.role_intent || 'N/A'}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {conn.other_profile?.skills?.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-secondary">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-semibold">Connected</span>
                      </div>
                      <Button
                        onClick={() => navigate(`/messages/${conn.other_profile?.profile_id}`)}
                        size="sm"
                        className="btn-primary gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Connections;