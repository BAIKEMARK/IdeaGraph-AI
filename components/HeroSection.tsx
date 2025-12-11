import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, ArrowRight, Lightbulb, Network, MessageSquare } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
  show: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, show }) => {
  const [isVisible, setIsVisible] = useState(show);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.8]);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  if (!isVisible) return null;

  const features = [
    {
      icon: Lightbulb,
      title: 'Capture Ideas',
      description: 'Transform raw thoughts into structured knowledge graphs',
      delay: 0.2
    },
    {
      icon: Network,
      title: 'Visualize Connections',
      description: 'See how your ideas relate and form patterns',
      delay: 0.4
    },
    {
      icon: MessageSquare,
      title: 'AI-Powered Insights',
      description: 'Chat with AI to explore and refine your concepts',
      delay: 0.6
    }
  ];

  const titleWords = "Welcome to IdeaGraph".split(' ');

  return (
    <motion.div
      style={{ opacity, scale }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 overflow-hidden"
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Animated title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="inline-block mb-4"
          >
            <Sparkles className="w-16 h-16 text-indigo-400" />
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            {titleWords.map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="inline-block mr-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400"
              >
                {word}
              </motion.span>
            ))}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto"
        >
          Transform your thoughts into a living knowledge graph. Capture, connect, and explore ideas with AI-powered insights.
        </motion.p>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: feature.delay, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-indigo-500/50 transition-all"
            >
              <feature.icon className="w-10 h-10 text-indigo-400 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-200 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onGetStarted}
          className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full text-lg font-semibold transition-all shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70"
        >
          <span className="flex items-center gap-2">
            Get Started
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.span>
          </span>
          
          {/* Ripple effect on hover */}
          <motion.span
            className="absolute inset-0 rounded-full bg-white/20"
            initial={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        </motion.button>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-12 text-slate-500 text-sm"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Scroll to explore
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};
