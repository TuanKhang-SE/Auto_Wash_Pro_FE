type Props= {
    title: string;
    value: string| number;
    icon?: React.ReactNode;
};

const StatCard = ({ title, value, icon }: Props) => {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-800">
            {value}
          </h2>
        </div>

        <div>{icon}</div>
      </div>
    </div>
  );
};

export default StatCard;