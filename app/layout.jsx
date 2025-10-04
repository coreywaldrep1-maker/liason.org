// app/layout.jsx
export const metadata = {
  title: { default: "Liason", template: "%s | Liason" },
  icons: {
    icon: "/icon.svg", // uses app/icon.svg
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
