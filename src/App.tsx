import { useEffect, useMemo, useRef, useState } from "react";

// Add campaign-specific destinations here when they are ready.
const INSTAGRAM_URL = "";
const GOOGLE_FORM_URL = "https://forms.gle/hWnnu8idcQdX6zJr8";
const TEAM_NAME = "Prompt Wise Project Team";

type Category = "Verify" | "Own Work" | "Rules" | "Privacy" | "Critical" | "AI Skills";
type Answer = { text: string; points?: number; correct?: boolean };
type Question = {
  id: number;
  part: 1 | 2 | 3;
  category: Category;
  points: number;
  prompt: string;
  answers: Answer[];
  explanation?: string;
  habitTip?: string;
};
type Response = { answer: Answer; earned: number };
type Page = "home" | "quiz" | "results" | "about";

const areaTips: Record<Category, string> = {
  "AI Skills":
    "Prompt smarter: give context, a clear task and a format, and remember tokens, context windows and memory limit what AI keeps track of.",
  Verify: "Verify before you trust: find the original source, check dates, and confirm every reference exists.",
  "Own Work":
    "Think first, then use AI: outline and draft in your own words, then ask AI for feedback and explanations.",
  Rules:
    "Ask and declare: read the AI rules, ask your lecturer if unsure, and say exactly how AI helped.",
  Privacy: "Protect data: never paste names, IDs, passwords or private files into AI tools.",
  Critical: "Question the output: look for bias, missing views and confident-sounding errors.",
};

const practicalActions: Record<Category, string> = {
  Verify: "Open every source and confirm the claim before adding it to your work.",
  "Own Work": "Write a short outline without AI before you open any AI tool.",
  Rules: "Read the assignment brief and ask your lecturer before you begin.",
  Privacy: "Remove names, IDs and private details before sharing any material.",
  Critical: "Ask who or what is missing, then compare the answer with another reliable source.",
  "AI Skills": "Add your context, task and preferred format to your next study prompt.",
};

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through for in-app browsers that expose the API but block permission.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

const habitAnswers: Answer[] = [
  { text: "Yes", points: 1, correct: true },
  { text: "Sometimes", points: 0.5 },
  { text: "No", points: 0 },
];

