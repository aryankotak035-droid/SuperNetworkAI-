import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, UserCircle2, LogOut, Users, Eye, EyeOff, Sparkles, TrendingUp, UserPlus, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "../components/ThemeToggle";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const trendingFilters = [
    { id: "ALL", label: "All", icon: <Users className="w-4 h-4" /> },
    { id: "COFOUNDER", label: "Co-founder", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "TEAMMATE", label: "Teammate", icon: <Users className="w-4 h-4" /> },
    { id: "CLIENT", label: "Client", icon: <UserPlus className="w-4 h-4" /> }
  ];

  useEffect(() => {
    checkAuth();
    fetchProfiles();
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
        navigate('/ikigai-chat');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    try {
      // Get all profiles with simple search
      const response = await axios.post(
        `${BACKEND_URL}/api/search`,
        {
          query: "Find interesting professionals",
          role_filter: null
        },
        { withCredentials: true }
      );
      
      // Get more profiles by fetching with fallback
      if (response.data.length < 10) {
        // Fetch some synthetic profiles from database directly
        // For now, we'll just use what we get
      }
      
      setProfiles(response.data);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoadingProfiles(false);
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

  const handleConnect = async (profileId) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/connections/request`,
        { receiver_profile_id: profileId },
        { withCredentials: true }
      );
      toast.success("Connection request sent!");
    } catch (error) {
      console.error('Connection request error:', error);
      toast.error(error.response?.data?.detail || "Failed to send connection request");
    }
  };

  const filteredProfiles = selectedFilter === "ALL" 
    ? profiles 
    : profiles.filter(p => p.profile.role_intent === selectedFilter);

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
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold\">SuperNetworkAI</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="messages-button"
              variant="ghost"
              onClick={() => navigate('/messages')}
              className="rounded-full gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Messages
            </Button>
            <Button
              data-testid="profile-button"
              variant="ghost"
              onClick={() => navigate('/profile')}
              className="rounded-full gap-2"
            >
              <UserCircle2 className="w-5 h-5" />
              Profile
            </Button>
            <Button
              data-testid="connections-button"
              variant="ghost"
              onClick={() => navigate('/connections')}
              className="rounded-full gap-2"
            >
              <Users className="w-5 h-5" />
              Connections
            </Button>
            {profile && (
              <Button
                data-testid="visibility-toggle-button"
                variant="ghost"
                onClick={toggleVisibility}
                className="rounded-full gap-2"
              >
                {profile.visibility_public ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </Button>
            )}
            <ThemeToggle />
            <Button
              data-testid="logout-button"
              variant="ghost"
              onClick={handleLogout}
              className="rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">Find Your Ideal Builder</h2>
          <p className="text-muted-foreground mb-6">Discover professionals who match your vision and mission</p>
          
          <form onSubmit={handleSearch} className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              data-testid="search-input"
              type="text"
              placeholder="Search for co-founders, developers, designers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg rounded-2xl glass-card"
            />
          </form>

          {/* Trending Filters */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-3">TRENDING</div>
            <div className="flex gap-3 flex-wrap">
              {trendingFilters.map((filter) => (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                    selectedFilter === filter.id
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'glass-card glass-card-hover'
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Profiles Grid */}
        {loadingProfiles ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredProfiles.map((result, index) => (
                <motion.div
                  key={result.profile.profile_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="glass-card rounded-2xl p-6 glass-card-hover"
                  data-testid="profile-card"
                >
                  {/* Avatar & Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0">
                      {result.profile.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate">{result.profile.full_name}</h3>
                      <span className="inline-block text-sm text-secondary font-medium">
                        {result.profile.role_intent}
                      </span>
                    </div>
                  </div>

                  {/* Bio/Mission */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                    {result.profile.ikigai?.mission || "Building something amazing"}
                  </p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {result.profile.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded-md bg-muted text-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                    {result.profile.skills.length > 3 && (
                      <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                        +{result.profile.skills.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Match Info */}
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-primary">AI MATCH INSIGHT</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                      {result.ai_explanation}
                    </p>
                  </div>

                  {/* Connect Button */}
                  <Button
                    onClick={() => handleConnect(result.profile.profile_id)}
                    className="w-full btn-primary"
                    data-testid={`connect-button-${index}`}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredProfiles.length === 0 && !loadingProfiles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="glass-card rounded-3xl p-12 max-w-md mx-auto">
              <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3">No profiles found</h3>
              <p className="text-muted-foreground mb-6">
                Try a different filter or check back later!
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
