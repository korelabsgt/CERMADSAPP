import LaAradaSidebar from "@/components/(LaArada)/layout/LaAradaSidebar";

export default function LaAradaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-1 min-h-0">
      <LaAradaSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-0">
        {children}
      </div>
    </div>
  );
}