const questions: Question[] = [
  {
    id: 1,
    part: 1,
    category: "Verify",
    points: 1,
    prompt: "Did you check the AI's facts against reliable sources?",
    answers: habitAnswers,
    habitTip:
      "Compare AI claims with your notes, textbooks or the library database. Fluent writing does not mean accurate.",
  },
  {
    id: 2,
    part: 1,
    category: "Own Work",
    points: 1,
    prompt: "Can you explain the final answer without looking at the AI's response?",
    answers: habitAnswers,
    habitTip:
      "Close the chat and explain it in your own words. Where you get stuck is what you still need to learn.",
  },
  {
    id: 3,
    part: 1,
    category: "Own Work",
    points: 1,
    prompt: "Did you plan and write the work in your own words and thinking?",
    answers: habitAnswers,
    habitTip:
      "Swapping a few words keeps the AI's ideas. Outline and draft first, then ask AI for feedback.",
  },
  {
    id: 4,
    part: 1,
    category: "Verify",
    points: 1,
    prompt: "Did you check that every reference is real and says what you claim?",
    answers: habitAnswers,
    habitTip:
      "AI can invent believable references. Search each title in Google Scholar or the library. If you cannot find it, do not use it.",
  },
  {
    id: 5,
    part: 1,
    category: "Rules",
    points: 1,
    prompt: "Did you check and follow your assignment's AI rules?",
    answers: habitAnswers,
    habitTip:
      "Rules differ by subject and task. Read the brief or ask your lecturer before you start and before you submit.",
  },
  {
    id: 6,
    part: 1,
    category: "Rules",
    points: 1,
    prompt: "Did you declare how AI helped you?",
    answers: habitAnswers,
    habitTip: "Name the tool, what it did and what you did yourself. Being open protects you.",
  },
  {
    id: 7,
    part: 2,
    category: "Verify",
    points: 2,
    prompt:
      "AI gives you the source 'Rahman, A. (2021). Student Learning in the Age of AI. Journal of Digital Education.' You cannot find it online. What do you do?",
    answers: [
      {
        text: "Search Google Scholar or the library; if it does not exist, remove it and find a real source",
        correct: true,
      },
      { text: "Keep it, the format looks right" },
      { text: "Ask the AI 'Is this source real?'" },
      { text: "Keep the title but change the author's name" },
    ],
    explanation:
      "AI can generate references that look perfect but do not exist. Asking the same AI to confirm is not verification. Only a source you found and read counts.",
  },
  {
    id: 8,
    part: 2,
    category: "Rules",
    points: 2,
    prompt: "Your assignment brief does not mention AI. What do you do?",
    answers: [
      { text: "Ask your lecturer what is allowed, and declare whatever you use", correct: true },
      { text: "Use AI freely, nothing says you cannot" },
      { text: "Use AI but say nothing" },
      { text: "Use it only for the 'easy parts' without telling anyone" },
    ],
    explanation:
      "Silence in a brief is not permission. If in doubt, ask first, and always be open about your use.",
  },
  {
    id: 9,
    part: 2,
    category: "Own Work",
    points: 2,
    prompt: "You are stuck on an essay and the deadline is close. What is the most responsible use of AI?",
    answers: [
      {
        text: "Write your own outline and draft, then ask AI to explain confusing concepts and point out gaps",
        correct: true,
      },
      { text: "Ask AI to write the essay, then swap in synonyms" },
      { text: "Ask AI to write it and submit it with a declaration" },
      { text: "Ask for a model essay and copy its structure and arguments" },
    ],
    explanation:
      "Working out your argument is where learning happens. Synonyms do not change who did the thinking, and a declaration does not make AI-written work yours. Use AI as a tutor or reviewer.",
  },
  {
    id: 10,
    part: 2,
    category: "Privacy",
    points: 2,
    prompt: "You want AI to summarise group survey feedback that includes names and student IDs. What do you do?",
    answers: [
      { text: "Remove names, IDs and identifying details first, and share only what is needed", correct: true },
      { text: "Paste it all, it is only a summary" },
      { text: "Paste only the IDs" },
      { text: "Paste it, then delete the chat" },
    ],
    explanation:
      "Once personal data is entered, you cannot fully control it. Anonymise first, and never enter passwords or private documents.",
  },
  {
    id: 11,
    part: 2,
    category: "Own Work",
    points: 2,
    prompt: "AI solved your tutorial question and next week's test has no AI. What do you do?",
    answers: [
      { text: "Cover the solution, redo the question from scratch, and note why each step works", correct: true },
      { text: "Copy the answer and move on" },
      { text: "Read it and tell yourself you understand" },
      { text: "Ask AI to solve ten more questions" },
    ],
    explanation:
      "Reading a correct solution creates an illusion of understanding. Learning sticks when you practise recalling without the answer in front of you.",
  },
  {
    id: 12,
    part: 2,
    category: "Critical",
    points: 2,
    prompt:
      "You ask AI to describe 'a typical successful engineer' and it describes only one gender and background. What do you do?",
    answers: [
      { text: "Treat it as a draft, spot the stereotype, and check other sources and varied examples", correct: true },
      { text: "Use it directly, AI is neutral" },
      { text: "Delete it and never use AI again" },
      { text: "Add a few diversity words and keep the rest" },
    ],
    explanation:
      "AI learns from human-made data, so it can repeat stereotypes or leave people out. Ask 'who is missing?' and check other sources.",
  },
  {
    id: 13,
    part: 2,
    category: "Rules",
    points: 2,
    prompt: "A teammate pastes an AI-written section into your shared report and does not mention it. What do you do?",
    answers: [
      {
        text: "Talk to them, check the facts and references together, and agree how the team will declare AI use",
        correct: true,
      },
      { text: "Leave it, it is their section" },
      { text: "Quietly rewrite it and say nothing" },
      { text: "Report them to the lecturer straight away" },
    ],
    explanation:
      "In group work everyone shares responsibility for what is submitted. Start with a respectful conversation, then ask your lecturer if you are unsure.",
  },
  {
    id: 14,
    part: 3,
    category: "Critical",
    points: 1,
    prompt: "Why can AI produce false information that sounds convincing?",
    answers: [
      { text: "It generates likely-sounding text from patterns and does not automatically check facts", correct: true },
      { text: "It deliberately tries to trick users" },
      { text: "It always searches the live internet and copies mistakes" },
      { text: "It only makes errors on very hard topics" },
    ],
    explanation:
      "AI language tools predict plausible text. Even tools that search the web can misread what they find. Fluent writing is not proof.",
  },
  {
    id: 15,
    part: 3,
    category: "Rules",
    points: 1,
    prompt: "Which is the best declaration of AI use?",
    answers: [
      {
        text: "'I used [tool] to brainstorm ideas and check grammar. I wrote the analysis myself and verified all facts and references.'",
        correct: true,
      },
      { text: "'I used AI.'" },
      { text: "'No AI was used', because you edited the text" },
      { text: "No declaration is needed if you changed the wording" },
    ],
    explanation:
      "A good declaration names the tool, says what it did and says what you did. Follow your university's format if it has one.",
  },
  {
    id: 16,
    part: 3,
    category: "Critical",
    points: 1,
    prompt: "Which best describes responsible AI use?",
    answers: [
      {
        text: "Using AI as a support tool while you understand, verify and take responsibility for the final work",
        correct: true,
      },
      { text: "Using AI to finish as fast as possible" },
      { text: "Using AI only if nobody can tell" },
      { text: "Never using AI at all" },
    ],
    explanation:
      "Responsible use is not about banning AI. You stay in charge: you think, check, follow the rules and own the result.",
  },
  {
    id: 17,
    part: 3,
    category: "Verify",
    points: 1,
    prompt: "AI says '78% of university students use AI daily.' How do you verify it?",
    answers: [
      { text: "Find the original study and check who ran it, when, and who it covered", correct: true },
      { text: "Ask AI to repeat the statistic" },
      { text: "Use the first website that shows the number" },
      { text: "Assume it is right because it sounds believable" },
    ],
    explanation:
      "A statistic is reliable only if you can trace it to a credible original source. Check the date, the sample and the context.",
  },
  {
    id: 18,
    part: 3,
    category: "AI Skills",
    points: 1,
    prompt: "Which prompt is most likely to give a useful study answer?",
    answers: [
      {
        text: "'I'm a first-year IT student. Explain recursion simply with one example, then give me 3 practice questions without answers.'",
        correct: true,
      },
      { text: "'Explain recursion.'" },
      { text: "'Do my recursion assignment.'" },
      { text: "'recursion??? help'" },
    ],
    explanation:
      "A good prompt gives context, a clear task and the format you want. Asking for practice questions without answers keeps you doing the thinking.",
  },
  {
    id: 19,
    part: 3,
    category: "AI Skills",
    points: 1,
    prompt: "What is a 'token' in an AI tool?",
    answers: [
      { text: "A chunk of text, often a word or part of a word, that the AI processes", correct: true },
      { text: "A password for logging in" },
      { text: "Always exactly one letter" },
      { text: "A reward for a good prompt" },
    ],
    explanation: "AI reads and writes text in tokens. Tools limit how many they can handle at once.",
  },
  {
    id: 20,
    part: 3,
    category: "AI Skills",
    points: 1,
    prompt: "In a very long chat the AI starts ignoring your earlier instructions. What should you do?",
    answers: [
      { text: "Start a new chat and paste a short summary of the key points", correct: true },
      { text: "Apologise to it" },
      { text: "Repeat the same instruction ten times" },
      { text: "Assume your account is broken" },
    ],
    explanation:
      "The context window is the amount of text (in tokens) the AI can consider at once. In long chats, older parts can be dropped or ignored.",
  },
  {
    id: 21,
    part: 3,
    category: "AI Skills",
    points: 1,
    prompt: "Which statement about AI memory is most accurate?",
    answers: [
      {
        text: "Some tools can save details between chats if memory is on, so check settings and avoid sharing personal information",
        correct: true,
      },
      { text: "AI always forgets instantly, so share anything" },
      { text: "AI memory is always perfect" },
      { text: "Memory only stores what you deleted" },
    ],
    explanation:
      "Memory features differ between tools. Never assume a chat is private or forgotten.",
  },
  {
    id: 22,
    part: 3,
    category: "AI Skills",
    points: 1,
    prompt: "How can you reduce made-up answers about your lecture content?",
    answers: [
      { text: "Give it your own notes, ask it to answer only from them and say when unsure", correct: true },
      { text: "Ask it to 'be accurate' and trust it" },
      { text: "Ask for a more confident tone" },
      { text: "Ask again until you like the answer" },
    ],
    explanation:
      "Grounding the AI in material you trust reduces guessing. Still check the answer against your notes.",
  },
  {
    id: 23,
    part: 3,
    category: "Verify",
    points: 1,
    prompt: "What is the best way to fact-check an AI claim?",
    answers: [
      { text: "Compare it with other reliable sources such as textbooks, journals or official sites", correct: true },
      { text: "Ask the AI if it is sure" },
      { text: "Ask a second AI and accept it if they match" },
      { text: "Check that it sounds professional" },
    ],
    explanation:
      "Independent, reliable sources are the standard. Two AIs can repeat the same mistake.",
  },
];

