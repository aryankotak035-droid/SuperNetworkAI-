import { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProfileCompleteness = ({ compact = false }) => {
  const [completeness, setCompleteness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompleteness();
  }, []);

  const fetchCompleteness = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/profile/completeness`, {
        withCredentials: true
      });
      setCompleteness(response.data);
    } catch (error) {
      console.error('Failed to fetch completeness:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !completeness) return null;

  const { completeness: score, missing } = completeness;

  const getColor = () => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getBgColor = () => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const fieldLabels = {
    full_name: "Full Name",
    role_intent: "Role Intent",
    skills: "Skills",
    portfolio_url: "Portfolio URL",
    passion: "Passion",
    skillset: "Skillset",
    mission: "Mission",
    working_style_availability: "Working Style"
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
        data-testid="profile-completeness-compact"
      >
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full ${getBgColor()}`}
            />
          </div>
          <span className={`text-sm font-bold ${getColor()}`}>{score}%</span>
        </div>
        {score < 100 && (
          <span className="text-xs text-muted-foreground">
            {missing.length} field{missing.length !== 1 ? 's' : ''} incomplete
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
      data-testid="profile-completeness"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Profile Completeness</h3>
        <span className={`text-2xl font-bold ${getColor()}`}>{score}%</span>
      </div>

      {/* Progress Bar */}
      <div className="h-3 rounded-full bg-muted overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${getBgColor()}`}
        />
      </div>

      {score === 100 ? (
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">Your profile is complete!</span>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Complete these fields for better matches:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(fieldLabels).map((field) => {
              const isComplete = !missing.includes(field);
              return (
                <div
                  key={field}
                  className={`flex items-center gap-2 text-sm ${
                    isComplete ? 'text-green-500' : 'text-muted-foreground'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  <span>{fieldLabels[field]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProfileCompleteness;
