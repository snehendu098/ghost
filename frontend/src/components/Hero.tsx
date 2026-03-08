"use client";
import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 0.4;
  }, []);

  return (
    <section className="min-h-[80vh] overflow-hidden relative bg-[#101010]">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-70"
        src="/bgvid.mp4"
      />
      <div className="absolute bottom-0 left-0 right-0 h-[500px] z-[1]" style={{ background: 'linear-gradient(to top, #101010 0%, #101010e6 20%, #10101099 50%, #10101033 75%, transparent 100%)' }} />
      <div className="absolute inset-0 z-[2] flex flex-col justify-center px-8 md:px-20">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="font-[family-name:var(--font-sans)] text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight"
        >
          Private Lending.<br />Fair Rates.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="font-[family-name:var(--font-sans)] mt-5 text-lg md:text-xl text-white/60 max-w-lg"
        >
          Sealed-bid rate discovery on confidential compute.
        </motion.p>
      </div>
    </section>
  );
}
