import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Edit2, Save, X, Sparkles, Briefcase, Target, Zap, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "../components/ThemeToggle";
import ProfileCompleteness from "../components/ProfileCompleteness";
import ProfileImageUpload from "../components/ProfileImageUpload";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState({
    full_name: "",
    role_intent: "",
    skills: "",
    ikigai: {
      passion: "",
      skillset: "",
      mission: "",
      working_style_availability: ""
    }
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    // Warn before leaving if there are unsaved changes
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const fetchProfile = async () => {
    try {
      const userResponse = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(userResponse.data);

      const profileResponse = await axios.get(`${BACKEND_URL}/api/profile/me`, {
        withCredentials: true
      });
      const profileData = profileResponse.data;
      setProfile(profileData);

      if (profileData) {
        setEditData({
          full_name: profileData.full_name,
          role_intent: profileData.role_intent,
          skills: profileData.skills.join(', '),
          ikigai: profileData.ikigai || {
            passion: "",
            skillset: "",
            mission: "",
            working_style_availability: ""
          }
        });
      }
    } catch (error) {
      console.error('Profile fetch failed:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditData(prev => ({ ...prev, [field]: value }));
    }
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!editData.full_name.trim()) {
      newErrors.full_name = "Name is required";
    }

    if (!editData.role_intent) {
      newErrors.role_intent = "Role intent is required";
    }

    if (!editData.skills.trim()) {
      newErrors.skills = "At least one skill is required";
    }

    if (!editData.ikigai.passion.trim()) {
      newErrors.passion = "Passion is required";
    }

    if (!editData.ikigai.skillset.trim()) {
      newErrors.skillset = "Skillset is required";
    }

    if (!editData.ikigai.mission.trim()) {
      newErrors.mission = "Mission is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    setSaving(true);
    try {
      const skillsArray = editData.skills.split(',').map(s => s.trim()).filter(s => s);

      await axios.put(
        `${BACKEND_URL}/api/profile/me`,
        {
          full_name: editData.full_name,
          role_intent: editData.role_intent,
          skills: skillsArray,
          portfolio_url: null,
          ikigai: editData.ikigai
        },
        { withCredentials: true }
      );

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setHasChanges(false);
      await fetchProfile();
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        setIsEditing(false);
        setHasChanges(false);
        setErrors({});
        // Reset to original data
        if (profile) {
          setEditData({
            full_name: profile.full_name,
            role_intent: profile.role_intent,
            skills: profile.skills.join(', '),
            ikigai: profile.ikigai || {
              passion: "",
              skillset: "",
              mission: "",
              working_style_availability: ""
            }
          });
        }
      }
    } else {
      setIsEditing(false);
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
          <div className="flex items-center gap-2">
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400"
              >
                <AlertCircle className="w-4 h-4" />
                Unsaved changes
              </motion.div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Profile Completeness */}
        <div className="mb-6">
          <ProfileCompleteness />
        </div>

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
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Input
                      value={editData.full_name}
                      onChange={(e) => handleEditChange('full_name', e.target.value)}
                      className={`text-2xl font-bold h-auto py-2 ${errors.full_name ? 'border-destructive' : ''}`}
                      placeholder="Full Name"
                    />
                    {errors.full_name && (
                      <p className="text-xs text-destructive mt-1">{errors.full_name}</p>
                    )}
                  </div>
                  <div>
                    <select
                      value={editData.role_intent}
                      onChange={(e) => handleEditChange('role_intent', e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg bg-background border ${errors.role_intent ? 'border-destructive' : 'border-input'}`}
                    >
                      <option value="">Select Role Intent</option>
                      <option value="COFOUNDER">Co-founder</option>
                      <option value="TEAMMATE">Teammate</option>
                      <option value="CLIENT">Client</option>
                    </select>
                    {errors.role_intent && (
                      <p className="text-xs text-destructive mt-1">{errors.role_intent}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      value={editData.skills}
                      onChange={(e) => handleEditChange('skills', e.target.value)}
                      className={errors.skills ? 'border-destructive' : ''}
                      placeholder="Skills (comma-separated)"
                    />
                    {errors.skills && (
                      <p className="text-xs text-destructive mt-1">{errors.skills}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Separate skills with commas</p>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
            
            {/* Edit/Save Buttons */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="btn-primary gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={saving}
                    size="icon"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Button>
              )}
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
                {isEditing ? (
                  <div>
                    <Textarea
                      value={editData.ikigai.passion}
                      onChange={(e) => handleEditChange('ikigai.passion', e.target.value)}
                      className={`min-h-[100px] ${errors.passion ? 'border-destructive' : ''}`}
                      placeholder="What are you passionate about?"
                    />
                    {errors.passion && (
                      <p className="text-xs text-destructive mt-1">{errors.passion}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-foreground leading-relaxed">{profile.ikigai.passion}</p>
                )}
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
                {isEditing ? (
                  <div>
                    <Textarea
                      value={editData.ikigai.mission}
                      onChange={(e) => handleEditChange('ikigai.mission', e.target.value)}
                      className={`min-h-[100px] ${errors.mission ? 'border-destructive' : ''}`}
                      placeholder="What do you want to achieve?"
                    />
                    {errors.mission && (
                      <p className="text-xs text-destructive mt-1">{errors.mission}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-foreground leading-relaxed">{profile.ikigai.mission}</p>
                )}
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
                {isEditing ? (
                  <div>
                    <Textarea
                      value={editData.ikigai.skillset}
                      onChange={(e) => handleEditChange('ikigai.skillset', e.target.value)}
                      className={`min-h-[100px] ${errors.skillset ? 'border-destructive' : ''}`}
                      placeholder="Describe your skills"
                    />
                    {errors.skillset && (
                      <p className="text-xs text-destructive mt-1">{errors.skillset}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-foreground leading-relaxed">{profile.ikigai.skillset}</p>
                )}
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
                {isEditing ? (
                  <Textarea
                    value={editData.ikigai.working_style_availability}
                    onChange={(e) => handleEditChange('ikigai.working_style_availability', e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Your working style (optional)"
                  />
                ) : (
                  <p className="text-foreground leading-relaxed">
                    {profile.ikigai.working_style_availability || 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;
