# NeuroBase Glassmorphism UI Implementation Guide

## Overview
This guide documents the implementation of the futuristic pastel glassmorphism dashboard UI for NeuroBase, providing comprehensive usage instructions and examples for all new components.

## Architecture

### Component Structure
```
src/
├── components/
│   └── ui/
│       ├── CubeCard.jsx       # 3D animated cube cards
│       ├── StatCounter.jsx    # Animated statistics counters
│       ├── GlassPanel.jsx     # Generic glass container
│       ├── HeaderBar.jsx      # Glass navigation header
│       ├── SidebarNav.jsx     # Collapsible sidebar
│       └── DashboardPage.jsx  # Complete dashboard layout
├── utils/
│   └── animations.js          # Framer Motion configurations
└── styles/
    └── glassmorphism.css      # Custom CSS utilities
```

### Design System

#### Color Palette
- **Background**: Deep purple radial gradient (`#5B2B82` to `#2A1B47`)
- **Glass**: White with 10% opacity + backdrop blur
- **Gradients**: Multi-tone pastels (peach → pink → purple → blue)
- **Accents**: Soft colored glows and subtle borders

#### Typography
- **Headers**: 56-72px bold sans-serif
- **Body**: 14-16px medium weight
- **Labels**: 12px uppercase tracking

## Component Usage

### CubeCard
3D animated cube with statistics and hover effects.

```jsx
import CubeCard from './components/ui/CubeCard';

<CubeCard
  title="Active Databases"
  value={12}
  subtitle="Connected"
  gradient="from-pink-400 via-purple-400 to-blue-400"
  size="large" // or "medium"
  onClick={() => console.log('Cube clicked')}
/>
```

**Props:**
- `title` (string): Card title
- `value` (number): Animated counter value
- `subtitle` (string): Secondary text
- `gradient` (string): Tailwind gradient classes
- `size` ("large" | "medium"): Card size variant
- `onClick` (function): Click handler

### StatCounter
Animated statistics with trend indicators.

```jsx
import StatCounter from './components/ui/StatCounter';

<StatCounter
  label="Total Queries"
  value={1247}
  trend="up"
  change={12.5}
  icon={<BrainIcon />}
/>
```

**Props:**
- `label` (string): Statistic label
- `value` (number): Counter value with animation
- `trend` ("up" | "down" | "neutral"): Trend direction
- `change` (number): Percentage change
- `icon` (ReactNode): Optional icon component

### GlassPanel
Generic glassmorphic container with variants.

```jsx
import GlassPanel from './components/ui/GlassPanel';

<GlassPanel
  title="Recent Activity"
  variant="data"
  collapsible={true}
  headerActions={<button>Action</button>}
>
  <p>Panel content goes here</p>
</GlassPanel>
```

**Props:**
- `title` (string): Panel header title
- `variant` ("default" | "chart" | "data" | "controls"): Style variant
- `collapsible` (boolean): Enable collapse functionality
- `headerActions` (ReactNode): Action buttons in header
- `children` (ReactNode): Panel content

### HeaderBar
Glass-styled navigation header.

```jsx
import HeaderBar from './components/ui/HeaderBar';

<HeaderBar
  title="Dashboard"
  user={{ name: "John Doe", avatar: "/avatar.jpg" }}
  onProfileClick={() => {}}
  onNotificationClick={() => {}}
/>
```

### SidebarNav
Collapsible icon-only navigation.

```jsx
import SidebarNav from './components/ui/SidebarNav';

<SidebarNav
  isCollapsed={true}
  onToggle={() => setCollapsed(!collapsed)}
  activeItem="dashboard"
  onNavigate={(item) => setActiveItem(item)}
/>
```

### DashboardPage
Complete dashboard layout composition.

```jsx
import DashboardPage from './components/ui/DashboardPage';

<DashboardPage
  user={userProfile}
  databases={databases}
  stats={dashboardStats}
  onNavigate={handleNavigation}
/>
```

## Animation System

### Using Animation Utilities
```jsx
import { springTransition, hoverScale, containerVariants } from '../utils/animations';
import { motion } from 'framer-motion';

<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  whileHover={hoverScale}
  transition={springTransition}
>
  Content
</motion.div>
```

### Reduced Motion Support
The system automatically respects `prefers-reduced-motion` settings:

