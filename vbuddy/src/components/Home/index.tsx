"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { TestimonialMarquee } from "./TestimonialMarquee";
import RateGraph from "./rateGraph";
import { trustIndicators, categories, processSteps } from "../../dataUtils/data";
// @ts-expect-error - No type declarations available
import {
  CheckIcon,
  UserGroupIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  TrophyIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const CounterAnimation = ({ value, label }: { value: string; label: string }) => {
  const [count, setCount] = useState(0);
  const finalValue = parseInt(value.replace(/[^\d]/g, ''));
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev: number) => {
        if (prev < finalValue) {
          return Math.min(prev + Math.ceil(finalValue / 50), finalValue);
        }
        return prev;
      });
    }, 50);
    
    return () => clearInterval(timer);
  }, [finalValue]);

  return (
    <motion.div 
      className="text-center"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {value.includes('+') ? `${count}+` : value.includes('/') ? value : count}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </motion.div>
  );
};

export default function Home() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: UserGroupIcon,
      title: "Global Talent Pool",
      description: "Access pre-vetted VAs, developers, designers, and more from around the world.",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: CheckIcon,
      title: "Easy Hiring",
      description: "Post jobs, review applications, and hire the best fit in just a few clicks.",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: ClockIcon,
      title: "Integrated Timesheets",
      description: "Track hours and approve timesheets with seamless integration.",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Secure Collaboration",
      description: "Message, manage, and pay your team securely—all in one place.",
      color: "from-purple-500 to-pink-600"
    }
  ];

  const whyJoinFeatures = [
    {
      icon: TrophyIcon,
      title: "Top 1% Talent",
      description: "Work with the world's best professionals, thoroughly vetted and verified.",
      stats: "99.8% Success Rate"
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with guaranteed payments and data protection.",
      stats: "100% Secure"
    },
    {
      icon: GlobeAltIcon,
      title: "Global Reach",
      description: "Access talent from 50+ countries with 24/7 support coverage.",
      stats: "50+ Countries"
    },
    {
      icon: ChartBarIcon,
      title: "Proven Results",
      description: "Average 40% cost savings with 3x faster hiring than traditional methods.",
      stats: "40% Cost Savings"
    },
    {
      icon: CurrencyDollarIcon,
      title: "Fair Pricing",
      description: "Transparent pricing with no hidden fees. Pay only for what you use.",
      stats: "No Hidden Fees"
    },
    {
      icon: RocketLaunchIcon,
      title: "Fast Deployment",
      description: "Get started in 24 hours with our streamlined onboarding process.",
      stats: "24 Hour Start"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="fixed w-full bg-white/95 backdrop-blur-md border-b border-gray-100 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div 
            className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            VBuddy
          </motion.div>
          <nav>
            <ul className="flex items-center gap-8">
              <li>
                <Link href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#why-join" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  Why Join?
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#testimonials" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  Testimonials
                </Link>
              </li>
              <li className="flex gap-3">
                <Link href="/dashboard/employer/post-job" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105">
                  Post a Job
                </Link>
                <Link href="/dashboard/va/jobs" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
                  Find Jobs
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-10"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 360]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-10"
            animate={{
              y: [0, 20, 0],
              rotate: [360, 0]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-800 text-sm font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StarIcon className="w-4 h-4" />
              Trusted by 2,000+ companies worldwide
            </motion.div>
            
            <motion.h1 
              className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Hire Pre-Vetted{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Virtual Assistants
                </span>
                <motion.div
                  className="absolute -bottom-2 left-0 w-full h-3 bg-gradient-to-r from-indigo-200 to-purple-200 opacity-30"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                />
              </span>
              {" "}& Remote Talent
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Connect with top-tier professionals from around the world. 
              Our all-in-one platform streamlines hiring, collaboration, and payments.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link
                href="/dashboard/employer/post-job"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <RocketLaunchIcon className="w-5 h-5" />
                Post a Job
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard/va/jobs"
                className="group inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                <PlayIcon className="w-5 h-5" />
                Find Jobs
              </Link>
            </motion.div>
            
            <motion.div 
              className="flex gap-8 pt-8"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {trustIndicators.map((item, index) => (
                <CounterAnimation key={index} value={item.value} label={item.label} />
              ))}
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ y: heroY }}
          >
            <div className="relative">
              <RateGraph />
              <motion.div 
                className="absolute -top-5 -right-20 bg-white p-6 rounded-2xl shadow-2xl border border-gray-100"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <div className="text-sm text-gray-600 mb-1">Average Hourly Rate</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  $15-45
                </div>
                <div className="text-sm text-gray-600">Based on expertise</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Join Section */}
      <section id="why-join" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Choose VBuddy?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of companies that trust VBuddy for their remote workforce needs
            </p>
          </motion.div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {whyJoinFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {feature.stats}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools and features designed to streamline your hiring process
            </p>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group p-8 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 cursor-pointer"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onHoverStart={() => setActiveFeature(index)}
              >
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in just 4 simple steps
            </p>
          </motion.div>
          
          <div className="grid lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                className="relative text-center"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <span className="text-2xl font-bold text-white">{index + 1}</span>
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-indigo-200 to-purple-200" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied clients and talented professionals
            </p>
          </motion.div>
          <TestimonialMarquee />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Join thousands of companies that have revolutionized their hiring process with VBuddy
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard/employer/post-job"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg font-semibold"
              >
                <RocketLaunchIcon className="w-5 h-5" />
                Start Hiring Today
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard/va/jobs"
                className="group inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-indigo-600 transition-all font-semibold"
              >
                <LightBulbIcon className="w-5 h-5" />
                Find Opportunities
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
            VBuddy
          </div>
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} VBuddy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
