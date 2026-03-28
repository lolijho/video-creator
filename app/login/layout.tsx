export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page renders without Sidebar and Header
  return <>{children}</>;
}
