import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, Upload, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [cvText, setCvText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extracted, setExtracted] = useState(false);
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
      setExtracted(true);
      toast.success("Ikigai extracted! Review and edit as needed.");
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
        className="max-w-3xl mx-auto"
      >
        <div className="rounded-3xl bg-white/5 border border-white/10 p-8 md:p-12 backdrop-blur-xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-outfit font-bold text-white mb-3">
              Create Your Profile
            </h1>
            <p className="text-gray-400">
              Let AI extract your Ikigai from your CV
            </p>
          </div>

          {/* CV Upload Section */}
          <div className="mb-10 p-8 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <Label className="text-xl font-bold text-white">Paste Your Profile Text</Label>
            </div>
            <p className="text-sm text-gray-400 mb-4 pl-13">
              📝 Copy and paste the <span className="text-white font-semibold">text content</span> from your CV, resume, or LinkedIn profile.<br/>
              ⚠️ <span className="text-yellow-400">Note:</span> Please paste the actual text, not just the URL.
            </p>
            <Textarea
              data-testid="cv-textarea"
              placeholder="Paste your profile text here... (e.g., from your CV, resume, or copy the text from your LinkedIn 'About' and 'Experience' sections)"
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              className="min-h-[220px] bg-black/40 border-white/10 text-white placeholder:text-gray-500 mb-5 rounded-2xl resize-none focus:border-blue-500/50 smooth-transition"
            />
            <Button
              data-testid="extract-ikigai-button"
              onClick={handleExtractIkigai}
              disabled={extracting || !cvText.trim()}
              className="btn-premium text-white font-semibold w-full rounded-2xl py-6 smooth-transition hover:scale-[1.02]"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  AI is extracting your Ikigai...
                </>
              ) : extracted ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Extracted! Review & edit below
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Extract Ikigai with AI
                </>
              )}
            </Button>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="full_name" className="text-white mb-2 block">Full Name *</Label>
              <Input
                id="full_name"
                data-testid="full-name-input"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-black/30 border-white/10 text-white rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="role_intent" className="text-white mb-2 block">I'm looking for *</Label>
              <Select
                value={formData.role_intent}
                onValueChange={(value) => setFormData({ ...formData, role_intent: value })}
              >
                <SelectTrigger data-testid="role-intent-select" className="bg-black/30 border-white/10 text-white rounded-xl">
                  <SelectValue placeholder="Select your intent" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181B] border-white/10">
                  <SelectItem value="COFOUNDER">A Co-founder</SelectItem>
                  <SelectItem value="TEAMMATE">Teammates</SelectItem>
                  <SelectItem value="CLIENT">Clients</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="skills" className="text-white mb-2 block">Skills (comma-separated) *</Label>
              <Input
                id="skills"
                data-testid="skills-input"
                placeholder="e.g., Next.js, Python, Product Management"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="bg-black/30 border-white/10 text-white rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="portfolio_url" className="text-white mb-2 block">Portfolio URL (optional)</Label>
              <Input
                id="portfolio_url"
                data-testid="portfolio-url-input"
                placeholder="https://your-portfolio.com"
                value={formData.portfolio_url}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                className="bg-black/30 border-white/10 text-white rounded-xl"
              />
            </div>

            {/* Ikigai Fields */}
            <div className="pt-6 border-t border-white/10">
              <h3 className="text-xl font-outfit font-semibold mb-6 flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-primary" />
                Your Ikigai
              </h3>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="passion" className="text-white mb-2 block">Passion *</Label>
                  <Textarea
                    id="passion"
                    data-testid="passion-textarea"
                    placeholder="What are you passionate about?"
                    value={ikigai.passion}
                    onChange={(e) => setIkigai({ ...ikigai, passion: e.target.value })}
                    className="bg-black/30 border-white/10 text-white placeholder:text-gray-500 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="skillset" className="text-white mb-2 block">Skillset *</Label>
                  <Textarea
                    id="skillset"
                    data-testid="skillset-textarea"
                    placeholder="Describe your technical and professional skills"
                    value={ikigai.skillset}
                    onChange={(e) => setIkigai({ ...ikigai, skillset: e.target.value })}
                    className="bg-black/30 border-white/10 text-white placeholder:text-gray-500 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="mission" className="text-white mb-2 block">Mission *</Label>
                  <Textarea
                    id="mission"
                    data-testid="mission-textarea"
                    placeholder="What do you want to achieve or build?"
                    value={ikigai.mission}
                    onChange={(e) => setIkigai({ ...ikigai, mission: e.target.value })}
                    className="bg-black/30 border-white/10 text-white placeholder:text-gray-500 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="working_style" className="text-white mb-2 block">Working Style</Label>
                  <Textarea
                    id="working_style"
                    data-testid="working-style-textarea"
                    placeholder="Remote, full-time, part-time, freelance, etc."
                    value={ikigai.working_style_availability}
                    onChange={(e) => setIkigai({ ...ikigai, working_style_availability: e.target.value })}
                    className="bg-black/30 border-white/10 text-white placeholder:text-gray-500 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <Button
              data-testid="save-profile-button"
              type="submit"
              disabled={saving}
              size="lg"
              className="w-full rounded-full bg-primary hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/20 mt-8 py-6"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Profile...
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