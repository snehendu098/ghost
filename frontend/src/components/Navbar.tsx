"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, ArrowUpRight, Menu, X, Shield, Landmark, Repeat, BookOpen, Bell, Layers } from "lucide-react";

const products = [
  {
    category: "Individuals",
    items: [
      {
        name: "Ghost App",
        badge: "NEW",
        desc: "Delightful yields on the go.",
        icon: <Shield className="w-6 h-6" />,
        iconBg: "bg-indigo-500/20 text-indigo-400",
      },
      {
        name: "Ghost Web",
        desc: "Best private lending yields on your tokens.",
        icon: <Landmark className="w-6 h-6" />,
        iconBg: "bg-emerald-500/20 text-emerald-400",
      },
    ],
  },
  {
    category: "Institutions, Funds & Projects",
    items: [
      {
        name: "Lending-as-a-Service",
        desc: "White-label lending and custom pools.",
        icon: <Layers className="w-6 h-6" />,
        iconBg: "bg-amber-500/20 text-amber-400",
      },
    ],
  },
  {
    category: "Developers",
    items: [
      {
        name: "Gateway",
        desc: "Optimize and deliver CRE transactions.",
        icon: <Repeat className="w-6 h-6" />,
        iconBg: "bg-sky-500/20 text-sky-400",
      },
      {
        name: "Settlement SDK",
        desc: "The complete Web3 settlement platform.",
        icon: <BookOpen className="w-6 h-6" />,
        iconBg: "bg-violet-500/20 text-violet-400",
      },
    ],
  },
];

const resources = [
  {
    name: "Blog",
    desc: "News and insights from the team.",
    icon: <BookOpen className="w-6 h-6" />,
    iconBg: "bg-white/10 text-gray-300",
  },
  {
    name: "Documentation",
    desc: "Protocol architecture & integration guides.",
    icon: <Layers className="w-6 h-6" />,
    iconBg: "bg-blue-500/20 text-blue-400",
  },
  {
    name: "Developer Alerts",
    desc: "Get notified about latest developer updates.",
    icon: <Bell className="w-6 h-6" />,
    iconBg: "bg-amber-500/20 text-amber-400",
  },
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
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[380px] bg-[#1a1a1a] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/10 py-5 px-2 z-50">
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#101010]/80 backdrop-blur-xl">
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
                  <a key={item.name} href="#" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.iconBg}`}>{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{item.name}</span>
                        {item.badge && <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md">{item.badge}</span>}
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            ))}
          </Dropdown>

          <Dropdown label="Resources" isOpen={openMenu === "resources"} onOpen={() => open("resources")} onClose={close}>
            {resources.map((item) => (
              <a key={item.name} href="#" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.iconBg}`}>{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{item.name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </a>
            ))}
          </Dropdown>

          <Dropdown label="$GHOST" isOpen={openMenu === "ghost"} onOpen={() => open("ghost")} onClose={close}>
            <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <Image src="/logo-new.png" alt="Ghost" width={32} height={32} className="rounded-lg" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">$GHOST Token</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gray-600" />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Community governance token.</p>
              </div>
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Layers className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Governance</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gray-600" />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Vote on protocol proposals.</p>
              </div>
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
          <a href="#" className="block text-sm font-medium py-2 text-gray-400">$GHOST</a>
          <button className="w-full px-5 py-2.5 text-gray-900 text-sm font-semibold rounded-full" style={{ backgroundColor: "#e2a9f1" }}>Launch App</button>
        </div>
      )}
    </nav>
  );
}
