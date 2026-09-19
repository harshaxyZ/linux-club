export const SITE = {
  name: 'Linux OpenSource Club',
  shortName: 'Linux OSS Club',
  college: 'Don Bosco Institute of Technology, Bangalore',
  dept: 'Department of Computer Science and Engineering',
  facultyCoordinator: 'Dr. Dheeraj',
  lab: 'Lab A-306 or Lab A-228',
  hours: '4:00 PM - 6:00 PM on working days',
  discord: process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/AC276UE4NF',
  github: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/LOSSC-DBIT',
  /** Applicants are sent here right after submitting. */
  whatsapp:
    process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://chat.whatsapp.com/IF6XtTwx8ZBD52uUIs5Xjz',
} as const;

export const DOMAINS = [
  {
    num: '01',
    title: 'Data Structures & Algorithms',
    desc: 'Daily DSA practice with a defined syllabus progression, peer mentoring, periodic internal contests. 3 core-team mentors own problem sets and competitive programming guidance. Solve in whichever language you are comfortable with.',
    tags: ['Problem Solving', 'Contests', 'LeetCode', 'Codeforces'],
  },
  {
    num: '02',
    title: 'AI & Development',
    desc: 'Python for AI, ML fundamentals, open-source AI models, LLM APIs and prompt design, and building AI agents - tool calling, retrieval, memory, orchestration.',
    tags: ['Python', 'LLM APIs', 'AI Agents', 'Open Models'],
  },
  {
    num: '03',
    title: 'Core CS & Systems',
    desc: 'Ubuntu Linux and shell, OS and networking, DBMS and SQL, frontend and backend development, containers, deployment and CI/CD. 4 core-team mentors.',
    tags: ['Ubuntu', 'Git & GitHub', 'Frontend', 'Backend'],
  },
] as const;
