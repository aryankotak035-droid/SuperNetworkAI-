import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, ArrowLeft, UserPlus, Sparkles, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="min-h-screen bg-[#09090B] py-8 px-6">
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
          className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-8 backdrop-blur-xl"
        >
          <div className="text-xs text-gray-500 mb-2 tracking-wider font-semibold">YOUR SEARCH</div>
          <p className="text-xl text-white font-outfit leading-relaxed">{query}</p>
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-20"
            >
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
                </div>
                <p className="text-gray-400 text-lg">AI is finding your best matches...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {!loading && results.length > 0 && (
            <div className="space-y-5">
              {results.map((result, index) => (
                <motion.div
                  key={result.profile.profile_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  data-testid="match-card"
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl hover:border-primary/50 hover:bg-white/10 transition-all duration-300"
                >
                  {/* Rank Badge */}
                  <div className="absolute top-6 right-6">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center font-bold text-white text-lg shadow-lg">
                        {index + 1}
                      </div>
                      {index === 0 && <TrendingUp className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400" />}
                    </div>
                  </div>

                  <div className="flex items-start gap-6 pr-16">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-lg">
                      {result.profile.full_name.charAt(0)}
                    </div>

                    <div className="flex-1">
                      {/* Name & Role */}
                      <div className="mb-4">
                        <h3 className="text-2xl font-outfit font-bold text-white mb-2">
                          {result.profile.full_name}
                        </h3>
                        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                          {result.profile.role_intent}
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="mb-5">
                        <div className="flex flex-wrap gap-2">
                          {result.profile.skills.slice(0, 6).map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-300 border border-white/10 hover:border-primary/30 transition-colors"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* AI Explanation */}
                      <div className="relative p-5 rounded-xl bg-black/30 border border-primary/30 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-[10px] font-bold text-primary mb-1 tracking-widest">AI INSIGHT</div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {result.ai_explanation}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Connect Button */}
                      <div className="mt-6">
                        <Button
                          data-testid={`connect-button-${index}`}
                          onClick={() => handleConnect(result.profile.profile_id)}
                          className="rounded-full bg-secondary hover:bg-secondary/90 hover:scale-105 transition-all shadow-lg shadow-secondary/20"
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
        </AnimatePresence>

        {/* No Results */}
        {!loading && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="rounded-3xl bg-white/5 border border-white/10 p-12 max-w-md mx-auto backdrop-blur-xl">
              <div className="w-20 h-20 rounded-2xl bg-white/5 mx-auto mb-6 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-outfit font-bold text-white mb-3">
                No matches found
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Try adjusting your search query or check back later.
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