const categories = Object.keys(areaTips) as Category[];
const partNames = { 1: "Your habits", 2: "Real situations", 3: "AI skills and facts" };

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    moon: <><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    spark: <><path d="m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5L12 3Z" /><path d="m5 15-.7 2.3L2 18l2.3.7L5 21l.7-2.3L8 18l-2.3-.7L5 15Z" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" /></>,
    warning: <><path d="M10.3 3.4 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.4a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    print: <><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
    brain: <><path d="M9.5 4A3.5 3.5 0 0 0 6 7.5v.2A3.5 3.5 0 0 0 4 11a3.5 3.5 0 0 0 2 3.2v.3A3.5 3.5 0 0 0 9.5 18H12V4H9.5Z" /><path d="M14.5 4A3.5 3.5 0 0 1 18 7.5v.2a3.5 3.5 0 0 1 2 3.3 3.5 3.5 0 0 1-2 3.2v.3a3.5 3.5 0 0 1-3.5 3.5H12V4h2.5Z" /></>,
    copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" /></>,
    refresh: <><path d="M20 7h-5V2" /><path d="M20 7a9 9 0 1 0 2 7" /></>,
    external: <><path d="M15 3h6v6M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    x: <><path d="m18 6-12 12M6 6l12 12" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Button({
  children,
  onClick,
  variant = "primary",
  icon,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  icon?: string;
  disabled?: boolean;
}) {
  return <button className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>{children}{icon && <Icon name={icon} />}</button>;
}

function Logo({ onClick }: { onClick: () => void }) {
  return <button className="logo" onClick={onClick} aria-label="Prompt Wise home"><span className="logo-mark"><Icon name="shield" size={23} /></span><span>Prompt <b>Wise</b></span></button>;
}

