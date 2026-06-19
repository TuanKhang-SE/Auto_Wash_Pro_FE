type Props = {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: "blue" | "rose" | "emerald" | "amber" | "purple";
};

const colorMap = {
  blue: "from-blue-500 to-indigo-600",
  rose: "from-rose-500 to-pink-600",
  emerald: "from-emerald-500 to-green-600",
  amber: "from-amber-500 to-orange-600",
  purple: "from-purple-500 to-violet-600",
};

const StatCard = ({ title, value, icon, trend, color = "blue" }: Props) => {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-800">{value}</h2>
          {trend && (
            <p
              className={`mt-2 text-xs font-medium inline-flex items-center gap-1 ${
                trend.isUp ? "text-emerald-600" : "text-red-600"
              }`}
            >
              <span>{trend.isUp ? "↑" : "↓"}</span>
              {Math.abs(trend.value)}% so với tháng trước
            </p>
          )}
        </div>

        <div
          className={`rounded-lg bg-gradient-to-br ${colorMap[color]} p-3 text-white shadow-lg`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;