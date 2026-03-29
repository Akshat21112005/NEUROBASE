import {
  mobile,
  backend,
  creator,
  web,
  javascript,
  html,
  css,
  reactjs,
  nodejs,
  mongodb,
  git,
  figma,
  docker,
  python,
  tensorflow,
  pytorch,
  numpy,
  pandas,
  fastapi,
  express,
  jeevantirth,
  ehc,
  carrent,
  jobit,
  tripguide,
} from "../assets";

export const navLinks = [
  {
    id: "about",
    title: "About Me",
  },
  {
    id: "work",
    title: "Work",
  },
  {
    id: "contact",
    title: "Contact",
  },
];

const services = [
  {
    title: "AI Data Analysis",
    icon: web,
  },
  {
    title: "Natural Language Queries",
    icon: mobile,
  },
  {
    title: "Predictive Analytics",
    icon: backend,
  },
  {
    title: "Data Visualization",
    icon: creator,
  },
];

const technologies = [
  {
    name: "HTML 5",
    icon: html,
    link: "https://developer.mozilla.org/en-US/docs/Web/HTML",
  },
  {
    name: "CSS 3",
    icon: css,
    link: "https://developer.mozilla.org/en-US/docs/Web/CSS",
  },
  {
    name: "JavaScript",
    icon: javascript,
    link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  },
  {
    name: "React JS",
    icon: reactjs,
    link: "https://reactjs.org/",
  },
  {
    name: "Node JS",
    icon: nodejs,
    link: "https://nodejs.org/",
  },
  {
    name: "MongoDB",
    icon: mongodb,
    link: "https://www.mongodb.com/",
  },
  {
    name: "Python",
    icon: python,
    link: "https://www.python.org/",
  },
  {
    name: "TensorFlow",
    icon: tensorflow,
    link: "https://www.tensorflow.org/",
  },
  {
    name: "PyTorch",
    icon: pytorch,
    link: "https://pytorch.org/",
  },
  {
    name: "NumPy",
    icon: numpy,
    link: "https://numpy.org/",
  },
  {
    name: "Pandas",
    icon: pandas,
    link: "https://pandas.pydata.org/",
  },
  {
    name: "FastAPI",
    icon: fastapi,
    link: "https://fastapi.tiangolo.com/",
  },
  {
    name: "Express JS",
    icon: express,
    link: "https://expressjs.com/",
  },
  {
    name: "Docker",
    icon: docker,
    link: "https://www.docker.com/",
  },
  {
    name: "Figma",
    icon: figma,
    link: "https://www.figma.com/",
  },
  {
    name: "Git",
    icon: git,
    link: "https://git-scm.com/",
  },
];

const experiences = [
  {
    title: "Volunteer Intern",
    company_name: "Jeevantirth Foundation",
    icon: jeevantirth,
    iconBg: "#383E56",
    date: "November 2024",
    points: [
      "Contributed to a volunteer team focused on rural education system improvements in Gujarat.",
      "Conducted qualitative analysis, proposing practical recommendations for educational enhancement.",
      "Collaborated with local communities to understand educational challenges and opportunities.",
      "Developed actionable insights to improve educational infrastructure and accessibility.",
    ],
  },
  {
    title: "Member",
    company_name: "Electronics Hobby Club DA-IICT",
    icon: ehc,
    iconBg: "#E6DEDD",
    date: "April 2025 – Present",
    points: [
      "Collaborated with a team on a project utilizing Edge AI and ESP/Wi-Fi modules for an upcoming initiative.",
      "Actively contributed to the planning and discussions for the upcoming Robofest competition.",
      "Engaged in hands-on electronics projects involving microcontrollers and IoT devices.",
      "Participated in technical workshops and knowledge sharing sessions on emerging technologies.",
    ],
  },
];

const testimonials = [
  {
    testimonial:
      "I thought it was impossible to make a website as beautiful as our product, but Rick proved me wrong.",
    name: "Sara Lee",
    designation: "CFO",
    company: "Acme Co",
    image: "https://randomuser.me/api/portraits/women/4.jpg",
  },
  {
    testimonial:
      "I've never met a web developer who truly cares about their clients' success like Rick does.",
    name: "Chris Brown",
    designation: "COO",
    company: "DEF Corp",
    image: "https://randomuser.me/api/portraits/men/5.jpg",
  },
  {
    testimonial:
      "After Rick optimized our website, our traffic increased by 50%. We can't thank them enough!",
    name: "Lisa Wang",
    designation: "CTO",
    company: "456 Enterprises",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
  },
];

const projects = [
  {
    name: "NeuroBase",
    description:
      "AI-powered data query platform using FastAPI, React.js, Gemini AI, and SQLite. Built a full-stack application using Gemini AI for NL-to-SQL conversion to enable data analysis and exploration for non-technical users.",
    tags: [
      {
        name: "react",
        color: "blue-text-gradient",
      },
      {
        name: "fastapi",
        color: "green-text-gradient",
      },
      {
        name: "gemini-ai",
        color: "pink-text-gradient",
      },
    ],
    image: carrent,
    source_code_link: "https://github.com/Akshat21112005/NEUROBASE",
  },
  {
    name: "5G NR LDPC Decoder",
    description:
      "Implemented LDPC decoding algorithms for 5G NR communication systems using C++ and MATLAB. Applied LLR-BP and min-sum approximation for error correction in advanced communication systems.",
    tags: [
      {
        name: "cpp",
        color: "blue-text-gradient",
      },
      {
        name: "matlab",
        color: "green-text-gradient",
      },
      {
        name: "algorithms",
        color: "pink-text-gradient",
      },
    ],
    image: jobit,
    source_code_link: "https://github.com/Akshat21112005/LDPC_Codes_5G_NR",
  },
  {
    name: "VISHWA - Healthcare Data Management",
    description:
      "Developed a scalable healthcare database system using PostgreSQL and SQL. Created 15+ BCNF-normalized tables with role-based access for managing patient and staff records efficiently.",
    tags: [
      {
        name: "postgresql",
        color: "blue-text-gradient",
      },
      {
        name: "sql",
        color: "green-text-gradient",
      },
      {
        name: "database",
        color: "pink-text-gradient",
      },
    ],
    image: tripguide,
    source_code_link: "https://github.com/Akshat21112005/VISHWA",
  },
];

export { services, technologies, experiences, testimonials, projects };
