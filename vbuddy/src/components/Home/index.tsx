"use client";

import React from "react";
import Link from "next/link";
import { TestimonialMarquee } from "./TestimonialMarquee";
import RateGraph from "./rateGraph";
import { trustIndicators } from "../../dataUtils/data";
// @ts-expect-error - No type declarations available
import {
  CheckIcon,
  UserGroupIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="fixed w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-800">VBuddy</div>
          <nav>
            <ul className="flex items-center gap-8">
              <li>
                <Link
                  href="#features"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Features
                </Link>
              </li>
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
                  href="#testimonials"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Testimonials
                </Link>
              </li>
              <li className="flex gap-3">
                <Link
                  href="/dashboard/employer/post-job"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Post a Job
                </Link>
                <Link
                  href="/dashboard/va/jobs"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Find Jobs
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Hire Pre-Vetted Virtual Assistants & Remote Talent
              <span className="block text-indigo-600">All-in-One Platform</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Post jobs, review applications, manage timesheets, and collaborate
              securely. VBuddy connects you with top VAs and remote
              professionals worldwide.
            </p>
            <div className="flex gap-4 mb-6">
              <Link
                href="/dashboard/employer/post-job"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Post a Job
              </Link>
              <Link
                href="/dashboard/va/jobs"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Find Jobs
              </Link>
            </div>
            <div className="flex gap-8 mt-8">
              {trustIndicators.map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {item.value}
                  </div>
                  <div className="text-sm text-gray-600">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <RateGraph />
            <div className="absolute -top-5 -right-20 bg-white p-6 rounded-lg shadow-xl">
              <div className="text-sm text-gray-600">Average Hourly Rate</div>
              <div className="text-3xl font-bold text-gray-900">$15-45</div>
              <div className="text-sm text-gray-600">Based on expertise</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            Why VBuddy?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center">
              <UserGroupIcon className="h-10 w-10 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Global Talent Pool</h3>
              <p className="text-gray-600">
                Access pre-vetted VAs, developers, designers, and more from
                around the world.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center">
              <CheckIcon className="h-10 w-10 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Easy Hiring</h3>
              <p className="text-gray-600">
                Post jobs, review applications, and hire the best fit in just a
                few clicks.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center">
              <ClockIcon className="h-10 w-10 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">
                Integrated Timesheets
              </h3>
              <p className="text-gray-600">
                Track hours and approve timesheets with seamless Clockify
                integration.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center">
              <ChatBubbleLeftRightIcon className="h-10 w-10 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">
                Secure Collaboration
              </h3>
              <p className="text-gray-600">
                Message, manage, and pay your team securely—all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 rounded-full p-4 mb-4">
                <CheckIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Post a Job</h3>
              <p className="text-gray-600">
                Describe your needs and publish your job to our global network.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 rounded-full p-4 mb-4">
                <UserGroupIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">2. Review & Hire</h3>
              <p className="text-gray-600">
                Browse applicants, interview, and hire the best fit for your
                team.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 rounded-full p-4 mb-4">
                <ClockIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                3. Manage & Approve
              </h3>
              <p className="text-gray-600">
                Track work, approve timesheets, and collaborate—all in one
                place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            What Our Clients Say
          </h2>
          <TestimonialMarquee />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-gray-200 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} VBuddy. All rights reserved.
      </footer>
    </div>
  );
}