function Header({
  go,
  goSection,
  dark,
  setDark,
}: {
  go: (page: Page) => void;
  goSection: (id: string) => void;
  dark: boolean;
  setDark: (value: boolean) => void;
}) {
  const [menu, setMenu] = useState(false);
  return <header className="header"><div className="nav-shell"><Logo onClick={() => go("home")} /><nav className={menu ? "nav-links open" : "nav-links"} aria-label="Main navigation"><button onClick={() => { go("home"); setMenu(false); }}>Home</button><button onClick={() => { go("quiz"); setMenu(false); }}>Take the Checker</button><button onClick={() => { goSection("toolkit"); setMenu(false); }}>After the Quiz Toolkit</button><button onClick={() => { go("about"); setMenu(false); }}>About</button></nav><div className="nav-actions"><button className="icon-btn" onClick={() => setDark(!dark)} aria-label={dark ? "Use light mode" : "Use dark mode"}><Icon name={dark ? "sun" : "moon"} /></button><button className="icon-btn mobile-menu" onClick={() => setMenu(!menu)} aria-label="Toggle menu"><Icon name={menu ? "x" : "menu"} /></button></div></div></header>;
}

function Home({ start, about }: { start: () => void; about: () => void }) {
  const learning = [
    ["Verify", "Check facts, sources and references before you trust them.", "check"],
    ["Own Work", "Keep your thinking and learning at the centre.", "brain"],
    ["Rules & Declaration", "Know what is allowed and be open about AI use.", "book"],
    ["Privacy", "Protect personal and sensitive information.", "lock"],
    ["Critical Thinking", "Notice bias, gaps and confident-sounding errors.", "spark"],
    ["AI Skills", "Understand prompts, tokens, context windows and memory.", "shield"],
  ];
  return <main>
    <section className="hero">
      <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Supporting UN SDG 4 · Quality Education</div>
          <h1>Think before<br />you <em>prompt.</em></h1>
          <p>A 7-minute check on how responsibly you use AI for study</p>
          <div className="hero-actions"><Button onClick={start} icon="arrow">Start the checker</Button><button className="text-link" onClick={about}>Why it matters <Icon name="arrow" /></button></div>
          <div className="trust-row"><span><Icon name="book" />23 questions</span><span><Icon name="clock" />About 7 minutes</span><span><Icon name="lock" />Anonymous</span><span><Icon name="spark" />Instant tips</span></div>
        </div>
        <div className="hero-visual" aria-label="Illustration of a protected AI conversation">
          <div className="ai-card"><div className="ai-top"><span className="ai-avatar"><Icon name="brain" size={28} /></span><div><b>AI study assistant</b><small>Pause. Check. Learn.</small></div><span className="online-dot" /></div><div className="chat-line wide" /><div className="chat-line" /><div className="chat-bubble">Can I verify this claim?</div></div>
          <div className="shield-float"><Icon name="shield" size={46} /><span>Stay in charge</span></div>
          <div className="spark-float"><Icon name="spark" /></div>
        </div>
      </div>
      <div className="wave" />
    </section>

    <section className="section container">
      <div className="section-heading"><span className="kicker">Simple and practical</span><h2>How it works</h2><p>No judgement. Just a clear picture of your habits and what to try next.</p></div>
      <div className="steps">
        <article><span className="step-num">01</span><div className="step-icon"><Icon name="book" /></div><h3>Answer</h3><p>Think about your usual AI habits and real study situations.</p></article>
        <article><span className="step-num">02</span><div className="step-icon blue"><Icon name="brain" /></div><h3>Learn why</h3><p>Get a short explanation after every answer.</p></article>
        <article><span className="step-num">03</span><div className="step-icon amber"><Icon name="spark" /></div><h3>Get your plan</h3><p>See your strongest areas and three practical next steps.</p></article>
      </div>
    </section>

    <section className="section learning-section"><div className="container">
      <div className="section-heading left"><span className="kicker">Skills for study and beyond</span><h2>What you will learn</h2></div>
      <div className="learning-grid">{learning.map(([title, text, icon]) => <article className="learning-card" key={title}><span className="learning-icon"><Icon name={icon} /></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
    </div></section>

    <section className="section container why-grid">
      <div className="why-art"><div className="mini-stat"><b>23</b><span>real-world study scenarios</span></div><div className="mini-shield"><Icon name="shield" size={54} /></div></div>
      <div><span className="kicker">Why it matters</span><h2>AI can support learning—when you stay in charge.</h2><p>AI tools can be useful study partners. They can also make up facts, repeat bias and blur the line between support and substitution. Prompt Wise helps you make thoughtful choices before you submit.</p><div className="todo-stat"><b>6</b><span>responsible AI skill areas to explore</span></div></div>
    </section>

    <section className="section toolkit-preview" id="toolkit"><div className="container">
      <div className="section-heading"><span className="kicker">After the quiz toolkit</span><h2>Your score is only the start.</h2><p>Finish the checker to unlock five practical tools you can use on your next assignment.</p></div>
      <div className="toolkit-steps">{["Your 3 priorities", "Make a pledge", "Before you submit", "Declaration helper", "Share & improve"].map((step, i) => <article key={step}><span>{i + 1}</span><h3>{step}</h3></article>)}</div>
      <div className="toolkit-preview-action"><Button onClick={start} icon="arrow">Start and unlock my toolkit</Button></div>
    </div></section>

    <section className="container home-privacy"><Icon name="lock" /><p><b>No names. No login.</b> Your answers stay in this browser and are not stored.</p></section>
    <section className="container cta"><div><span className="kicker light">Ready when you are</span><h2>Seven minutes. Better AI habits.</h2><p>Private, instant and built for students.</p></div><Button onClick={start} icon="arrow">Check my AI habits</Button></section>
  </main>;
}

function Quiz({
  ordered,
  onFinish,
  exit,
}: {
  ordered: Question[];
  onFinish: (responses: Record<number, Response>) => void;
  exit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, Response>>({});
  const [intro, setIntro] = useState(true);
  const current = ordered[index];
  const response = responses[current.id];
  const isCorrect = response?.answer.correct;
  const remainingMinutes = Math.max(1, Math.ceil(((ordered.length - index) * 7) / ordered.length));
  const partQuestionCount = ordered.filter((question) => question.part === current.part).length;
  const letters = ["A", "B", "C", "D"];
  const requestExit = () => {
    if (Object.keys(responses).length > 0 && !window.confirm("Leave the checker? Your answers will not be saved.")) return;
    exit();
  };
  const answer = (choice: Answer) => {
    if (response) return;
    const earned = current.part === 1 ? choice.points ?? 0 : choice.correct ? current.points : 0;
    setResponses({ ...responses, [current.id]: { answer: choice, earned } });
  };
  const next = () => {
    if (index === ordered.length - 1) return onFinish(responses);
    const nextIndex = index + 1;
    if (ordered[nextIndex].part !== current.part) setIntro(true);
    setIndex(nextIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  if (intro) return <main className="quiz-bg"><div className="quiz-top"><Logo onClick={requestExit} /><button className="quiet-exit" onClick={requestExit}>Back to home</button></div><div className="part-intro fade-in"><span className="part-pill">Part {current.part} of 3 · {partQuestionCount} questions</span><div className={`part-big-icon part-${current.part}`}><Icon name={current.part === 1 ? "brain" : current.part === 2 ? "shield" : "spark"} size={42} /></div><h1>{partNames[current.part]}</h1><p>{current.part === 1 ? "First, reflect on what you usually do when AI helps with your work." : current.part === 2 ? "Now, choose what you would do in common university situations." : "Finish with a few useful facts about how AI tools work."}</p><Button onClick={() => setIntro(false)} icon="arrow">Begin part {current.part}</Button></div></main>;

  return <main className="quiz-bg">
    <div className="quiz-top"><Logo onClick={requestExit} /><button className="quiet-exit" onClick={requestExit}>Back to home</button></div>
    <div className="quiz-shell fade-in" key={current.id}>
      <div className="quiz-meta"><div><span className="part-label">Part {current.part}</span><b>{partNames[current.part]}</b></div><div className="quiz-status"><span>Question {index + 1} of {ordered.length}</span><span><Icon name="clock" size={15} />About {remainingMinutes} min left</span></div></div>
      <div className="progress-track" aria-label={`${Math.round(((index + 1) / ordered.length) * 100)}% complete`}><span style={{ width: `${((index + 1) / ordered.length) * 100}%` }} /></div>
      <div className="question-card">
        <span className="category-chip">{current.category}</span>
        <h1>{current.prompt}</h1>
        <div className="options" role="group" aria-label="Answer options">{current.answers.map((choice, i) => {
          const selected = response?.answer.text === choice.text;
          const state = response
            ? current.part === 1
              ? selected ? "habit-selected" : "dim"
              : choice.correct ? "correct" : selected ? "wrong" : "dim"
            : "";
          return <button key={choice.text} className={`option ${state}`} onClick={() => answer(choice)} disabled={!!response}>
            <span className="letter">{current.part === 1 ? ["Y", "S", "N"][i] : letters[i]}</span><span>{choice.text}</span>
            {response && choice.correct && <span className="answer-icon"><Icon name="check" /></span>}
            {response && selected && !choice.correct && <span className="answer-icon"><Icon name="x" /></span>}
          </button>;
        })}</div>
        {response && <div className={`feedback ${current.part === 1 ? "feedback-habit" : isCorrect ? "feedback-correct" : "feedback-wrong"}`} role="status"><span className="feedback-icon"><Icon name={current.part === 1 ? "brain" : isCorrect ? "check" : "spark"} /></span><div><h2>{current.part === 1 ? isCorrect ? "Strong habit" : "A habit to build" : isCorrect ? "Correct" : "Not quite"}</h2><p>{current.part === 1 && isCorrect ? "Keep using this habit in your university work." : current.part === 1 ? current.habitTip : current.explanation}</p></div></div>}
        <div className="quiz-footer"><span>{response ? `${response.earned} of ${current.points} point${current.points === 1 ? "" : "s"}` : "Choose the answer that fits best."}</span>{response && <Button onClick={next} icon="arrow">{index === ordered.length - 1 ? "See my results" : "Next question"}</Button>}</div>
      </div>
    </div>
  </main>;
}

function ScoreRing({ percent, band }: { percent: number; band: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame = 0;
    const timer = window.setInterval(() => {
      frame += 1;
      setDisplay(Math.round((percent * frame) / 35));
      if (frame >= 35) window.clearInterval(timer);
    }, 25);
    return () => window.clearInterval(timer);
  }, [percent]);
  const circumference = 2 * Math.PI * 72;
  return <div className={`score-ring ${band}`}><svg viewBox="0 0 180 180"><circle className="ring-bg" cx="90" cy="90" r="72" /><circle className="ring-value" cx="90" cy="90" r="72" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - display / 100)} /></svg><div><b>{display}<sup>%</sup></b><span>Overall score</span></div></div>;
}

function Results({
  responses,
  restart,
  home,
}: {
  responses: Record<number, Response>;
  restart: () => void;
  home: () => void;
}) {
  const total = Object.values(responses).reduce((sum, r) => sum + r.earned, 0);
  const maximum = questions.reduce((sum, q) => sum + q.points, 0);
  const percent = Math.round((total / maximum) * 100);
  const result = percent >= 80
    ? { name: "Responsible AI use", band: "green", message: "Strong habits. You verify, think for yourself and declare your AI use. Share what you learned with a friend." }
    : percent >= 50
      ? { name: "AI use needs improvement", band: "amber", message: "You are on the right track. Work on the areas below, and check your assignment's AI rules and declare how AI helped." }
      : { name: "High academic-integrity risk", band: "red", message: "Pause before you submit. Read the AI rules or ask your lecturer, redo the work in your own words, verify every fact and reference, and declare exactly how AI helped. It is not too late to fix it." };
  const areaScores = categories.map((category) => {
    const qs = questions.filter((q) => q.category === category);
    const max = qs.reduce((s, q) => s + q.points, 0);
    const earned = qs.reduce((s, q) => s + (responses[q.id]?.earned ?? 0), 0);
    return { category, percent: Math.round((earned / max) * 100) };
  });
  const rankedAreas = [...areaScores].sort((a, b) => a.percent - b.percent);
  const lowest = rankedAreas.slice(0, 3);
  const weakest = rankedAreas[0];
  const strongest = rankedAreas[rankedAreas.length - 1];
  const missed = questions.filter((q) => !responses[q.id]?.answer.correct);
  const pledgeOptions = [
    "Verify every fact",
    "Write first and ask AI later",
    "Declare my AI use",
    "Keep personal data out",
    "Check the assignment rules",
  ];
  const checklistItems = [
    "I verified the facts",
    "I checked every reference exists",
    "I wrote it in my own words",
    "I followed the AI rules",
    "I declared how AI helped",
    "I did not enter personal data",
  ];
  const [copied, setCopied] = useState("");
  const [pledge, setPledge] = useState("");
  const [checks, setChecks] = useState<boolean[]>(() => checklistItems.map(() => false));
  const [declaration, setDeclaration] = useState(
    "I used [tool name] to [brainstorm ideas / check grammar / explain a concept]. I wrote [the analysis / the final text] myself and verified all facts and references.",
  );
  const codeRef = useRef(`RAI-${percent}-${Math.floor(1000 + Math.random() * 9000)}`);
  const copy = async (value: string, label: string) => {
    await copyText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1800);
  };
  const share = async () => {
    const text = "Try Prompt Wise: a 7-minute check on how responsibly you use AI for study. Think Before You Prompt.";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Prompt Wise challenge", text, url: window.location.href });
      } catch {
        return;
      }
    } else {
      await copyText(`${text} ${window.location.href}`);
      setCopied("share");
      window.setTimeout(() => setCopied(""), 1800);
    }
  };
  const allChecked = checks.every(Boolean);
  const resultIcon = result.band === "green" ? "shield" : result.band === "amber" ? "compass" : "warning";
  const resultDate = new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  return <main className="results-bg">
    {result.band === "green" && <div className="confetti" aria-hidden="true">{Array.from({ length: 18 }).map((_, i) => <i key={i} />)}</div>}
    <div className="results-nav"><Logo onClick={home} /><span>Your results</span></div>
    <section className="results-hero container">
      <div><span className="kicker">Checker complete</span><h1>Your AI habits,<br />made clearer.</h1><p>Here is your personal snapshot. Use it as a guide, not a label.</p></div>
      <div className="result-summary"><ScoreRing percent={percent} band={result.band} /><div><span className={`result-badge ${result.band}`}><Icon name={resultIcon} />{result.name}</span><p>{result.message}</p></div></div>
    </section>
    <div className="container results-content">
      <section className="result-card area-card"><div className="card-heading"><div><span className="kicker">Your skill map</span><h2>Score by area</h2></div><span className="small-note">Based on all 23 questions</span></div><div className="area-callouts"><span><Icon name="spark" />Strongest: <b>{strongest.category}</b></span><span><Icon name="compass" />Focus area: <b>{weakest.category}</b></span></div><div className="bars">{areaScores.map((area) => <div className="bar-row" key={area.category}><span>{area.category}</span><div><i style={{ width: `${area.percent}%` }} /></div><b>{area.percent}%</b></div>)}</div></section>
      <section className="result-card review-card"><div className="card-heading"><div><span className="kicker">Learn from it</span><h2>Review what you missed</h2></div><span className="missed-count">{missed.length} to review</span></div>{missed.length === 0 ? <div className="all-correct"><Icon name="check" /><p>You answered every question with the strongest choice.</p></div> : <div className="review-list">{missed.map((q) => <details key={q.id}><summary><span>Q{q.id}</span><b>{q.prompt}</b><Icon name="chevron" /></summary><div><small>Best answer</small><p className="best-answer">{q.answers.find((a) => a.correct)?.text}</p><small>Why it matters</small><p>{q.part === 1 ? q.habitTip : q.explanation}</p></div></details>)}</div>}</section>

      <section className="next-steps-banner"><div><span className="kicker light">What happens next</span><h2>Turn your result into better habits.</h2><p>Work through these five steps now, or return before your next submission.</p></div><div className="next-step-list">{["Priorities", "Pledge", "Checklist", "Declaration", "Share"].map((step, i) => <span key={step}><b>{i + 1}</b>{step}</span>)}</div></section>

      <section id="priorities"><div className="tool-number">Step 1</div><div className="card-heading"><div><span className="kicker">Your 3 priorities</span><h2>Start with your lowest areas</h2></div></div><div className="tip-grid">{lowest.map((area, i) => <article className="tip-card priority-card" key={area.category}><span className="tip-number">0{i + 1}</span><span className="tip-icon"><Icon name={i === 0 ? "shield" : i === 1 ? "brain" : "spark"} /></span><h3>{area.category}</h3><p>{areaTips[area.category]}</p><div className="try-this"><b>Try this on your next assignment</b><span>{practicalActions[area.category]}</span></div>{INSTAGRAM_URL && <a className="post-link" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Read our post <Icon name="external" /></a>}</article>)}</div></section>

      <section className="result-card toolkit-card"><div className="tool-number">Step 2</div><div className="card-heading"><div><span className="kicker">Make a pledge</span><h2>Choose one habit to practise</h2></div></div><div className="pledge-options" role="group" aria-label="Choose your pledge">{pledgeOptions.map((option) => <button key={option} className={pledge === option ? "selected" : ""} onClick={() => setPledge(option)}><span>{pledge === option && <Icon name="check" />}</span>{option}</button>)}</div>{pledge && <div className="pledge-card fade-in"><div className="pledge-brand"><span className="logo-mark"><Icon name="shield" /></span><b>My Prompt Wise pledge</b></div><blockquote>“I will {pledge.toLowerCase()}.”</blockquote><div><span>{result.name}</span><span>{resultDate}</span></div><small>Think Before You Prompt</small></div>}</section>

      <section className="result-card toolkit-card checklist-card"><div className="tool-number">Step 3</div><div className="card-heading"><div><span className="kicker">Before you submit</span><h2>Run a final responsible-AI check</h2></div><Button variant="secondary" onClick={() => window.print()} icon="print">Print / Save as PDF</Button></div><div className="checklist">{checklistItems.map((item, i) => <label key={item}><input type="checkbox" checked={checks[i]} onChange={() => setChecks(checks.map((value, index) => index === i ? !value : value))} /><span className="custom-check">{checks[i] && <Icon name="check" size={16} />}</span><b>{item}</b></label>)}</div><div className={`ready-status ${allChecked ? "ready" : ""}`} role="status"><Icon name={allChecked ? "check" : "clock"} /><div><b>{allChecked ? "Ready to submit" : `${checks.filter(Boolean).length} of 6 checked`}</b><span>{allChecked ? "You completed every check." : "Complete all six before you submit."}</span></div></div></section>

      <section className="result-card toolkit-card"><div className="tool-number">Step 4</div><div className="card-heading"><div><span className="kicker">Declaration helper</span><h2>Edit, copy and follow your university format</h2></div></div><label className="declaration-label" htmlFor="declaration">Your declaration</label><textarea id="declaration" className="declaration-box" value={declaration} onChange={(event) => setDeclaration(event.target.value)} rows={5} /><div className="declaration-actions"><span>Replace the words in brackets before submitting.</span><Button onClick={() => copy(declaration, "declaration")} icon={copied === "declaration" ? "check" : "copy"}>{copied === "declaration" ? "Copied" : "Copy declaration"}</Button></div></section>

      <section className="completion-card"><div><div className="tool-number light-number">Step 5</div><span className="kicker light">Share what you learned</span><h2>{codeRef.current}</h2><p>Save your completion code and invite a friend to check their AI habits.</p></div><div className="completion-actions"><Button variant="secondary" onClick={() => copy(codeRef.current, "code")} icon={copied === "code" ? "check" : "copy"}>{copied === "code" ? "Copied" : "Copy code"}</Button>{GOOGLE_FORM_URL && <Button onClick={() => window.open(GOOGLE_FORM_URL, "_blank", "noopener,noreferrer")} icon="external">Submit your code and feedback</Button>}<Button variant="secondary" onClick={share} icon={copied === "share" ? "check" : "share"}>{copied === "share" ? "Challenge copied" : "Challenge a friend"}</Button></div></section>
      <div className="retake-block"><p>Retake the checker after you have tried your priorities, and see if your score improves.</p><Button variant="ghost" onClick={restart} icon="refresh">Try again</Button></div>
      <p className="privacy-note"><Icon name="lock" />No names. No login. Your quiz answers are not stored.</p>
    </div>
  </main>;
}

