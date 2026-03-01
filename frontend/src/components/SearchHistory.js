import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { History, X, Trash2, Search, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SearchHistory = ({ onSelectSearch, isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/search/history`, {
        withCredentials: true
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch search history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${BACKEND_URL}/api/search/history/${id}`, {
        withCredentials: true
      });
      setHistory(prev => prev.filter(h => h.id !== id));
      toast.success("Search removed from history");
    } catch (error) {
      console.error('Failed to delete history item:', error);
      toast.error("Failed to remove search");
    }
  };

  const handleClearAll = async () => {
    try {
      await axios.delete(`${BACKEND_URL}/api/search/history`, {
        withCredentials: true
      });
      setHistory([]);
      toast.success("Search history cleared");
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast.error("Failed to clear history");
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  const roleLabels = {
    COFOUNDER: "Co-founder",
    TEAMMATE: "Teammate",
    CLIENT: "Client"
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 glass-card rounded-2xl p-4 shadow-xl z-50 max-h-80 overflow-y-auto"
        data-testid="search-history"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <History className="w-4 h-4 text-primary" />
            Recent Searches
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent searches</p>
          </div>
        ) : (
          <div className="space-y-1">
            {history.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                onClick={() => {
                  onSelectSearch(item.query, item.role_filter);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors group flex items-start gap-3"
              >
                <Search className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.query}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.role_filter && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {roleLabels[item.role_filter]}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(item.created_at)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDelete(item.id, e)}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchHistory;
