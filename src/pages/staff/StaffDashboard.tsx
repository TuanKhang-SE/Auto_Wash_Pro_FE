import {
    Bike,
    Clock3,
    CircleCheckBig,
    ClipboardList,

} from "lucide-react";

import StatCard from "../../components/staff/StatCard";

const StaffDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Thống kê */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Vehicles Waiting"
          value={8}
          icon={<Clock3 className="text-yellow-500" />}
        />

        <StatCard
          title="Vehicles Washing"
          value={3}
          icon={<Bike className="text-blue-500" />}
        />

        <StatCard
          title="Vehicles Completed"
          value={21}
          icon={<CircleCheckBig className="text-green-500" />}
        />

        <StatCard
          title="Total Today"
          value={32}
          icon={<ClipboardList className="text-purple-500" />}
        />
      </div>

      {/* Vehicle Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          Vehicles in Progress
        </h2>

        <table className="w-full">
          <thead className="border-b">
            <tr className="text-left text-slate-500">
              <th className="py-3">License Plate</th>
              <th>Service</th>
              <th>Check In</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b">
              <td className="py-4">59A1-123.45</td>
              <td>Premium Wash</td>
              <td>08:30</td>
              <td>
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700">
                  Washing
                </span>
              </td>
            </tr>

            <tr>
              <td className="py-4">59X2-678.90</td>
              <td>Basic Wash</td>
              <td>09:10</td>
              <td>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                  Waiting
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffDashboard;