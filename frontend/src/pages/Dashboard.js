import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, UserCircle2, LogOut, Users, Eye, EyeOff } from "lucide-react";
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
      <div className="glass-effect border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-outfit font-bold text-gradient">SuperNetworkAI</h1>
          <div className="flex items-center gap-4">
            <Button
              data-testid="connections-button"
              variant="ghost"
              onClick={() => navigate('/connections')}
              className="rounded-full hover:bg-white/10"
            >
              <Users className="w-5 h-5 mr-2" />
              Connections
            </Button>
            {profile && (
              <Button
                data-testid="visibility-toggle-button"
                variant="ghost"
                onClick={toggleVisibility}
                className="rounded-full hover:bg-white/10"
              >
                {profile.visibility_public ? (
                  <>
                    <Eye className="w-5 h-5 mr-2" />
                    Public
                  </>
                ) : (
                  <>
                    <EyeOff className="w-5 h-5 mr-2" />
                    Private
                  </>
                )}
              </Button>
            )}
            <Button
              data-testid="logout-button"
              variant="ghost"
              onClick={handleLogout}
              className="rounded-full hover:bg-white/10"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full rounded-full" />
              ) : (
                <UserCircle2 className="w-12 h-12 text-white" />
              )}
            </div>
            <h2 className="text-3xl font-outfit font-bold text-white mb-2">
              Welcome, {profile?.full_name || user?.name}!
            </h2>
            <p className="text-gray-400">
              {profile?.role_intent === 'COFOUNDER' && "Looking for a Co-founder"}
              {profile?.role_intent === 'TEAMMATE' && "Looking for Teammates"}
              {profile?.role_intent === 'CLIENT' && "Looking for Clients"}
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <Input
                data-testid="search-input"
                type="text"
                placeholder="Search for matches... e.g., 'I need a technical co-founder skilled in Next.js passionate about GenAI'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-16 pr-6 py-7 text-lg rounded-full bg-white/5 border-white/10 backdrop-blur-xl text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <Button
              data-testid="search-button"
              type="submit"
              size="lg"
              className="mt-6 rounded-full px-12 bg-primary hover:bg-primary/90 glow-effect"
            >
              Find Matches
            </Button>
          </form>
        </motion.div>

        {/* Profile Summary */}
        {profile?.ikigai && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-2xl p-8"
          >
            <h3 className="text-2xl font-outfit font-bold mb-6">Your Ikigai Profile</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-primary font-semibold mb-2">PASSION</div>
                <p className="text-gray-300">{profile.ikigai.passion}</p>
              </div>
              <div>
                <div className="text-sm text-secondary font-semibold mb-2">MISSION</div>
                <p className="text-gray-300">{profile.ikigai.mission}</p>
              </div>
              <div>
                <div className="text-sm text-yellow-400 font-semibold mb-2">SKILLS</div>
                <p className="text-gray-300">{profile.ikigai.skillset}</p>
              </div>
              <div>
                <div className="text-sm text-purple-400 font-semibold mb-2">WORKING STYLE</div>
                <p className="text-gray-300">{profile.ikigai.working_style_availability || 'Not specified'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;