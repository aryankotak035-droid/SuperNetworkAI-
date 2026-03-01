import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, Upload, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [cvText, setCvText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ikigai, setIkigai] = useState({
    passion: "",
    skillset: "",
    mission: "",
    working_style_availability: ""
  });
  const [formData, setFormData] = useState({
    full_name: "",
    role_intent: "",
    skills: "",
    portfolio_url: ""
  });

  const handleExtractIkigai = async () => {
    if (!cvText.trim()) {
      toast.error("Please paste your CV or portfolio text first");
      return;
    }

    setExtracting(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/profile/extract-ikigai`,
        { cv_text: cvText },
        { withCredentials: true }
      );

      setIkigai(response.data);
      toast.success("Ikigai extracted successfully! Review and edit as needed.");
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error("Failed to extract Ikigai. Please try again or fill manually.");
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name || !formData.role_intent || !formData.skills) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!ikigai.passion || !ikigai.skillset || !ikigai.mission) {
      toast.error("Please extract or fill in your Ikigai profile");
      return;
    }

    setSaving(true);
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);

      await axios.post(
        `${BACKEND_URL}/api/profile/create`,
        {
          full_name: formData.full_name,
          role_intent: formData.role_intent,
          skills: skillsArray,
          portfolio_url: formData.portfolio_url || null,
          ikigai
        },
        { withCredentials: true }
      );

      toast.success("Profile created successfully!");
      navigate('/dashboard');
    } catch (error) {
      console.error('Profile creation error:', error);
      toast.error(error.response?.data?.detail || "Failed to create profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="glass-effect rounded-2xl p-8 md:p-12">
          <h1 className="text-4xl font-outfit font-bold text-gradient mb-3">
            Create Your Ikigai Profile
          </h1>
          <p className="text-gray-400 mb-8">
            Let AI extract your unique profile from your CV, then review and save.
          </p>

          {/* CV Upload Section */}
          <div className="mb-8 p-6 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-primary" />
              <Label className="text-lg font-outfit font-semibold">Paste Your CV or Portfolio</Label>
            </div>
            <Textarea
              data-testid="cv-textarea"
              placeholder="Paste your CV text, LinkedIn profile, or portfolio description here..."
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              className="min-h-[200px] bg-background/50 border-white/10 text-white placeholder:text-gray-500 mb-4"
            />
            <Button
              data-testid="extract-ikigai-button"
              onClick={handleExtractIkigai}
              disabled={extracting || !cvText.trim()}
              className="rounded-full bg-primary hover:bg-primary/90"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Extract Ikigai with AI
                </>
              )}
            </Button>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                data-testid="full-name-input"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-background/50 border-white/10 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="role_intent">I'm looking for *</Label>
              <Select
                value={formData.role_intent}
                onValueChange={(value) => setFormData({ ...formData, role_intent: value })}
              >
                <SelectTrigger data-testid="role-intent-select" className="bg-background/50 border-white/10 text-white">
                  <SelectValue placeholder="Select your intent" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181B] border-white/10">
                  <SelectItem value="COFOUNDER">A Co-founder</SelectItem>
                  <SelectItem value="TEAMMATE">Teammates for a project</SelectItem>
                  <SelectItem value="CLIENT">Clients for my services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="skills">Skills (comma-separated) *</Label>
              <Input
                id="skills"
                data-testid="skills-input"
                placeholder="e.g., Next.js, Python, Product Management"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="bg-background/50 border-white/10 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="portfolio_url">Portfolio URL (optional)</Label>
              <Input
                id="portfolio_url"
                data-testid="portfolio-url-input"
                placeholder="https://your-portfolio.com"
                value={formData.portfolio_url}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                className="bg-background/50 border-white/10 text-white"
              />
            </div>

            {/* Ikigai Fields */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-xl font-outfit font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Your Ikigai Profile
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="passion">Passion *</Label>
                  <Textarea
                    id="passion"
                    data-testid="passion-textarea"
                    placeholder="What are you passionate about?"
                    value={ikigai.passion}
                    onChange={(e) => setIkigai({ ...ikigai, passion: e.target.value })}
                    className="bg-background/50 border-white/10 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="skillset">Skillset *</Label>
                  <Textarea
                    id="skillset"
                    data-testid="skillset-textarea"
                    placeholder="Describe your technical and professional skills"
                    value={ikigai.skillset}
                    onChange={(e) => setIkigai({ ...ikigai, skillset: e.target.value })}
                    className="bg-background/50 border-white/10 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="mission">Mission *</Label>
                  <Textarea
                    id="mission"
                    data-testid="mission-textarea"
                    placeholder="What do you want to achieve or build?"
                    value={ikigai.mission}
                    onChange={(e) => setIkigai({ ...ikigai, mission: e.target.value })}
                    className="bg-background/50 border-white/10 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="working_style">Working Style & Availability</Label>
                  <Textarea
                    id="working_style"
                    data-testid="working-style-textarea"
                    placeholder="Remote, full-time, part-time, freelance, etc."
                    value={ikigai.working_style_availability}
                    onChange={(e) => setIkigai({ ...ikigai, working_style_availability: e.target.value })}
                    className="bg-background/50 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            <Button
              data-testid="save-profile-button"
              type="submit"
              disabled={saving}
              size="lg"
              className="w-full rounded-full bg-primary hover:bg-primary/90 glow-effect hover:glow-effect-hover"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                "Save Profile & Continue"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;