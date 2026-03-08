"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, ArrowUpRight, Menu, X } from "lucide-react";

const products = [
  {
    category: "Individuals",
    items: [
      { name: "Lend", badge: "NEW", desc: "Deposit at your own sealed rate. Earn discriminatory yield." },
      { name: "Borrow", desc: "Post collateral, set your max rate, get matched to cheapest lenders." },
    ],
  },
  {
    category: "Institutions, Funds & Projects",
    items: [
      { name: "Private Pools", desc: "Institutional-grade private lending pools with custom parameters." },
    ],
  },
  {
    category: "Developers",
    items: [
      { name: "CRE Integration", desc: "Build on Ghost's confidential matching engine." },
      { name: "Documentation", desc: "Protocol architecture, API reference, and integration guides." },
    ],
  },
];

const resources = [
  { name: "Blog", desc: "Protocol updates and research insights." },
  { name: "Documentation", desc: "Protocol architecture & integration guides." },
  { name: "Litepaper", desc: "Read the Ghost protocol litepaper." },
];

function Dropdown({
  label,
  children,
  isOpen,
  onOpen,
  onClose,
}: {
  label: string;
  children: React.ReactNode;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onOpen}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-all ${
          isOpen
            ? "bg-white/10 text-white"
            : "text-gray-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[320px] bg-[#1a1a1a] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/10 py-5 px-2 z-50">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const open = (menu: string) => setOpenMenu(openMenu === menu ? null : menu);
  const close = () => setOpenMenu(null);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/ghost-logo1.png" alt="Ghost" width={90} height={36} className="h-9 w-auto" />
        </div>

        <div className="hidden md:flex items-center gap-0.5">
          <Dropdown label="Products" isOpen={openMenu === "products"} onOpen={() => open("products")} onClose={close}>
            {products.map((group, gi) => (
              <div key={group.category}>
                {gi > 0 && <div className="h-px bg-white/5 mx-3 my-2" />}
                <p className="text-xs font-medium text-gray-500 px-4 mb-1.5 mt-1">{group.category}</p>
                {group.items.map((item) => (
                  <a key={item.name} href="#" className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{item.name}</span>
                        {item.badge && <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md">{item.badge}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 shrink-0 ml-3" />
                  </a>
                ))}
              </div>
            ))}
          </Dropdown>

          <Dropdown label="Resources" isOpen={openMenu === "resources"} onOpen={() => open("resources")} onClose={close}>
            {resources.map((item) => (
              <a key={item.name} href="#" className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-white">{item.name}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 shrink-0 ml-3" />
              </a>
            ))}
          </Dropdown>

          <Dropdown label="Tokens" isOpen={openMenu === "tokens"} onOpen={() => open("tokens")} onClose={close}>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
              <div>
                <span className="text-sm font-semibold text-white">$gUSD</span>
                <p className="text-xs text-gray-500 mt-0.5">Privacy-preserving stablecoin for lending and borrowing.</p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 shrink-0 ml-3" />
            </a>
            <a href="#" className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
              <div>
                <span className="text-sm font-semibold text-white">$gETH</span>
                <p className="text-xs text-gray-500 mt-0.5">Shielded ETH for collateral and private transfers.</p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 shrink-0 ml-3" />
            </a>
          </Dropdown>
        </div>

        <button className="hidden md:block px-5 py-2 text-gray-900 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity" style={{ backgroundColor: "#e2a9f1" }}>
          Launch App
        </button>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-400">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-white/[0.06] p-6 space-y-4">
          <a href="#" className="block text-sm font-medium py-2 text-gray-400">Products</a>
          <a href="#" className="block text-sm font-medium py-2 text-gray-400">Resources</a>
          <a href="#" className="block text-sm font-medium py-2 text-gray-400">Tokens</a>
          <button className="w-full px-5 py-2.5 text-gray-900 text-sm font-semibold rounded-full" style={{ backgroundColor: "#e2a9f1" }}>Launch App</button>
        </div>
      )}
    </nav>
  );
}
