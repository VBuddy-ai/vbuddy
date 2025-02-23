"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import RateGraph from "./rateGraph";

// Types
interface Testimonial {
  name: string;
  role: string;
  text: string;
  image: string;
}

interface TrustIndicator {
  value: string;
  label: string;
}

interface CategoryCard {
  title: string;
  rate: string;
  skills: string[];
}

interface ProcessStep {
  title: string;
  desc: string;
}

// TestimonialMarquee Component
function TestimonialMarquee() {
  const testimonials: Testimonial[] = [
    {
      name: "Cris Anthony Feliciano",
      role: "Graphic Designer / Illustrator / Video Editor",
      text: "Naghanap ako ng mga websites where I can post my voiceover demos and market my VO service for free. And one of those websites nga na-discover ko and nakatulong talaga sa akin ay si VStaff!",
      image: "/api/placeholder/48/48",
    },
    {
      name: "Kathleen Sone",
      role: "Digital creator / Voiceover artist",
      text: "The platform looks great and so easy to navigate. I especially like how it's catered to global talent and how you can promote your profile as a page or website. The payment process and fees are also transparent and convenient.",
      image: "/api/placeholder/48/48",
    },
    {
      name: "Dave Dacanay",
      role: "Customer support / UGC creator",
      text: "One of the reasons I prefer using VStaff is the ease and convenience it offers when posting my business online.",
      image: "/api/placeholder/48/48",
    },
    {
      name: "Mimi Luarca",
      role: "Content Creator / Social Media Marketer",
      text: "First time kong makareceive ng order through my VStaff profile! The process was smooth and professional.",
      image: "/api/placeholder/48/48",
    },
  ];

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-indigo-600 to-blue-400 text-transparent bg-clip-text"
        >
          What the VStaff community is saying
        </motion.h2>

        <div className="relative">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />

          {/* Testimonials Container */}
          <div className="flex gap-6 overflow-x-hidden">
            {[0, 1].map((_, containerIndex) => (
              <motion.div
                key={containerIndex}
                className="flex gap-6 animate-marquee"
                initial={{ x: 0 }}
                animate={{ x: "-100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 30,
                  ease: "linear",
                }}
              >
                {testimonials.map((testimonial, index) => (
                  <div
                    key={`${containerIndex}-${index}`}
                    className="flex-shrink-0 w-96 bg-white rounded-xl p-6 shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {testimonial.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700">{testimonial.text}</p>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-100%);
            }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
        `}</style>
      </div>
    </section>
  );
}

// Main Contact Page Component
export default function Contact() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
  };

  const textVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const staggerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const trustIndicators: TrustIndicator[] = [
    { value: "50+", label: "Countries" },
    { value: "4.9/5", label: "Client Rating" },
    { value: "2,000+", label: "Active Staff" },
  ];

  const categories: CategoryCard[] = [
    {
      title: "Executive VAs",
      rate: "$15-25/hr",
      skills: ["Calendar Management", "Email Handling", "Travel Planning"],
    },
    {
      title: "Development",
      rate: "$25-45/hr",
      skills: ["Full-Stack", "Mobile Apps", "Web Development"],
    },
    {
      title: "Design",
      rate: "$20-40/hr",
      skills: ["UI/UX", "Graphic Design", "Brand Identity"],
    },
    {
      title: "Marketing",
      rate: "$20-35/hr",
      skills: ["Social Media", "SEO", "Content Strategy"],
    },
    {
      title: "Content Creation",
      rate: "$15-30/hr",
      skills: ["Copywriting", "Blog Posts", "Technical Writing"],
    },
    {
      title: "Customer Support",
      rate: "$12-25/hr",
      skills: ["Chat Support", "Email Support", "CRM Management"],
    },
  ];

  const processSteps: ProcessStep[] = [
    {
      title: "Create Profile",
      desc: "Sign up and share your staffing needs",
    },
    {
      title: "Browse Talent",
      desc: "Review pre-vetted professionals globally",
    },
    {
      title: "Interview & Select",
      desc: "Choose the perfect match for your team",
    },
    {
      title: "Start Working",
      desc: "Begin collaboration seamlessly",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Navigation */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600">VStaff</div>
            <nav>
              <ul className="flex items-center gap-8">
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="#staff"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Browse Staff
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Pricing
                  </Link>
                </li>
                <li className="flex gap-3">
                  <button className="px-4 py-2 text-gray-700 hover:text-gray-900">
                    Sign In
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Hire Staff
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              variants={textVariants}
              initial="initial"
              animate="animate"
            >
              <motion.h1
                variants={textVariants}
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
              >
                Find Expert Virtual Staff
                <motion.span
                  variants={textVariants}
                  className="block text-blue-600"
                >
                  From Around the World
                </motion.span>
              </motion.h1>
              <motion.p
                variants={textVariants}
                className="text-xl text-gray-600 mb-8"
              >
                Access a global talent pool of pre-vetted virtual assistants,
                developers, designers, and specialists. Scale your team with top
                professionals worldwide.
              </motion.p>
              <motion.div variants={textVariants} className="flex gap-4">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Browse Virtual Staff
                </button>
                <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Post a Job
                </button>
              </motion.div>
              {/* Trust Indicators */}
              <motion.div
                variants={textVariants}
                className="mt-8 pt-8 border-t border-gray-100"
              >
                <motion.div
                  variants={staggerVariants}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  className="flex items-center gap-8"
                >
                  {trustIndicators.map((item) => (
                    <motion.div
                      key={item.label}
                      variants={{
                        initial: { opacity: 0, y: 20 },
                        animate: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.5 },
                        },
                      }}
                    >
                      <div className="text-2xl font-bold text-gray-900">
                        {item.value}
                      </div>
                      <div className="text-sm text-gray-600">{item.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              <RateGraph />
              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute -top-5 -right-20 bg-white p-6 rounded-lg shadow-xl"
              >
                <div className="text-sm text-gray-600">Average Hourly Rate</div>
                <div className="text-3xl font-bold text-gray-900">$15-45</div>
                <div className="text-sm text-gray-600">Based on expertise</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="staff" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              {...fadeInUp}
              className="text-3xl font-bold text-gray-900"
            >
              Global Talent Pool
            </motion.h2>
            <motion.p {...fadeInUp} className="text-lg text-gray-600 mt-4">
              Find the perfect virtual staff for your business needs
            </motion.p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {categories.map((category, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {category.title}
                </h3>
                <p className="text-blue-600 font-medium mb-4">
                  {category.rate}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, j) => (
                    <span
                      key={j}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <TestimonialMarquee />
      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              {...fadeInUp}
              className="text-3xl font-bold text-gray-900"
            >
              Simple Hiring Process
            </motion.h2>
            <motion.p {...fadeInUp} className="text-lg text-gray-600 mt-4">
              Get started with your virtual staff in 4 easy steps
            </motion.p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {processSteps.map((step, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h2
            {...fadeInUp}
            className="text-3xl font-bold text-white mb-6"
          >
            Ready to Build Your Global Team?
          </motion.h2>
          <motion.p
            {...fadeInUp}
            className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
          >
            Join thousands of businesses scaling with virtual staff worldwide
          </motion.p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white text-blue-600 rounded-lg shadow-lg hover:shadow-xl"
          >
            Start Hiring
          </motion.button>
        </div>
      </section>
    </div>
  );
}
