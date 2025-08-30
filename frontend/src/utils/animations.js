// Framer Motion Animation Configurations for NeuroBase Glassmorphism UI

export const springTransition = {
  type: "spring",
  stiffness: 200,
  damping: 28
};

export const easeTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.3
};

// Page and container animations
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1
    }
  }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springTransition
  }
};

// Hover animations
export const hoverScale = {
  scale: 1.02,
  y: -2,
  transition: { duration: 0.2 }
};

export const hoverGlow = {
  scale: 1.05,
  y: -6,
  transition: springTransition
};

// Cube animations
export const cubeHover = {
  rotateY: 6,
  rotateX: -2,
  scale: 1.04,
  transition: springTransition
};

export const cubePress = {
  scale: 0.98,
  transition: { duration: 0.1 }
};

// Counter animations
export const counterSpring = {
  stiffness: 100,
  damping: 30,
  restDelta: 0.001
};

// Glass panel animations
export const panelSlide = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: springTransition
};

// Sidebar animations
export const sidebarItemHover = {
  x: 2,
  transition: { duration: 0.2 }
};

// Notification animations
export const notificationSlide = {
  initial: { opacity: 0, x: 100, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 100, scale: 0.95 },
  transition: { duration: 0.3, ease: "easeOut" }
};

// Reduced motion variants
export const reducedMotionVariants = {
  containerVariants: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 }
    }
  },
  itemVariants: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  },
  hoverScale: {
    transition: { duration: 0.1 }
  }
};

// Utility function to get appropriate variants based on motion preference
export const getMotionVariants = (reducedMotion = false) => {
  return reducedMotion ? reducedMotionVariants : {
    containerVariants,
    itemVariants,
    hoverScale,
    hoverGlow
  };
};