function About({ start }: { start: () => void }) {
  const bands = [
    ["green", "Responsible AI use", "80% and above", "Strong responsible-use habits across the checker."],
    ["amber", "AI use needs improvement", "50 to 79%", "Some habits are working, with clear areas to strengthen."],
    ["red", "High academic-integrity risk", "Below 50%", "Pause, review the guidance and improve the work before submitting."],
  ];
  return <main className="about-page"><section className="about-hero"><div className="container"><span className="eyebrow"><span /> About the campaign</span><h1>Better AI habits support better learning.</h1><p>Prompt Wise is a social impact learning tool for university students in Malaysia. It helps students pause, think and make responsible choices when using AI.</p></div></section>
    <section className="section container about-grid"><div><span className="sdg-badge">4 <small>QUALITY<br />EDUCATION</small></span></div><div><span className="kicker">UN Sustainable Development Goal 4</span><h2>Quality education for everyone</h2><p>SDG 4 aims to ensure inclusive and equitable quality education and promote lifelong learning opportunities for all. Responsible AI literacy is part of being ready to learn, work and participate thoughtfully in a changing world.</p><p>This campaign gives students a practical way to reflect, learn and take action without banning useful technology or treating AI use as automatically wrong.</p><Button onClick={start} icon="arrow">Start the checker</Button></div></section>
    <section className="section about-details"><div className="container"><div className="section-heading"><span className="kicker">How scoring works</span><h2>Clear rules. No hidden judgement.</h2><p>Part 1 awards 1 point for Yes, 0.5 for Sometimes and 0 for No. In Parts 2 and 3, each correct answer earns the points shown and a wrong answer earns 0. Your percentage is your points divided by the maximum points.</p></div><div className="band-grid">{bands.map(([colour, name, range, description]) => <article key={name}><span className={`band-dot ${colour}`} /><small>{range}</small><h3>{name}</h3><p>{description}</p></article>)}</div></div></section>
    <section className="section container limits-grid"><article><span className="learning-icon"><Icon name="compass" /></span><h2>What this tool can and cannot do</h2><p>Prompt Wise supports self-reflection. It is not a detector, not an official judgement and not evidence that misconduct has or has not happened. Assignment rules and lecturer guidance always come first.</p></article><article><span className="learning-icon"><Icon name="lock" /></span><h2>Your privacy</h2><p>No names, accounts or quiz answers are stored. Everything is calculated in your browser.</p></article></section>
    <section className="container team-card"><div><span className="kicker">The project team</span><h2>{TEAM_NAME}</h2><p>A social impact campaign supporting responsible AI literacy.</p></div><div><h3>Note for educators</h3><p>This is a learning aid for opening constructive conversations about responsible AI use. It should not be used to investigate or determine academic misconduct.</p></div></section>
  </main>;
}

