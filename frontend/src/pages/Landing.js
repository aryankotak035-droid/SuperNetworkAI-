import { motion } from "framer-motion";
import { Sparkles, Network, Brain, Zap } from "lucide-react";
import { Button } from "../components/ui/button";

const Landing = () => {
  const handleSignIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 ikigai-gradient opacity-60 pointer-events-none" />
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 min-h-screen flex items-center justify-center px-6"
      >
        <div className="max-w-6xl mx-auto text-center">
          {/* Logo/Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <Sparkles className="w-10 h-10 text-primary" />
              <h1 className="text-6xl font-outfit font-bold text-gradient">
                SuperNetworkAI
              </h1>
            </div>
            <p className="text-2xl text-gray-400 font-outfit">
              Where Human Purpose Meets AI Precision
            </p>
          </motion.div>

          {/* Value Prop */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Stop wasting time on mismatched connections. Our AI-powered platform
            matches you with founders, builders, and clients based on your{" "}
            <span className="text-primary font-semibold">Ikigai</span> — your
            passions, skills, mission, and working style.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mb-20"
          >
            <Button
              data-testid="sign-in-button"
              onClick={handleSignIn}
              size="lg"
              className="rounded-full px-12 py-6 text-lg font-semibold glow-effect hover:glow-effect-hover hover:scale-105 transform transition-all duration-300 bg-primary hover:bg-primary/90"
            >
              Sign in with Google
            </Button>
          </motion.div>

          {/* Feature Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            <div className="glass-effect rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group">
              <Brain className="w-12 h-12 text-primary mb-4 mx-auto group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-outfit font-semibold mb-3">AI-Powered Ikigai</h3>
              <p className="text-gray-400">
                Upload your CV and let AI extract your unique profile — passions,
                skills, mission, and working style.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group">
              <Network className="w-12 h-12 text-secondary mb-4 mx-auto group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-outfit font-semibold mb-3">Intent-Based Matching</h3>
              <p className="text-gray-400">
                Search in natural language. Our two-stage RAG pipeline ranks
                matches based on mission, passion, and skill alignment.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group">
              <Zap className="w-12 h-12 text-yellow-400 mb-4 mx-auto group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-outfit font-semibold mb-3">AI Match Summaries</h3>
              <p className="text-gray-400">
                Get a one-sentence AI explanation for every match, showing you
                exactly why you're a great fit.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="fixed bottom-0 w-full py-6 text-center text-gray-500 text-sm">
        Built for the 24-hour hackathon • SuperNetworkAI
      </div>
    </div>
  );
};

export default Landing;