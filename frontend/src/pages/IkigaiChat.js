import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Loader2, Send, Bot, User, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const IKIGAI_QUESTIONS = [
  {
    id: "welcome",
    text: "Hello! I'm here to help you build a profile that truly resonates. To get started, would you like to auto-fill your details from LinkedIn, or should we dive straight into the interview?",
    type: "welcome",
    options: ["Paste LinkedIn URL", "Start the Interview"]
  },
  {
    id: "passion",
    text: "Let's start with your heart. What are your passions? What do you love building or exploring in your free time?",
    field: "passion"
  },
  {
    id: "skills",
    text: "That's fascinating. Now, what are you exceptionally good at? Tell me about your technical skills or unique superpowers.",
    field: "skillset"
  },
  {
    id: "mission",
    text: "Excellent! What's your ultimate mission? What impact do you want to create in the world?",
    field: "mission"
  },
  {
    id: "working_style",
    text: "Last question: What's your ideal working style? Remote, full-time, freelance? Any preferences?",
    field: "working_style_availability"
  }
];

const IkigaiChat = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState([{ role: "ai", text: IKIGAI_QUESTIONS[0].text, options: IKIGAI_QUESTIONS[0].options }]);
  const [userInput, setUserInput] = useState("");
  const [ikigaiData, setIkigaiData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    role_intent: "",
    skills: ""
  });
  const [showForm, setShowForm] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleOptionClick = (option) => {
    if (option === "Start the Interview") {
      // Add user message
      setMessages(prev => [...prev, { role: "user", text: option }]);
      // Move to first real question
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "ai", text: IKIGAI_QUESTIONS[1].text }]);
        setCurrentStep(1);
      }, 500);
    }
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    const currentQuestion = IKIGAI_QUESTIONS[currentStep];
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", text: userInput }]);
    
    // Save answer
    if (currentQuestion.field) {
      setIkigaiData(prev => ({
        ...prev,
        [currentQuestion.field]: userInput
      }));
    }

    setUserInput("");

    // Move to next question or finish
    setTimeout(() => {
      if (currentStep < IKIGAI_QUESTIONS.length - 1) {
        const nextStep = currentStep + 1;
        setMessages(prev => [...prev, { role: "ai", text: IKIGAI_QUESTIONS[nextStep].text }]);
        setCurrentStep(nextStep);
      } else {
        // Finished! Show form
        setMessages(prev => [...prev, { 
          role: "ai", 
          text: "Perfect! I've captured your Ikigai. Now let's complete your profile with a few more details." 
        }]);
        setTimeout(() => setShowForm(true), 1000);
      }
    }, 500);
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.role_intent || !formData.skills) {
      toast.error("Please fill in all required fields");
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
          portfolio_url: null,
          ikigai: ikigaiData
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

  const currentQuestionIndex = messages.filter(m => m.role === "ai").length;
  const totalQuestions = IKIGAI_QUESTIONS.length - 1; // Exclude welcome message

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-3">Define Your Ikigai.</h1>
          <p className="text-muted-foreground text-lg">Let our AI guide you to your perfect match.</p>
        </motion.div>

        {/* Chat Container */}
        <div className="glass-card rounded-3xl p-8 mb-6 min-h-[500px] max-h-[600px] overflow-y-auto">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'ai' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {message.role === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  
                  {/* Message */}
                  <div>
                    <div className={message.role === 'ai' ? 'chat-message-ai' : 'chat-message-user'}>
                      <p className="leading-relaxed">{message.text}</p>
                    </div>
                    
                    {/* Options */}
                    {message.options && (
                      <div className="flex gap-3 mt-3">
                        {message.options.map((option, idx) => (
                          <Button
                            key={idx}
                            onClick={() => handleOptionClick(option)}
                            variant={idx === 1 ? "default" : "outline"}
                            className="rounded-full"
                            data-testid={`option-${idx}`}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Form Section */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 rounded-2xl bg-muted/30 border border-border"
            >
              <form onSubmit={handleSubmitProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <Input
                    data-testid="full-name-input"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="bg-background"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">I'm looking for *</label>
                  <select
                    data-testid="role-select"
                    value={formData.role_intent}
                    onChange={(e) => setFormData({ ...formData, role_intent: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-background border border-input"
                    required
                  >
                    <option value="">Select...</option>
                    <option value="COFOUNDER">A Co-founder</option>
                    <option value="TEAMMATE">Teammates</option>
                    <option value="CLIENT">Clients</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Skills (comma-separated) *</label>
                  <Input
                    data-testid="skills-input"
                    placeholder="e.g., Next.js, Python, Product Management"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="bg-background"
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full btn-primary"
                  data-testid="submit-profile"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    "Complete Profile"
                  )}
                </Button>
              </form>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {!showForm && currentStep > 0 && (
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                data-testid="chat-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your response here..."
                className="pr-12 py-6 rounded-2xl bg-muted/50"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!userInput.trim()}
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary hover:bg-primary/90"
                data-testid="send-button"
              >
                <ArrowUp className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {currentStep > 0 && !showForm && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-2">
              {[...Array(totalQuestions)].map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all ${
                    idx < currentQuestionIndex ? 'w-8 bg-primary' : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              STEP {currentQuestionIndex} OF {totalQuestions}
            </span>
          </div>
        )}
        
        {!showForm && currentStep > 0 && (
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mt-4"
          >
            Finish Later →
          </Button>
        )}
      </div>
    </div>
  );
};

export default IkigaiChat;
