import React from "react";
import { motion } from "framer-motion";
import { SectionWrapper } from "../hoc";
import { technologies } from "../constants";

const Tech = () => {
  return (
    <div className='flex flex-row flex-wrap justify-center gap-10'>
      {technologies.map((technology) => (
        <motion.a
          href={technology.link}
          target="_blank"
          rel="noopener noreferrer"
          className='w-28 h-28 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-lg border border-white/10 cursor-pointer' 
          key={technology.name}
          whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(145, 94, 255, 0.5)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 10 }}
        >
          <img src={technology.icon} alt={technology.name} className="w-16 h-16 object-contain" />
        </motion.a>
      ))}
    </div>
  );
};

export default SectionWrapper(Tech, "");
