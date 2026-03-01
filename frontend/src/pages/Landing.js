import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Users, Brain, Network, CheckCircle2, MessageSquare, Search, UserPlus, Star, TrendingUp, Shield, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { useState } from "react";

const Landing = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
  const handleSignIn = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Founder, TechStart",
      text: "Found my technical co-founder in just 2 days. The AI matching is incredibly accurate!",
      avatar: "SC"
    },
    {
      name: "Michael Rodriguez",
      role: "Senior Developer",
      text: "The Ikigai profile helped me articulate what I really want. Best networking tool I've used.",
      avatar: "MR"
    },
    {
      name: "Emma Thompson",
      role: "Product Designer",
      text: "Love the AI insights! Each match explanation helps me understand the fit before connecting.",
      avatar: "ET"
    }
  ];

  const faqs = [
    {
      q: "How does AI matching work?",
      a: "We use a two-stage pipeline: first, vector similarity search finds semantically similar profiles, then GPT-4o-mini re-ranks based on mission alignment, skills, and working style compatibility."
    },
    {
      q: "Is my data secure?",
      a: "Yes! We use Google OAuth for authentication (no passwords stored), encrypt all data in transit, and never share your information without consent."
    },
    {
      q: "Can I try it for free?",
      a: "Absolutely! Sign up is free and you get full access to create your profile, search, and connect with others."
    },
    {
      q: "What makes this different from LinkedIn?",
      a: "We focus on deep alignment beyond job titles. Our AI understands your purpose, passions, and mission - matching you with people who share your vision, not just your industry."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Sign Up",
      description: "One-click Google sign-in. No forms, no passwords.",
      icon: <Shield className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600"
    },
    {
      number: "02",
      title: "Define Ikigai",
      description: "Chat with AI to build your purpose-driven profile.",
      icon: <MessageSquare className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600"
    },
    {
      number: "03",
      title: "AI Search",
      description: "Describe who you need in natural language.",
      icon: <Search className="w-6 h-6" />,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      number: "04",
      title: "Get Matches",
      description: "Receive ranked matches with AI explanations.",
      icon: <Sparkles className="w-6 h-6" />,
      color: "from-pink-500 to-pink-600"
    },
    {
      number: "05",
      title: "Connect",
      description: "Message and collaborate with perfect fits.",
      icon: <UserPlus className="w-6 h-6" />,
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] bg-secondary/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-6 py-8"
        >
          <div className="flex items-center justify-between">
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
            <Button
              onClick={handleSignIn}
              variant="ghost"
              className="rounded-full"
            >
              Sign In
            </Button>
          </div>
        </motion.header>

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-secondary"
                  />
                  <span className="text-sm text-muted-foreground">Trusted by 30+ Professionals</span>
                </motion.div>

                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.1]">
                  Network with
                  <span className="block text-gradient-premium mt-2">Purpose & Passion</span>
                </h1>

                <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed">
                  AI-powered matching that goes beyond skills. Connect with founders, builders, and clients who share your <span className="text-foreground font-semibold">mission and values</span>.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-10">
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
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                    className="text-lg px-8 py-7 rounded-2xl"
                  >
                    See How It Works
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                    <span>Free forever</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                    <span>&lt;3s setup</span>
                  </div>
                </div>
              </motion.div>

              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden lg:block"
              >
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: <Users className="w-8 h-8" />, value: "30+", label: "Active Users", color: "from-blue-500 to-blue-600" },
                    { icon: <Clock className="w-8 h-8" />, value: "<3s", label: "Avg Match Time", color: "from-emerald-500 to-emerald-600" },
                    { icon: <TrendingUp className="w-8 h-8" />, value: "95%", label: "Match Accuracy", color: "from-purple-500 to-purple-600" },
                    { icon: <Star className="w-8 h-8" />, value: "4.9/5", label: "User Rating", color: "from-yellow-500 to-yellow-600" }
                  ].map((stat, idx) => (
                    <motion.div
                      key={stat.label}
                      whileHover={{ y: -5, scale: 1.02 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="glass-card rounded-2xl p-6 glass-card-hover"
                    >
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 text-white`}>
                        {stat.icon}
                      </div>
                      <div className="text-3xl font-bold mb-1">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div id="how-it-works" className="container mx-auto px-6 py-20 scroll-mt-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Five simple steps from signup to meaningful connections
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
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
                <div className="glass-card rounded-2xl p-6 h-full glass-card-hover">
                  <div className="text-5xl font-bold text-primary/20 mb-3">{step.number}</div>
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <div className="text-white">{step.icon}</div>
                  </motion.div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Loved by Builders</h2>
            <p className="text-xl text-muted-foreground">See what our community says</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card rounded-3xl p-8 md:p-12 text-center"
              >
                <div className="flex justify-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xl md:text-2xl mb-8 leading-relaxed">
                  "{testimonials[activeTestimonial].text}"
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                    {testimonials[activeTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-bold">{testimonials[activeTestimonial].name}</div>
                    <div className="text-sm text-muted-foreground">{testimonials[activeTestimonial].role}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === activeTestimonial ? 'bg-primary w-8' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6 glass-card-hover group"
              >
                <summary className="font-bold cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Find Your Perfect Match?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join SuperNetworkAI today. Free forever, no credit card required.
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

        {/* Footer */}
        <footer className="container mx-auto px-6 py-8 border-t border-border">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 SuperNetworkAI. Built with ❤️ for meaningful connections.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

const ChevronDown = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default Landing;