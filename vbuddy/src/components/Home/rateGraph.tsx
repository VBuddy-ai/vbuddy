import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { primaryColor } from "@/constants/colorConstants";
import { RateData } from "@/dataUtils/viewTypes";
import { rateData } from "../../dataUtils/data";

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-100">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-lime-600">Entry Level: ${payload[0].value}/hr</p>
        <p className="text-lime-700">Mid Level: ${payload[1].value}/hr</p>
        <p className="text-lime-800">Expert Level: ${payload[2].value}/hr</p>
      </div>
    );
  }
  return null;
};

export default function RateGraph() {
  const [data, setData] = useState<RateData[]>([]);

  useEffect(() => {
    setData([]);
    const timer = setTimeout(() => {
      setData(rateData);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Global Hourly Rates by Expertise
          </h3>
          <p className="text-gray-600">
            Average rates based on experience level and role
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="role"
                tick={{ fill: "#4B5563" }}
                axisLine={{ stroke: "#9CA3AF" }}
              />
              <YAxis
                tick={{ fill: "#4B5563" }}
                axisLine={{ stroke: "#9CA3AF" }}
                label={{
                  value: "Hourly Rate ($)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#4B5563",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="entry"
                fill={primaryColor.primary3}
                radius={[4, 4, 0, 0]}
                name="Entry Level"
              >
                <LabelList dataKey="entry" position="top" fill="#4B5563" />
              </Bar>
              <Bar
                dataKey="mid"
                fill={primaryColor.primary2}
                radius={[4, 4, 0, 0]}
                name="Mid Level"
              >
                <LabelList dataKey="mid" position="top" fill="#4B5563" />
              </Bar>
              <Bar
                dataKey="expert"
                fill={primaryColor.primary1}
                radius={[4, 4, 0, 0]}
                name="Expert Level"
              >
                <LabelList dataKey="expert" position="top" fill="#4B5563" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "Entry Level", color: primaryColor.primary3 },
            { label: "Mid Level", color: primaryColor.primary2 },
            { label: "Expert Level", color: primaryColor.primary1 },
          ].map((level, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: level.color }}
              />
              <span className="text-sm text-gray-600">{level.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
