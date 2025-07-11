import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { testimonials } from "../../dataUtils/data";
// @ts-expect-error - No type declarations available
import { StarIcon } from "@heroicons/react/24/solid";

export const TestimonialMarquee = () => {
  return (
    <section className="py-12 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />

          {/* Testimonials Container */}
          <div className="flex gap-6 overflow-x-hidden">
            {[0, 1].map((containerIndex) => (
              <motion.div
                key={containerIndex}
                className="flex gap-6 animate-marquee"
                initial={{ x: containerIndex === 0 ? "0%" : "-100%" }}
                animate={{ x: containerIndex === 0 ? "-100%" : "-200%" }}
                transition={{
                  repeat: Infinity,
                  duration: 60,
                  ease: "linear",
                }}
              >
                {testimonials?.map((testimonial, index) => (
                  <motion.div
                    key={`${containerIndex}-${index}`}
                    className="flex-shrink-0 w-96 bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                    whileHover={{
                      y: -5,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          width={56}
                          height={56}
                          className="rounded-full ring-2 ring-indigo-100"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <motion.div
                            className="w-3 h-3 bg-white rounded-full"
                            animate={{
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {testimonial.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {testimonial.role}
                        </p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, starIndex) => (
                            <StarIcon
                              key={starIndex}
                              className="w-4 h-4 text-yellow-400"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 text-4xl text-indigo-200 font-serif">
                        "
                      </div>
                      <p className="text-gray-700 leading-relaxed pl-4 relative z-10">
                        {testimonial.text}
                      </p>
                      <div className="absolute -bottom-2 -right-2 text-4xl text-indigo-200 font-serif rotate-180">
                        "
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-gray-500">Verified Review</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {Math.floor(Math.random() * 30) + 1} days ago
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* CTA Section */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-gray-600 mb-6">
            Join thousands of satisfied professionals and companies
          </p>
          <div className="flex justify-center gap-4">
            <motion.button
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Read More Reviews
            </motion.button>
            <motion.button
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Leave a Review
            </motion.button>
          </div>
        </motion.div>

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
            animation: marquee 60s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
      </div>
    </section>
  );
};
