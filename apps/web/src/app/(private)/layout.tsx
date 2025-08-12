import ResponsiveShell from "../_components/ResponsiveShell";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="theme-dark">
      <ResponsiveShell>
        {children}
      </ResponsiveShell>
    </div>
  );
}


