"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Dungeon", href: "/infinity" },
  { label: "Profile", href: "/profile" }
];

const moreLinks = [
  { label: "Dark Dimension", href: "#", external: false },
  { label: "Research", href: "#", external: true },
  { label: "Blog", href: "#", external: true },
  { label: "Docs", href: "#", external: true },
];

// Hardcoded notifications — replace with real data later
const HARDCODED_NOTIFICATIONS = [
  {
    id: "1",
    type: "settle" as const,
    title: "Borrow Settled",
    message: "Your 800 gUSD borrow has been matched at 5.08% blended rate",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    type: "settle" as const,
    title: "Lend Matched",
    message: "Your 500 gUSD lend intent was matched with a borrower",
    time: "5 min ago",
    read: false,
  },
  {
    id: "3",
    type: "pool" as const,
    title: "New Pool Added",
    message: "gETH/gUSD lending pool is now live with 3 active lenders",
    time: "12 min ago",
    read: false,
  },
  {
    id: "4",
    type: "settle" as const,
    title: "Loan Repaid",
    message: "Borrower repaid 600 gUSD — your payout of 525 gUSD is ready",
    time: "1 hr ago",
    read: false,
  },
  {
    id: "5",
    type: "pool" as const,
    title: "Pool Update",
    message: "gUSD pool liquidity increased by 2,000 gUSD",
    time: "3 hr ago",
    read: true,
  },
  {
    id: "6",
    type: "settle" as const,
    title: "Collateral Released",
    message: "5 gETH collateral returned after full loan repayment",
    time: "3 hr ago",
    read: true,
  },
  {
    id: "7",
    type: "settle" as const,
    title: "Proposal Auto-Accepted",
    message: "Your 200 gUSD borrow proposal was auto-accepted after timeout",
    time: "5 hr ago",
    read: true,
  },
];

const Navbar = () => {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(HARDCODED_NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);
  const { login, logout, authenticated, user } = usePrivy();

  const walletAddress = user?.wallet?.address;
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close notification panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="w-full">
      <div className="w-full flex items-center justify-between px-10 py-3">
        {/* Left section: Logo + Nav */}
        <div className="flex items-center gap-1">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-4">
            <Image
              src="/ghost-logo1.png"
              alt="Ghost"
              width={70}
              height={28}

            />
          </div>

          {/* Nav Items */}
          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
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

        {/* Right section: Notifications + Connect */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute top-full right-0 mt-2 w-96 max-h-[480px] overflow-y-auto scrollbar-none bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <div className="divide-y divide-border">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-5 py-3.5 flex gap-3 transition-colors hover:bg-muted/30"
                    >
                      {/* Icon */}
                      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted/50 text-muted-foreground">
                        <Bell className="w-4 h-4" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{n.title}</span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[11px] text-muted-foreground/60 mt-1 block">
                          {n.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {authenticated ? (
            <button
              onClick={logout}
              className="text-gray-900 px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer"
              style={{ backgroundColor: "#e2a9f1" }}
            >
              {walletAddress
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : "Disconnect"}
            </button>
          ) : (
            <button
              onClick={login}
              className="text-gray-900 px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer"
              style={{ backgroundColor: "#e2a9f1" }}
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
