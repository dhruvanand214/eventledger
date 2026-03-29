import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="page-bg min-h-screen">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8 animate-fade-in">
        {children}
      </div>
    </div>
  );
}
