import React from "react";
import { useRouter } from "next/navigation";

interface QuickActionsProps {
  onPostJob: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onPostJob }) => {
  const router = useRouter();

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Quick Actions
        </h3>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={onPostJob}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Post a New Job
          </button>
          <button
            onClick={() => router.push("/dashboard/employer/profile/edit")}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
          >
            Edit Company Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
