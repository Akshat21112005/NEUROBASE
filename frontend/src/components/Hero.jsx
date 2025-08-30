import { motion } from "framer-motion";
import { styles } from "../styles";

const Hero = () => {
  return (
    <section className={`relative w-full h-screen mx-auto`}>
      <div
        className={`absolute inset-0 top-[120px] max-w-7xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5`}
      >
        <div className='flex flex-col justify-center items-center mt-5'>
          <div className='w-5 h-5 rounded-full bg-[#915EFF]' />
          <div className='w-1 sm:h-80 h-40 violet-gradient' />
        </div>

        <div>
          <h1 className={`${styles.heroHeadText} text-white`}>
            Hi, I'm <span className='text-[#915EFF]'>Akshat Bhatt</span>
          </h1>
          <p className={`${styles.heroSubText} mt-2 text-white-100`}>
            I develop AI-powered applications, <br className='sm:block hidden' />
            full-stack solutions and intelligent systems
          </p>
        </div>
      </div>

      <div className="absolute inset-0 z-[-1] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 animate-gradient-slow" style={{ backgroundSize: '400% 400%' }}>
          {/* Animated particles */}
          {Array.from({ length: 30 }).map((_, i) => {
            const size = Math.random() * 8 + 2;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: size,
                  height: size,
                  left: `${x}%`,
                  top: `${y}%`,
                  opacity: Math.random() * 0.5 + 0.1
                }}
                animate={{
                  y: [0, Math.random() * 20 - 10],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{
                  duration: Math.random() * 8 + 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            );
          })}
          
          {/* Neural network lines */}
          {Array.from({ length: 15 }).map((_, i) => {
            const width = Math.random() * 150 + 50;
            const height = Math.random() * 1 + 0.5;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const rotation = Math.random() * 360;
            
            return (
              <motion.div
                key={`line-${i}`}
                className="absolute bg-white"
                style={{
                  width,
                  height,
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `rotate(${rotation}deg)`,
                  opacity: 0.1
                }}
                animate={{
                  opacity: [0.05, 0.15, 0.05],
                  width: [width, width * 1.2, width]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            );
          })}
        </div>
      </div>

      <div className='absolute xs:bottom-10 bottom-32 w-full flex justify-center items-center'>
        <a href='#about'>
          <div className='w-[35px] h-[64px] rounded-3xl border-4 border-secondary flex justify-center items-start p-2'>
            <motion.div
              animate={{
                y: [0, 24, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className='w-3 h-3 rounded-full bg-secondary mb-1'
            />
          </div>
        </a>
      </div>
    </section>
  );
};

export default Hero;
