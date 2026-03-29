import React from "react";
import { motion } from "framer-motion";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";

const About = () => {
  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>Introduction</p>
        <h2 className={styles.sectionHeadText}>Overview.</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className='mt-4 text-white text-[17px] max-w-3xl leading-[30px]'
      >
        Computer Science Student | AI/ML Enthusiast | Competitive Programmer
        <br /><br />
        I'm Akshat Bhatt, a B.Tech student in Information and Communication Technology 
        with minors in Computational Science at Dhirubhai Ambani University. Passionate about 
        artificial intelligence and machine learning, I enjoy building innovative solutions 
        and solving complex problems through code.
        <br /><br />
        🔭 Currently working on Computer Vision and Machine Learning projects<br />
        🌱 Learning OpenCV, React, and Full-Stack Development<br />
        💡 Interested in AI/ML research and applications<br />
        🎯 Always excited to collaborate on innovative projects<br />
        📧 Reach me at: akshatb4567@gmail.com
        <br /><br />
        <em>"Code is poetry written in logic"</em>
      </motion.p>

    </>
  );
};

export default SectionWrapper(About, "about");
