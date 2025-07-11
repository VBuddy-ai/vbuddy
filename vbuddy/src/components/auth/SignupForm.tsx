"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
// @ts-expect-error - No type declarations available
import {
  UserIcon,
  BuildingOfficeIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon,
  StarIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  TrophyIcon,
  RocketLaunchIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: "employer" | "va" | "";
  company?: string;
  skills?: string[];
  experience?: "beginner" | "intermediate" | "expert";
  timezone?: string;
  bio?: string;
}

const roleOptions = [
  {
    value: "employer",
    title: "I'm hiring talent",
    description: "Find and hire skilled virtual assistants and remote professionals",
    icon: BriefcaseIcon,
    color: "from-blue-500 to-purple-600",
    features: ["Access global talent pool", "Integrated hiring tools", "Secure payment system", "24/7 support"]
  },
  {
    value: "va",
    title: "I'm looking for work",
    description: "Showcase your skills and find amazing remote opportunities",
    icon: RocketLaunchIcon,
    color: "from-green-500 to-teal-600",
    features: ["Showcase your portfolio", "Connect with employers", "Flexible work options", "Fair compensation"]
  }
];

const skillOptions = [
  "Virtual Assistant", "Customer Support", "Data Entry", "Social Media Management",
  "Content Writing", "Graphic Design", "Web Development", "Digital Marketing",
  "Project Management", "Administrative Support", "Translation", "Video Editing"
];

const progressSteps = [
  { id: "role", title: "Choose Your Path", description: "Select your role to get started" },
  { id: "account", title: "Create Account", description: "Set up your login credentials" },
  { id: "profile", title: "Build Profile", description: "Tell us about yourself" },
  { id: "welcome", title: "Welcome!", description: "You're ready to get started" }
];

export default function SignupForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "",
    company: "",
    skills: [],
    experience: "beginner",
    timezone: "",
    bio: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const router = useRouter();

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (step === 0) {
      if (!formData.role) newErrors.role = "Please select your role";
    } else if (step === 1) {
      if (!formData.email) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address";
      if (!formData.password) newErrors.password = "Password is required";
      else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    } else if (step === 2) {
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
      if (formData.role === "employer" && !formData.company) newErrors.company = "Company name is required";
      if (formData.role === "va" && (!formData.skills || formData.skills.length === 0)) newErrors.skills = "Please select at least one skill";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev: number) => Math.min(prev + 1, progressSteps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev: number) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role,
            company: formData.company,
            skills: formData.skills,
            experience: formData.experience,
            timezone: formData.timezone,
            bio: formData.bio
          }
        }
      });

      if (error) {
        toast.error(error.message);
      } else {
        setCurrentStep(3); // Welcome step
        toast.success("Account created successfully! Please check your email for verification.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        {progressSteps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                index <= currentStep 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-400'
              }`}
              initial={false}
              animate={{
                backgroundColor: index <= currentStep ? '#4F46E5' : '#E5E7EB',
                color: index <= currentStep ? '#FFFFFF' : '#9CA3AF'
              }}
              transition={{ duration: 0.3 }}
            >
              {index < currentStep ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </motion.div>
            {index < progressSteps.length - 1 && (
              <div className="w-24 h-0.5 bg-gray-200 mx-2 relative">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-indigo-600"
                  initial={{ width: 0 }}
                  animate={{ width: index < currentStep ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {progressSteps[currentStep].title}
        </h3>
        <p className="text-sm text-gray-600">
          {progressSteps[currentStep].description}
        </p>
      </div>
    </div>
  );

  const RoleSelectionStep = () => (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Journey</h2>
        <p className="text-gray-600">Select the option that best describes you</p>
      </div>
      
      <div className="grid gap-4">
        {roleOptions.map((option) => (
          <motion.div
            key={option.value}
            className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
              formData.role === option.value
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setFormData(prev => ({...prev, role: option.value as "employer" | "va"}))}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center`}>
                <option.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{option.title}</h3>
                <p className="text-gray-600 mb-4">{option.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  {option.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckIcon className="w-4 h-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {formData.role === option.value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
              >
                <CheckIcon className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      
      {errors.role && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-sm mt-2"
        >
          {errors.role}
        </motion.p>
      )}
    </motion.div>
  );

  const AccountStep = () => (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
        <p className="text-gray-600">Set up your login credentials</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-12"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-12"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>
      </div>
    </motion.div>
  );

  const ProfileStep = () => (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Build Your Profile</h2>
        <p className="text-gray-600">Tell us about yourself to get better matches</p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({...prev, firstName: e.target.value}))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="First name"
            />
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({...prev, lastName: e.target.value}))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Last name"
            />
            {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
          </div>
        </div>
        
        {formData.role === "employer" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({...prev, company: e.target.value}))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Your company name"
            />
            {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
          </div>
        )}
        
        {formData.role === "va" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills & Expertise
              </label>
              <div className="grid grid-cols-3 gap-2">
                {skillOptions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      const currentSkills = formData.skills || [];
                      if (currentSkills.includes(skill)) {
                        setFormData(prev => ({
                          ...prev,
                          skills: currentSkills.filter(s => s !== skill)
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          skills: [...currentSkills, skill]
                        }));
                      }
                    }}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      formData.skills?.includes(skill)
                        ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {errors.skills && <p className="text-red-500 text-sm mt-1">{errors.skills}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({...prev, experience: e.target.value as "beginner" | "intermediate" | "expert"}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="beginner">Beginner (0-2 years)</option>
                <option value="intermediate">Intermediate (2-5 years)</option>
                <option value="expert">Expert (5+ years)</option>
              </select>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );

  const WelcomeStep = () => (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="text-center space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
        className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center"
      >
        <HeartIcon className="w-10 h-10 text-white" />
      </motion.div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to VBuddy!</h2>
        <p className="text-gray-600 mb-8">
          Your account has been created successfully. You're ready to {formData.role === "employer" ? "start hiring" : "find opportunities"}!
        </p>
      </div>
      
      <div className="space-y-4">
        <motion.button
          onClick={() => router.push(formData.role === "employer" ? "/dashboard/employer" : "/dashboard/va")}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Go to Dashboard
        </motion.button>
        
        <button
          onClick={() => router.push("/")}
          className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <ProgressBar />
        
        <AnimatePresence mode="wait">
          {currentStep === 0 && <RoleSelectionStep />}
          {currentStep === 1 && <AccountStep />}
          {currentStep === 2 && <ProfileStep />}
          {currentStep === 3 && <WelcomeStep />}
        </AnimatePresence>
        
        {currentStep < 3 && (
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Back
            </button>
            
            <div className="flex gap-2">
              {currentStep === 2 ? (
                <motion.button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <RocketLaunchIcon className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              ) : (
                <motion.button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue
                  <ChevronRightIcon className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
