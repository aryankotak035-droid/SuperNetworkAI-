import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Users } from "lucide-react";
import { Button } from "../components/ui/button";

const Landing = () => {
  const handleSignIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#09090B] relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-60 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-6 py-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-outfit font-bold text-white">SuperNetworkAI</span>
            </div>
          </div>
        </motion.header>

        {/* Hero */}
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-6xl md:text-7xl font-outfit font-bold text-white mb-6 leading-tight">
                Find Your Perfect
                <span className="block bg-gradient-to-r from-primary via-blue-400 to-secondary bg-clip-text text-transparent">
                  Match, Not Just Skills
                </span>
              </h1>
              <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                AI-powered networking that matches you based on <span className="text-white font-semibold">passion, mission, and purpose</span> — not just keywords.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
            >
              <Button
                data-testid="sign-in-button"
                onClick={handleSignIn}
                size="lg"
                className="group relative overflow-hidden rounded-full px-10 py-7 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-20"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">30+</div>
                <div className="text-sm text-gray-400">Active Profiles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">AI</div>
                <div className="text-sm text-gray-400">Powered Matching</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">&lt;3s</div>
                <div className="text-sm text-gray-400">Match Results</div>
              </div>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              <div className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-outfit font-bold text-white mb-3">AI Ikigai Extraction</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Upload your CV, we extract your passions, skills, mission, and working style automatically.
                  </p>
                </div>
              </div>

              <div className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-secondary/50 transition-all duration-300 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="w-7 h-7 text-secondary" />
                  </div>
                  <h3 className="text-xl font-outfit font-bold text-white mb-3">Intent-Based Search</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Natural language queries with two-stage AI ranking. Get matches based on mission alignment.
                  </p>
                </div>
              </div>

              <div className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-blue-400/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-outfit font-bold text-white mb-3">Smart Connections</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Every match comes with an AI explanation showing why you're a perfect fit.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;