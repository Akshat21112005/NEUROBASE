// Canvas components disabled to fix React Three Fiber errors
// These components were causing issues with React Three Fiber
// They have been replaced with CSS and framer-motion based animations

import React from 'react';

// Placeholder components to satisfy imports
const EarthCanvas = () => <div className="hidden"></div>;
const BallCanvas = () => <div className="hidden"></div>;
const ComputersCanvas = () => <div className="hidden"></div>;
const StarsCanvas = () => <div className="hidden"></div>;

export { EarthCanvas, BallCanvas, ComputersCanvas, StarsCanvas };
