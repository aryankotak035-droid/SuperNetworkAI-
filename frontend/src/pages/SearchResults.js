import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, ArrowLeft, UserPlus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const query = location.state?.query || "";

  useEffect(() => {
    if (query) {
      performSearch();
    } else {
      navigate('/dashboard');
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/search`,
        {
          query,
          role_filter: roleFilter || null
        },
        { withCredentials: true }
      );
      setResults(response.data);
      
      if (response.data.length === 0) {
        toast.info("No matches found. Try adjusting your search.");
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-[#09090B] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            data-testid="back-button"
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>

          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value)}>
            <SelectTrigger data-testid="role-filter-select" className="w-48 bg-white/5 border-white/10 text-white rounded-full">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent className="bg-[#18181B] border-white/10">
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="COFOUNDER">Co-founders</SelectItem>
              <SelectItem value="TEAMMATE">Teammates</SelectItem>
              <SelectItem value="CLIENT">Clients</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Query Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-6 mb-8"
        >
          <div className="text-sm text-gray-400 mb-2">YOUR SEARCH</div>
          <p className="text-xl text-white font-outfit">{query}</p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Finding your perfect matches...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-6">
            {results.map((result, index) => (
              <motion.div
                key={result.profile.profile_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                data-testid="match-card"
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md hover:border-primary/50 hover:bg-white/10 transition-all duration-300"
              >
                {/* Rank Badge */}
                <div className="absolute top-4 right-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                    {result.profile.full_name.charAt(0)}
                  </div>

                  <div className="flex-1">
                    {/* Name & Role */}
                    <div className="mb-3">
                      <h3 className="text-2xl font-outfit font-bold text-white mb-1">
                        {result.profile.full_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                          {result.profile.role_intent}
                        </span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {result.profile.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-3 py-1 rounded-full bg-white/10 text-gray-300 border border-white/10"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI Explanation */}
                    <div className="relative mt-4 p-4 rounded-lg bg-black/40 border border-primary/20">
                      <div className="absolute -top-3 left-3 bg-[#09090B] px-2 text-[10px] text-primary font-mono">
                        AI_INSIGHT
                      </div>
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="font-mono text-sm text-gray-300">
                          {result.ai_explanation}
                        </p>
                      </div>
                    </div>

                    {/* Connect Button */}
                    <div className="mt-6">
                      <Button
                        data-testid={`connect-button-${index}`}
                        onClick={() => handleConnect(result.profile.profile_id)}
                        className="rounded-full bg-secondary hover:bg-secondary/90"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="glass-effect rounded-2xl p-12 max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-white/5 mx-auto mb-6 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-outfit font-bold text-white mb-3">
                No matches found
              </h3>
              <p className="text-gray-400 mb-6">
                Try adjusting your search query or come back later as more people join.
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="rounded-full bg-primary hover:bg-primary/90"
              >
                Back to Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;