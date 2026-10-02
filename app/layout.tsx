import "./globals.css";
export const metadata = {
  title: "Resolve | Refund support",
  description: "Help with returns and refunds—chat or voice, with clear policy every step.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
