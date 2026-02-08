import type { Variants, Transition, Easing } from "motion/react";

const ease: Easing = [0.22, 1, 0.36, 1];

// Page enter: fade + subtle y slide
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};
export const pageTransition: Transition = { duration: 0.25, ease };

// Stagger children (stat cards, list items)
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease } },
};

// Expand/collapse (height auto)
export const expandVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
};
export const expandTransition: Transition = { duration: 0.4, ease };

// Tab panel swap
export const tabPanel: Variants = {
  hidden: { opacity: 0, x: 6 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -6 },
};
export const tabTransition: Transition = { duration: 0.15, ease };

// Modal overlay + panel
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};
export const modalTransition: Transition = { duration: 0.25, ease };

// Table rows: opacity stagger
export const tableContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};
export const tableRow: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15, ease } },
};

// Button press
export const buttonTap = { scale: 0.98 };

// Fade in + up (banners, feature cards)
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};
