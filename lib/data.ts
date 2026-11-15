export const personalInfo = {
  name: "Hameed Khan Mohammad",
  shortName: "HAMEED KHAN",
  firstName: "Hameed",
  title: "Software Engineer",
  location: "Hyderabad, India",
  phone: "+91-8919070648",
  email: "hameed1198@gmail.com",
  linkedin: "https://linkedin.com/in/hameed-khan-mohammad-35b697183",
  github: "https://github.com/hameed1198",
  tagline: "Building enterprise backends, cloud-native systems & GenAI experiences.",
  summary:
    "Software Engineer with 5 years of experience building and supporting enterprise applications, backend services, REST APIs, data-processing pipelines and cloud-native solutions. Strong hands-on experience with Python, FastAPI, Flask, SQL, AWS, React, TypeScript, Apache Airflow and Docker. Experienced in GenAI application development using LLM APIs, prompt engineering, semantic search and RAG concepts.",
  heroTags: ["Python", "Full Stack", "AWS", "GenAI"],
  photo: "/images/profile.jpg",
};

/** Holographic 3D badges around the avatar (intro Frame 09 and the Hero). */
export const techBadges = {
  primary: [
    { label: "Python", icon: "</>" },
    { label: "AWS", icon: "☁" },
    { label: "React", icon: "⚛" },
    { label: "GenAI", icon: "✦" },
  ],
  secondary: [
    { label: "FastAPI", icon: "⚡" },
    { label: "SQL", icon: "▤" },
    { label: "Docker", icon: "⬡" },
  ],
};

export const stats = [
  { label: "Years Experience", value: "5+", command: "exp --years" },
  { label: "Companies", value: "3+", command: "career --count" },
  { label: "AI Projects", value: "2", command: "genai --projects" },
  { label: "Certifications", value: "3", command: "certs --list" },
];

export type ExperienceItem = {
  id: string;
  company: string;
  role: string;
  period: string;
  projects?: {
    name: string;
    role: string;
    bullets: string[];
    tech: string[];
  }[];
  bullets?: string[];
  tech: string[];
};

export const experience: ExperienceItem[] = [
  {
    id: "creditsafe",
    company: "Creditsafe",
    role: "Associate System Engineer 2",
    period: "Mar 2022 – Present",
    tech: ["Python", "FastAPI", "Flask", "Airflow", "AWS", "React", "TypeScript", "DynamoDB"],
    projects: [
      {
        name: "Global Data Editing Tool (Global DET)",
        role: "Python FullStack Developer",
        tech: ["Python", "Flask", "FastAPI", "Airflow", "SQL", "AWS S3"],
        bullets: [
          "Develop and maintain enterprise backend services and REST APIs using Python, Flask and FastAPI.",
          "Build and maintain Apache Airflow ETL pipelines for enterprise data processing.",
          "Implement data migration and integration workflows using SQL and AWS S3.",
          "Optimize SQL queries and develop reusable Python utilities for validation and automation.",
        ],
      },
      {
        name: "Data Studios",
        role: "Python / AWS Serverless Developer | React & TypeScript",
        tech: ["Python", "AWS Lambda", "DynamoDB", "React", "TypeScript"],
        bullets: [
          "Built serverless and event-driven application workflows with Python and AWS Lambda.",
          "Enhanced UI functionality using React and TypeScript with backend API integration.",
          "Worked with DynamoDB for scalable application data storage.",
        ],
      },
    ],
  },
  {
    id: "cognizant",
    company: "Cognizant",
    role: "Intern",
    period: "Aug 2021 – Oct 2021",
    tech: ["Python", "SQL"],
    bullets: [
      "Supported Python backend development, SQL operations and application enhancements.",
    ],
  },
  {
    id: "cyient",
    company: "Cyient",
    role: "Data Analyst",
    period: "Dec 2019 – Sep 2020",
    tech: ["SQL", "Data Analysis", "Reporting"],
    bullets: [
      "Performed data analysis, cleansing, reporting and business validation for enterprise datasets on the IHS Markit project.",
    ],
  },
];

export type SkillCategory = {
  id: string;
  label: string;
  skills: { name: string; level: number }[];
};

