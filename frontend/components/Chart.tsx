"use client";

import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale } from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

export default function Chart() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm mb-10">
      <h2 className="text-xl font-semibold mb-4">Consolidated Budget</h2>

      <Line
        data={{
          labels: ["Jan", "Feb", "Mar", "Apr", "May"],
          datasets: [
            {
              label: "Revenue",
              data: [10, 40, 35, 50, 60],
              borderColor: "blue",
              tension: 0.4,
            },
            {
              label: "Expenditure",
              data: [20, 30, 25, 40, 45],
              borderColor: "red",
              tension: 0.4,
            },
          ],
        }}
      />
    </div>
  );
}
