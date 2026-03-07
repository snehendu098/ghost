import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Announcement from "@/components/Announcement";
import Features from "@/components/Features";
import Partners from "@/components/Partners";
import TokenBanner from "@/components/TokenBanner";
import FollowAlong from "@/components/FollowAlong";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Announcement />
      <Features />
      <Partners />
      <TokenBanner />
      <FollowAlong />
      <CtaBanner />
      <Footer />
    </main>
  );
}
