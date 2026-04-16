import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DecorativeBlobs from "@/components/portal/DecorativeBlobs";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <DecorativeBlobs />
      <main className="flex-grow auth-gradient flex items-center justify-center px-6 py-24">
        {children}
      </main>
      <Footer />
    </>
  );
}
