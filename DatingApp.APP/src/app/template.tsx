/** Re-mounts on every navigation → soft fade between pages (opacity only, so fixed children are unaffected). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
