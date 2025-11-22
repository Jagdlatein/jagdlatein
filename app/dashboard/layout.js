export const metadata = {
  title: "Dashboard – Jagdlatein",
};

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-wrapper">
      {children}
    </div>
  );
}
