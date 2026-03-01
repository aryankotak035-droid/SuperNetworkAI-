import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, UserCircle2, LogOut, Users, Eye, EyeOff, Sparkles, TrendingUp, UserPlus, MessageCircle, X, Filter, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "../components/ThemeToggle";
import { ProfileCardSkeleton, SearchBarSkeleton } from "../components/SkeletonLoaders";
import ProfileCompleteness from "../components/ProfileCompleteness";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);

  const roleOptions = [
    { id: "COFOUNDER", label: "Co-founder", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "TEAMMATE", label: "Teammate", icon: <Users className="w-4 h-4" /> },
    { id: "CLIENT", label: "Client", icon: <UserPlus className="w-4 h-4" /> }
  ];

  useEffect(() => {
    checkAuth();
    fetchProfiles();
  }, []);

  useEffect(() => {
    // Extract unique skills from profiles
    const skills = new Set();
    profiles.forEach(p => {
      p.profile.skills.forEach(skill => skills.add(skill));
    });
    setAvailableSkills([...skills].sort());
  }, [profiles]);

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
      const response = await axios.post(
        `${BACKEND_URL}/api/search`,
        {
          query: "Find interesting professionals",
          role_filter: null
        },
        { withCredentials: true }
      );
      setProfiles(response.data);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
      toast.error("Failed to load profiles");
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

  const toggleRole = (roleId) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(r => r !== roleId)
        : [...prev, roleId]
    );
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const clearAllFilters = () => {
    setSelectedRoles([]);
    setSelectedSkills([]);
  };

  const hasActiveFilters = selectedRoles.length > 0 || selectedSkills.length > 0;

  // Filter profiles based on selected filters
  const filteredProfiles = profiles.filter(p => {
    const roleMatch = selectedRoles.length === 0 || selectedRoles.includes(p.profile.role_intent);
    const skillMatch = selectedSkills.length === 0 || selectedSkills.some(skill => 
      p.profile.skills.includes(skill)
    );
    return roleMatch && skillMatch;
  });

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
            <h1 className="text-xl font-bold">SuperNetworkAI</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              data-testid="messages-button"
              variant="ghost"
              onClick={() => navigate('/messages')}
              className="rounded-full gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Messages</span>
            </Button>
            <Button
              data-testid="profile-button"
              variant="ghost"
              onClick={() => navigate('/profile')}
              className="rounded-full gap-2"
            >
              <UserCircle2 className="w-5 h-5" />
              <span className="hidden sm:inline">Profile</span>
            </Button>
            <Button
              data-testid="connections-button"
              variant="ghost"
              onClick={() => navigate('/connections')}
              className="rounded-full gap-2"
            >
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">Connections</span>
            </Button>
            {profile && (
              <Button
                data-testid="visibility-toggle-button"
                variant="ghost"
                onClick={toggleVisibility}
                size="icon"
                className="rounded-full"
              >
                {profile.visibility_public ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </Button>
            )}
            <ThemeToggle />
            <Button
              data-testid="logout-button"
              variant="ghost"
              onClick={handleLogout}
              size="icon"
              className="rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Section */}
        {loadingProfiles && !profiles.length ? (
          <SearchBarSkeleton />
        ) : (
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

            {/* Filter Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                {filteredProfiles.length} {filteredProfiles.length === 1 ? 'Profile' : 'Profiles'} Found
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 rounded-full"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedRoles.length + selectedSkills.length}
                  </span>
                )}
              </Button>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-card rounded-2xl p-6 mb-6 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Advanced Filters
                    </h3>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-destructive"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  {/* Role Filters */}
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-3">Role Intent</div>
                    <div className="flex flex-wrap gap-2">
                      {roleOptions.map((role) => (
                        <button
                          key={role.id}
                          onClick={() => toggleRole(role.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                            selectedRoles.includes(role.id)
                              ? 'bg-primary text-primary-foreground shadow-lg'
                              : 'glass-card glass-card-hover'
                          }`}
                        >
                          {role.icon}
                          {role.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skill Filters */}
                  <div>
                    <div className="text-sm font-medium mb-3">Skills ({availableSkills.length} available)</div>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {availableSkills.slice(0, 20).map((skill) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            selectedSkills.includes(skill)
                              ? 'bg-secondary text-secondary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedRoles.map(roleId => {
                  const role = roleOptions.find(r => r.id === roleId);
                  return (
                    <motion.div
                      key={roleId}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-medium"
                    >
                      {role?.label}
                      <button onClick={() => toggleRole(roleId)} className="hover:bg-primary/30 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  );
                })}
                {selectedSkills.map(skill => (
                  <motion.div
                    key={skill}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 text-secondary text-sm font-medium"
                  >
                    {skill}
                    <button onClick={() => toggleSkill(skill)} className="hover:bg-secondary/30 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Profiles Grid */}
        {loadingProfiles ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="glass-card rounded-3xl p-12 max-w-md mx-auto">
              <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3">No profiles found</h3>
              <p className="text-muted-foreground mb-6">
                {hasActiveFilters 
                  ? "Try adjusting your filters or clear all to see more results."
                  : "Check back later as more people join!"}
              </p>
              {hasActiveFilters && (
                <Button onClick={clearAllFilters} className="btn-primary">
                  Clear All Filters
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredProfiles.map((result, index) => (
                <motion.div
                  key={result.profile.profile_id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
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
      </div>
    </div>
  );
};

export default Dashboard;
