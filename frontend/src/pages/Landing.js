import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Users, Brain, Network, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";

const Landing = () => {
  const handleSignIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] relative overflow-hidden noise-bg">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-6 py-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center glow-primary">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">SuperNetworkAI</span>
          </div>
        </motion.header>

        {/* Hero */}
        <div className="container mx-auto px-6 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-gray-300">AI-Powered Networking Platform</span>
                </motion.div>

                <h1 className="text-6xl lg:text-7xl font-bold text-white mb-8 leading-[1.1]">
                  Find Connections
                  <span className="block text-gradient-premium mt-2">Beyond Skills</span>
                </h1>

                <p className="text-xl text-gray-400 mb-12 leading-relaxed max-w-xl">
                  Match with founders, builders, and clients based on{" "}
                  <span className="text-white font-semibold">shared passion, aligned missions,</span> and{" "}
                  <span className="text-white font-semibold">working synergy</span> — powered by advanced AI.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Button
                    data-testid="sign-in-button"
                    onClick={handleSignIn}
                    size="lg"
                    className="group btn-premium text-white font-semibold px-8 py-7 text-lg rounded-2xl"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 smooth-transition" />
                    </span>
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-8">
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">30+</div>
                    <div className="text-sm text-gray-500">Active Profiles</div>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">&lt;3s</div>
                    <div className="text-sm text-gray-500">Match Time</div>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">AI</div>
                    <div className="text-sm text-gray-500">Powered</div>
                  </div>
                </div>
              </motion.div>

              {/* Right: Feature Cards */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden lg:block"
              >
                <div className="relative">
                  {/* Large feature card */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card glass-card-hover rounded-3xl p-8 mb-6 glow-primary smooth-transition"
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Brain className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">AI Ikigai Extraction</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          Upload your CV and watch AI extract your unique purpose, skills, mission, and working style in seconds.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Powered by GPT-4o-mini</span>
                    </div>
                  </motion.div>

                  {/* Two smaller cards */}
                  <div className="grid grid-cols-2 gap-6">
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="glass-card glass-card-hover rounded-2xl p-6 smooth-transition"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4">
                        <Network className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Smart Matching</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Two-stage AI pipeline ranks matches by mission alignment
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -5 }}
                      className="glass-card glass-card-hover rounded-2xl p-6 smooth-transition"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">AI Insights</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Get AI-generated explanations for every match
                      </p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Features Grid - Below Hero */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-32 grid md:grid-cols-3 gap-8"
            >
              <div className="glass-card rounded-3xl p-8 glass-card-hover smooth-transition">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Ikigai Profiles</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Go beyond resumes. Our AI extracts your purpose, passion, and mission to create a holistic professional identity.
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Purpose-driven matching</span>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-8 glass-card-hover smooth-transition">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Intent Search</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Natural language queries with two-stage AI ranking. Find co-founders, teammates, or clients who truly align.
                </p>
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Semantic understanding</span>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-8 glass-card-hover smooth-transition">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Smart Connect</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Every match comes with an AI-generated explanation showing exactly why you're compatible.
                </p>
                <div className="flex items-center gap-2 text-sm text-purple-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Transparent AI reasoning</span>
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
