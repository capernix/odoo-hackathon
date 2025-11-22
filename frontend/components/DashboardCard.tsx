export default function DashboardCard({ title, value }: any) {
  return (
    <div className="bg-white shadow-sm p-6 rounded-xl">
      <p className="text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  );
}