function Footer() {
  return <footer><div className="container footer-grid"><div><div className="footer-brand"><span className="logo-mark"><Icon name="shield" size={23} /></span><div><b>Prompt Wise</b><small>Think Before You Prompt</small></div></div><p>A learning tool, not a detector.<br />No names, no login.</p></div><div className="footer-sdg"><span className="sdg-small">4</span><p>Supporting<br /><b>Quality Education</b></p></div><div className="footer-note"><Icon name="lock" /><span>Your answers are processed only in your browser.</span></div></div><div className="container footer-bottom"><span>{TEAM_NAME} · Built for Malaysian university students.</span>{INSTAGRAM_URL && <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Follow the campaign on Instagram <Icon name="external" size={14} /></a>}</div></footer>;
}

function shuffleQuestions() {
  return questions.map((q) => q.part === 1 ? q : { ...q, answers: [...q.answers].sort(() => Math.random() - 0.5) });
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [dark, setDark] = useState(false);
  const [ordered, setOrdered] = useState<Question[]>(() => shuffleQuestions());
  const [responses, setResponses] = useState<Record<number, Response>>({});
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  const go = (next: Page) => {
    if (next === "quiz") {
      setOrdered(shuffleQuestions());
      setResponses({});
    }
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const finish = (answers: Record<number, Response>) => {
    setResponses(answers);
    setPage("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goSection = (id: string) => {
    setPage("home");
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 0);
  };
  const standardPage = page === "home" || page === "about";
  return <div className="app">
    {standardPage && <Header go={go} goSection={goSection} dark={dark} setDark={setDark} />}
    {page === "home" && <Home start={() => go("quiz")} about={() => go("about")} />}
    {page === "about" && <About start={() => go("quiz")} />}
    {page === "quiz" && <Quiz ordered={ordered} onFinish={finish} exit={() => setPage("home")} />}
    {page === "results" && <Results responses={responses} restart={() => go("quiz")} home={() => go("home")} />}
    {standardPage && <Footer />}
  </div>;
}
