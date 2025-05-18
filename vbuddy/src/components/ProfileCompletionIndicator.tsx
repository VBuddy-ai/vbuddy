import React from "react";

interface ProfileCompletionIndicatorProps {
  completionPercentage: number;
  userType: "employer" | "va";
}

const ProfileCompletionIndicator: React.FC<ProfileCompletionIndicatorProps> = ({
  completionPercentage,
  userType,
}) => {
  const getCompletionColor = (percentage: number) => {
    if (percentage < 30) return "bg-red-500";
    if (percentage < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getCompletionMessage = (
    percentage: number,
    userType: "employer" | "va"
  ) => {
    if (percentage < 30) {
      return `Complete your ${
        userType === "employer" ? "company" : "VA"
      } profile to get started`;
    }
    if (percentage < 70) {
      return `Your ${
        userType === "employer" ? "company" : "VA"
      } profile is partially complete`;
    }
    return `Your ${
      userType === "employer" ? "company" : "VA"
    } profile is complete`;
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">
          Profile Completion
        </h3>
        <span className="text-sm font-medium text-gray-500">
          {completionPercentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${getCompletionColor(
            completionPercentage
          )}`}
          style={{ width: `${completionPercentage}%` }}
        ></div>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        {getCompletionMessage(completionPercentage, userType)}
      </p>
      {completionPercentage < 100 && (
        <button
          onClick={() =>
            (window.location.href = `/dashboard/${userType}/profile/edit`)
          }
          className="mt-3 text-sm text-indigo-600 hover:text-indigo-900"
        >
          Complete your profile →
        </button>
      )}
    </div>
  );
};

export default ProfileCompletionIndicator;