export const skillCategories: SkillCategory[] = [
  {
    id: "backend",
    label: "Backend",
    skills: [
      { name: "Python", level: 95 },
      { name: "FastAPI", level: 90 },
      { name: "Flask", level: 88 },
      { name: "REST APIs", level: 92 },
      { name: "Microservices", level: 85 },
      { name: "SQLAlchemy", level: 80 },
    ],
  },
  {
    id: "frontend",
    label: "Frontend",
    skills: [
      { name: "React", level: 85 },
      { name: "TypeScript", level: 82 },
      { name: "JavaScript", level: 88 },
      { name: "HTML/CSS", level: 90 },
    ],
  },
  {
    id: "cloud",
    label: "Cloud",
    skills: [
      { name: "AWS", level: 88 },
      { name: "Lambda", level: 85 },
      { name: "S3", level: 90 },
      { name: "DynamoDB", level: 82 },
      { name: "CloudWatch", level: 80 },
    ],
  },
  {
    id: "ai",
    label: "AI / GenAI",
    skills: [
      { name: "OpenAI APIs", level: 85 },
      { name: "Gemini APIs", level: 85 },
      { name: "RAG", level: 80 },
      { name: "Prompt Engineering", level: 88 },
      { name: "Semantic Search", level: 78 },
    ],
  },
  {
    id: "data",
    label: "Data",
    skills: [
      { name: "Apache Airflow", level: 88 },
      { name: "ETL/ELT", level: 90 },
      { name: "PostgreSQL", level: 85 },
      { name: "MySQL", level: 82 },
      { name: "Amazon Redshift", level: 75 },
    ],
  },
  {
    id: "devops",
    label: "DevOps",
    skills: [
      { name: "Docker", level: 85 },
      { name: "Git", level: 92 },
      { name: "CI/CD", level: 80 },
      { name: "Agile/Scrum", level: 88 },
    ],
  },
];

export const allSkills = skillCategories.flatMap((c) => c.skills.map((s) => s.name));

export type Project = {
  id: string;
  title: string;
  description: string;
  highlights: string[];
  tech: string[];
  accent: string;
  metric?: string;
};

export const projects: Project[] = [
  {
    id: "healthcare-ai",
    title: "AI Healthcare Assistant",
    description:
      "A full-stack AI healthcare assistant with conversational LLM workflows, modular REST APIs, and insight generation over large healthcare datasets.",
    highlights: [
      "FastAPI + React + Gemini AI stack",
      "Prompt-driven conversational workflows",
      "Analyzed 34,000+ healthcare-related records",
    ],
    tech: ["FastAPI", "React", "Gemini AI", "REST APIs", "Python"],
    accent: "#00ff88",
    metric: "34,000+ records",
  },
  {
    id: "resume-jd",
    title: "Resume–JD Match Analyzer",
    description:
      "An AI-powered resume analysis platform with semantic skill matching, intelligent scoring, and modular APIs ready for RAG and vector search.",
    highlights: [
      "Semantic skill matching & scoring",
      "NLP-powered analysis workflows",
      "Architecture designed for future RAG integration",
    ],
    tech: ["FastAPI", "NLP", "Python", "Semantic Search"],
    accent: "#00ffcc",
    metric: "Semantic match",
  },
];

export const certifications = [
  {
    id: "aws-dev",
    title: "AWS Development",
    issuer: "Amazon Web Services",
    detail: "Hands-on cloud development practices across AWS services.",
  },
  {
    id: "aws-migration",
    title: "AWS Migration",
    issuer: "Amazon Web Services",
    detail: "Cloud migration strategies, patterns and operational readiness.",
  },
  {
    id: "databricks",
    title: "Databricks Fundamentals",
    issuer: "Databricks",
    detail: "Core concepts for lakehouse platforms and data engineering.",
  },
];

export const education = [
  {
    degree: "Master of Computer Applications (MCA)",
    school: "Sri Chaitanya Institute of Science & Technology",
  },
  {
    degree: "Bachelor of Computer Applications (BCA)",
    school: "Aditya Degree College",
  },
];

export const highlights = [
  "Python Backend Development",
  "Full-Stack Development",
  "REST APIs",
  "AWS & Serverless",
  "React",
  "FastAPI / Flask",
  "SQL & Data Engineering",
  "GenAI / LLM Applications",
  "Agile Delivery",
  "Troubleshooting & Problem Solving",
];