import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./LeadStatusChart.css";
const COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#10b981",
  "#ef4444",
];

function LeadStatusChart({ stats }) {
  const data = [
    { name: "New", value: stats.byStatus.New || 0 },
    { name: "Contacted", value: stats.byStatus.Contacted || 0 },
    { name: "Qualified", value: stats.byStatus.Qualified || 0 },
    { name: "Won", value: stats.byStatus.Won || 0 },
    { name: "Lost", value: stats.byStatus.Lost || 0 },
  ];

  return (
    <div className="dashboard-panel">
      <h2 className="text-xl font-semibold mb-4">
        Lead Status Distribution
      </h2>

      <div style={{ width: "100%", height: "400px" }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              outerRadius={130}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default LeadStatusChart;