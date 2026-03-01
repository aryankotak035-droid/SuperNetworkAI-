import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { ArrowLeft, Edit2, Sparkles, Briefcase, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "../components/ThemeToggle";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const userResponse = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(userResponse.data);

      const profileResponse = await axios.get(`${BACKEND_URL}/api/profile/me`, {
        withCredentials: true
      });
      setProfile(profileResponse.data);
    } catch (error) {
      console.error('Profile fetch failed:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No profile found</p>
          <Button onClick={() => navigate('/ikigai-chat')}>Create Profile</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border backdrop-blur-xl bg-card/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 mb-6"
        >
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white shadow-lg">
              {profile.full_name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{profile.full_name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-primary/20 text-primary border border-primary/30">
                  {profile.role_intent}
                </span>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                  profile.visibility_public 
                    ? 'bg-secondary/20 text-secondary border border-secondary/30' 
                    : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  {profile.visibility_public ? 'Public' : 'Private'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-sm bg-muted text-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ikigai Section */}
        {profile.ikigai && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold">Your Ikigai Profile</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Passion */}
              <div className="glass-card rounded-2xl p-6 glass-card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-red-400 tracking-wider">PASSION</div>
                    <div className="text-sm text-muted-foreground">What you love</div>
                  </div>
                </div>
                <p className="text-foreground leading-relaxed">{profile.ikigai.passion}</p>
              </div>

              {/* Mission */}
              <div className="glass-card rounded-2xl p-6 glass-card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-400 tracking-wider">MISSION</div>
                    <div className="text-sm text-muted-foreground">What you aim for</div>
                  </div>
                </div>
                <p className="text-foreground leading-relaxed">{profile.ikigai.mission}</p>
              </div>

              {/* Skills */}
              <div className="glass-card rounded-2xl p-6 glass-card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-400 tracking-wider">SKILLSET</div>
                    <div className="text-sm text-muted-foreground">What you're good at</div>
                  </div>
                </div>
                <p className="text-foreground leading-relaxed">{profile.ikigai.skillset}</p>
              </div>

              {/* Working Style */}
              <div className="glass-card rounded-2xl p-6 glass-card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-400 tracking-wider">WORKING STYLE</div>
                    <div className="text-sm text-muted-foreground">How you work best</div>
                  </div>
                </div>
                <p className="text-foreground leading-relaxed">
                  {profile.ikigai.working_style_availability || 'Not specified'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex gap-4"
        >
          <Button
            onClick={() => toast.info("Edit profile feature coming soon!")}
            className="btn-primary gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
