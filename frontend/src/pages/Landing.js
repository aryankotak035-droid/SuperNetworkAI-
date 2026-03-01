import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Users, Brain, Network, CheckCircle2, MessageSquare, Search, UserPlus } from "lucide-react";
import { Button } from "../components/ui/button";
import { useState } from "react";

const Landing = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  
  const handleSignIn = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const steps = [
    {
      number: "01",
      title: "Sign In & Build Your Ikigai",
      description: "Connect with Google and chat with our AI to define your passions, skills, mission, and working style.",
      icon: <MessageSquare className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600"
    },
    {
      number: "02",
      title: "Search with Natural Language",
      description: "Describe exactly who you're looking for. Our AI understands intent, not just keywords.",
      icon: <Search className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600"
    },
    {
      number: "03",
      title: "Get AI-Ranked Matches",
      description: "Receive top matches with AI-generated explanations showing why each person is a great fit.",
      icon: <Sparkles className="w-6 h-6" />,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      number: "04",
      title: "Connect & Collaborate",
      description: "Send connection requests and start building meaningful professional relationships.",
      icon: <UserPlus className="w-6 h-6" />,
      color: "from-pink-500 to-pink-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] bg-secondary/20 rounded-full blur-3xl"
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
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-2xl font-bold tracking-tight">SuperNetworkAI</span>
          </div>
        </motion.header>

        {/* Hero */}
        <div className="container mx-auto px-6 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Content */}
              <motion.div
                style={{ opacity, scale }}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-secondary"
                  />
                  <span className="text-sm text-muted-foreground">AI-Powered Networking Platform</span>
                </motion.div>

                <h1 className="text-6xl lg:text-7xl font-bold mb-8 leading-[1.1]">
                  Find Connections
                  <span className="block text-gradient-premium mt-2">Beyond Skills</span>
                </h1>

                <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-xl">
                  Match with founders, builders, and clients based on{" "}
                  <span className="text-foreground font-semibold">shared passion, aligned missions,</span> and{" "}
                  <span className="text-foreground font-semibold">working synergy</span> — powered by advanced AI.
                </p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    data-testid="sign-in-button"
                    onClick={handleSignIn}
                    size="lg"
                    className="group btn-primary text-lg px-8 py-7 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30"
                  >
                    <span className="flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </motion.div>

                {/* Stats */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-8 mt-12"
                >
                  <div>
                    <div className="text-3xl font-bold mb-1">30+</div>
                    <div className="text-sm text-muted-foreground">Active Profiles</div>
                  </div>
                  <div className="w-px h-12 bg-border" />
                  <div>
                    <div className="text-3xl font-bold mb-1">&lt;3s</div>
                    <div className="text-sm text-muted-foreground">Match Time</div>
                  </div>
                  <div className="w-px h-12 bg-border" />
                  <div>
                    <div className="text-3xl font-bold mb-1">AI</div>
                    <div className="text-sm text-muted-foreground">Powered</div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right: Feature Cards */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden lg:block"
              >
                <div className="relative">
                  <motion.div
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="glass-card rounded-3xl p-8 mb-6 glass-card-hover shadow-xl"
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg"
                      >
                        <Brain className="w-7 h-7 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">AI Ikigai Extraction</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          Upload your CV and watch AI extract your unique purpose, skills, mission, and working style in seconds.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Powered by GPT-4o-mini</span>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-6">
                    <motion.div
                      whileHover={{ y: -5, scale: 1.05 }}
                      className="glass-card rounded-2xl p-6 glass-card-hover shadow-lg"
                    >
                      <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-emerald-600 flex items-center justify-center mb-4 shadow-lg"
                      >
                        <Network className="w-6 h-6 text-white" />
                      </motion.div>
                      <h3 className="text-lg font-bold mb-2">Smart Matching</h3>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        Two-stage AI pipeline ranks matches by mission alignment
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -5, scale: 1.05 }}
                      className="glass-card rounded-2xl p-6 glass-card-hover shadow-lg"
                    >
                      <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg"
                      >
                        <Sparkles className="w-6 h-6 text-white" />
                      </motion.div>
                      <h3 className="text-lg font-bold mb-2">AI Insights</h3>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        Get AI-generated explanations for every match
                      </p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to find your perfect professional match
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="relative"
              >
                <div className="glass-card rounded-3xl p-8 h-full glass-card-hover">
                  {/* Number Badge */}
                  <div className="text-6xl font-bold text-primary/20 mb-4">{step.number}</div>
                  
                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <div className="text-white">{step.icon}</div>
                  </motion.div>
                  
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto"
          >
            {[
              {
                icon: <Sparkles className="w-7 h-7 text-blue-400" />,
                title: "Ikigai Profiles",
                description: "Go beyond resumes. Our AI extracts your purpose, passion, and mission to create a holistic professional identity.",
                badge: "Purpose-driven matching",
                color: "from-blue-500/20 to-blue-600/20 border-blue-500/30"
              },
              {
                icon: <Zap className="w-7 h-7 text-emerald-400" />,
                title: "Intent Search",
                description: "Natural language queries with two-stage AI ranking. Find co-founders, teammates, or clients who truly align.",
                badge: "Semantic understanding",
                color: "from-emerald-500/20 to-emerald-600/20 border-emerald-500/30"
              },
              {
                icon: <Users className="w-7 h-7 text-purple-400" />,
                title: "Smart Connect",
                description: "Every match comes with an AI-generated explanation showing exactly why you're compatible.",
                badge: "Transparent AI reasoning",
                color: "from-purple-500/20 to-purple-600/20 border-purple-500/30"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="glass-card rounded-3xl p-8 glass-card-hover"
              >
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} border flex items-center justify-center mb-6`}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{feature.description}</p>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{feature.badge}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-card rounded-3xl p-12 text-center max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Find Your Perfect Match?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join SuperNetworkAI today and start connecting with people who share your vision.
            </p>
            <Button
              onClick={handleSignIn}
              size="lg"
              className="btn-primary text-lg px-10 py-7 shadow-xl shadow-primary/20"
            >
              <span className="flex items-center gap-2">
                Start for Free
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Landing;