```jsx
import { getMotionVariants } from '../utils/animations';

const variants = getMotionVariants(prefersReducedMotion);
```

## Styling System

### Glass Effects
```css
/* Apply glassmorphism */
.glass          /* Standard glass effect */
.glass-strong   /* More prominent glass */
.glass-subtle   /* Subtle glass effect */

/* Gradients */
.gradient-primary    /* Pink to purple gradient */
.gradient-secondary  /* Blue to teal gradient */
.gradient-tertiary   /* Green gradient */

/* Glows */
.glow-primary       /* Pink glow shadow */
.glow-secondary     /* Blue glow shadow */
.glow-tertiary      /* Green glow shadow */
```

### Custom Animations
```css
.animate-float      /* Floating animation */
.animate-pulse-glow /* Pulsing glow effect */
.animate-gradient   /* Shifting gradient */
.hover-lift         /* Hover lift effect */
```

## Integration with Existing App

### App.jsx Integration
The new UI is integrated as a dashboard mode toggle:

```jsx
// State management
const [isDashboardMode, setIsDashboardMode] = useState(true);
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

// Conditional rendering
{isDashboardMode ? (
  <DashboardPage
    user={userProfile}
    databases={databases}
    stats={dashboardStats}
    onNavigate={handleNavigation}
  />
) : (
  // Original NeuroBase UI
  <OriginalUI />
)}
```

### Data Integration
Dashboard components integrate with existing hooks:

```jsx
// Using existing data hooks
const { databases, selectedDb } = useDatabase();
const { recentQueries } = useQuery();
const { userProfile } = useAuth();

// Transform data for dashboard
const dashboardStats = {
  totalDatabases: databases.length,
  activeQueries: recentQueries.length,
  // ... other stats
};
```

## Accessibility Features

### Keyboard Navigation
- All interactive elements support keyboard navigation
- Focus indicators with gradient outlines
- Skip links for screen readers

### Screen Reader Support
```jsx
// ARIA attributes included
<div
  role="button"
  aria-label="Database statistics cube"
  aria-live="polite"
  tabIndex={0}
>
```

### Motion Preferences
- Automatic detection of `prefers-reduced-motion`
- Fallback animations for accessibility
- Option to disable all animations

## Performance Considerations

### Component Optimization
- React.memo for pure components
- Lazy loading for heavy components
- GPU-accelerated animations with `transform` and `opacity`

### Animation Performance
- Uses `transform` and `opacity` for 60fps animations
- Framer Motion's optimized animation engine
- Reduced motion fallbacks

## Customization

### Theme Variables
Modify glassmorphism effects in `glassmorphism.css`:

```css
.glass {
  background: rgba(255, 255, 255, 0.1); /* Adjust opacity */
  backdrop-filter: blur(16px);           /* Adjust blur */
  border: 1px solid rgba(255, 255, 255, 0.18); /* Border opacity */
}
```

### Animation Timing
Adjust animations in `animations.js`:

```js
export const springTransition = {
  type: "spring",
  stiffness: 200, // Adjust stiffness
  damping: 28     // Adjust damping
};
```

## Browser Support

### Modern Browsers
- Chrome 88+
- Firefox 94+
- Safari 14+
- Edge 88+

### Fallbacks
- Graceful degradation for older browsers
- CSS fallbacks for backdrop-filter
- JavaScript animation fallbacks

## Troubleshooting

### Common Issues

1. **Backdrop blur not working**
   - Ensure browser supports `backdrop-filter`
   - Check for hardware acceleration

2. **Animations stuttering**
   - Verify GPU acceleration is enabled
   - Check for `will-change` CSS property

3. **Focus indicators not visible**
   - Ensure custom focus styles are applied
   - Check contrast ratios for accessibility

### Performance Tips
- Use `transform` instead of changing layout properties
- Minimize DOM reflows during animations
- Use `React.memo` for static components

## Future Enhancements

### Planned Features
- Dark/light theme toggle
- Additional cube variants
- More animation presets
- Enhanced accessibility features

### Extension Points
- Custom gradient definitions
- Additional glass panel variants
- New animation configurations
- Theme customization system

---

This implementation provides a production-ready, accessible, and performant glassmorphism UI system that seamlessly integrates with the existing NeuroBase application while maintaining all core functionality.
