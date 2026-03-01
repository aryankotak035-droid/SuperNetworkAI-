import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, UserCircle2, LogOut, Users, Eye, EyeOff, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userResponse = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(userResponse.data);

      const profileResponse = await axios.get(`${BACKEND_URL}/api/profile/me`, {
        withCredentials: true
      });
      setProfile(profileResponse.data);

      if (!profileResponse.data) {
        navigate('/profile/setup');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    navigate('/search', { state: { query: searchQuery } });
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleVisibility = async () => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/profile/visibility`,
        { visibility_public: !profile.visibility_public },
        { withCredentials: true }
      );
      setProfile({ ...profile, visibility_public: !profile.visibility_public });
      toast.success(`Profile is now ${!profile.visibility_public ? 'public' : 'private'}`);
    } catch (error) {
      console.error('Visibility toggle error:', error);
      toast.error("Failed to update visibility");
    }
  };

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
    <div className="min-h-screen bg-[#09090B]">
      {/* Header */}
      <div className="border-b border-white/5 backdrop-blur-xl bg-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-outfit font-bold text-white">SuperNetworkAI</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="connections-button"
              variant="ghost"
              onClick={() => navigate('/connections')}
              className="rounded-full hover:bg-white/10 text-gray-300 hover:text-white"
            >
              <Users className="w-5 h-5 mr-2" />
              Connections
            </Button>
            {profile && (
              <Button
                data-testid="visibility-toggle-button"
                variant="ghost"
                onClick={toggleVisibility}
                className="rounded-full hover:bg-white/10 text-gray-300 hover:text-white"
              >
                {profile.visibility_public ? (
                  <Eye className="w-5 h-5 mr-2" />
                ) : (
                  <EyeOff className="w-5 h-5 mr-2" />
                )}
                {profile.visibility_public ? 'Public' : 'Private'}
              </Button>
            )}
            <Button
              data-testid="logout-button"
              variant="ghost"
              onClick={handleLogout}
              className="rounded-full hover:bg-white/10 text-gray-300 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center ring-4 ring-primary/20">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full rounded-full" />
              ) : (
                <UserCircle2 className="w-12 h-12 text-white" />
              )}
            </div>
            <h2 className="text-4xl font-outfit font-bold text-white mb-2">
              {profile?.full_name || user?.name}
            </h2>
            <p className="text-gray-400 text-lg">
              {profile?.role_intent === 'COFOUNDER' && "Looking for a Co-founder"}
              {profile?.role_intent === 'TEAMMATE' && "Looking for Teammates"}
              {profile?.role_intent === 'CLIENT' && "Looking for Clients"}
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-primary transition-colors" />
              <Input
                data-testid="search-input"
                type="text"
                placeholder="Search for your perfect match... e.g., 'technical co-founder passionate about GenAI'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-16 pr-6 py-8 text-lg rounded-2xl bg-white/5 border-white/10 backdrop-blur-xl text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>
            <Button
              data-testid="search-button"
              type="submit"
              size="lg"
              className="mt-6 rounded-full px-12 py-6 bg-primary hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/25"
            >
              <Search className="w-5 h-5 mr-2" />
              Find Matches
            </Button>
          </form>
        </motion.div>

        {/* Ikigai Profile */}
        {profile?.ikigai && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-xl"
          >
            <h3 className="text-2xl font-outfit font-bold mb-6 text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Your Ikigai Profile
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <div className="text-xs font-bold text-primary mb-2 tracking-wider">PASSION</div>
                <p className="text-gray-300 leading-relaxed">{profile.ikigai.passion}</p>
              </div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20">
                <div className="text-xs font-bold text-secondary mb-2 tracking-wider">MISSION</div>
                <p className="text-gray-300 leading-relaxed">{profile.ikigai.mission}</p>
              </div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-blue-400/10 to-transparent border border-blue-400/20">
                <div className="text-xs font-bold text-blue-400 mb-2 tracking-wider">SKILLS</div>
                <p className="text-gray-300 leading-relaxed">{profile.ikigai.skillset}</p>
              </div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-purple-400/10 to-transparent border border-purple-400/20">
                <div className="text-xs font-bold text-purple-400 mb-2 tracking-wider">WORKING STYLE</div>
                <p className="text-gray-300 leading-relaxed">{profile.ikigai.working_style_availability || 'Not specified'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;