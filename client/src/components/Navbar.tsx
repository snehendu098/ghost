"use client";

import Image from "next/image";
import { useState } from "react";
import { Settings, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useNavigation } from "./providers/navigation-provider";

const navItems = [
  { label: "Stake", href: "/stake" },
  { label: "Infinity", href: "/infinity" },
  { label: "Explore", href: "/explore" },
];

const moreLinks = [
  { label: "Wonderland", href: "#", external: false },
  { label: "Vote", href: "#", external: true },
  { label: "Research", href: "#", external: true },
  { label: "Blog", href: "#", external: true },
  { label: "Docs", href: "#", external: true },
];

const Navbar = () => {
  const { activePage, setActivePage } = useNavigation();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <header className="w-full">
      <div className="w-full flex items-center justify-between px-10 py-3">
        {/* Left section: Logo + Nav */}
        <div className="flex items-center gap-1">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-4">
            <Image
              src="/ghost-logo.png"
              alt="Ghost"
              width={28}
              height={28}
              className="rounded-full"
            />
            <span className="text-foreground font-semibold text-lg">GhostFi</span>
          </div>

          {/* Nav Items */}
          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => setActivePage(item.label as "Stake" | "Infinity" | "Explore")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  activePage === item.label
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  moreOpen
                    ? "text-emerald-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                More
                {moreOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {moreOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="py-2">
                    {moreLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="flex items-center gap-1.5 px-5 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        {link.label}
                        {link.external && (
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        )}
                      </a>
                    ))}
                  </div>

                  {/* Social icons */}
                  <div className="border-t border-border px-5 py-3 flex items-center gap-4">
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right section: Settings + Connect */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <Settings className="w-5 h-5" />
          </button>

          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer">
            Connect
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
