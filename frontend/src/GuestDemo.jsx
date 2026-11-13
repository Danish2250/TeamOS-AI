import { useState } from 'react';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, Bot, LogOut, Sparkles, CalendarDays, LockKeyhole } from 'lucide-react';

const demoProjects = [
  { name: 'Career Management Platform', status: 'In progress', progress: 72, tasks: 11 },
  { name: 'Website Redesign', status: 'In progress', progress: 48, tasks: 8 },
  { name: 'Mobile App Launch', status: 'Planning', progress: 20, tasks: 5 }
];

const demoTasks = [
  { title: 'Finalize dashboard wireframes', project: 'Career Management Platform', priority: 'high', status: 'in-progress', due: 'Today' },
  { title: 'Review API integration', project: 'Website Redesign', priority: 'medium', status: 'todo', due: 'Tomorrow' },
  { title: 'Prepare launch checklist', project: 'Mobile App Launch', priority: 'high', status: 'todo', due: 'Nov 18' },
  { title: 'Write onboarding documentation', project: 'Career Management Platform', priority: 'low', status: 'done', due: 'Completed' }
];

export default function GuestDemo({ onExit }) {
  const [tab, setTab] = useState('Overview');
  const [showInfo, setShowInfo] = useState(false);
  const nav = [
    ['Overview', LayoutDashboard],
    ['Projects', FolderKanban],
    ['Tasks', CheckSquare],
    ['Team', Users],
    ['AI Assistant', Bot]
  ];

  return (
    <div className="app-shell guest-shell">
      <aside className="sidebar premium-sidebar">
        <div className="brand premium-brand"><div className="brand-mark small">T</div><span>team<span className="accent">OS</span><sup>AI</sup></span></div>
        <div className="workspace-switcher"><div className="workspace-switcher-icon"><Sparkles size={16}/></div><div><small>PUBLIC PREVIEW</small><b>Demo workspace</b></div></div>
        <p className="nav-label">EXPLORE</p>
        <nav>{nav.map(([name, Icon]) => <button key={name} className={`premium-nav-item ${tab === name ? 'active' : ''}`} onClick={() => setTab(name)}><Icon size={18}/>{name}{name === 'AI Assistant' && <span className="nav-badge">AI</span>}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="user-card"><div className="avatar">G</div><div><b>Guest visitor</b><small>Read-only demo</small></div></div>
          <button className="logout" onClick={onExit}><LogOut size={17}/> Exit demo</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar premium-topbar">
          <div><div className="breadcrumb"><span>TEAM OS</span><span> / </span><span>PUBLIC DEMO</span></div><h1>{tab}</h1></div>
          <div className="top-actions"><div className="topbar-date"><CalendarDays size={15}/> Sample workspace</div><span className="nav-badge">GUEST MODE</span></div>
        </header>
        <div className="content">
          <section className="dashboard-hero guest-banner">
            <div className="dashboard-hero-copy"><div className="hero-kicker"><span className="live-pulse"/> INTERACTIVE PRODUCT TOUR</div><h2>See your team's work<br/><span>come together.</span></h2><p>Explore sample projects, tasks, team collaboration and the AI assistant. This demo uses sample data only.</p></div>
            <div className="hero-orbit" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core"><div className="orbit-core-inner"><Sparkles size={29}/></div></div></div>
          </section>
          {tab === 'Overview' && <><div className="metric-strip">
            <div className="metric-card metric-primary"><div className="metric-topline">01 / WORKLOAD</div><div className="metric-value">24</div><div className="metric-label">Total tasks <span>Across sample projects</span></div></div>
            <div className="metric-card"><div className="metric-topline">02 / COMPLETION</div><div className="metric-value">09</div><div className="metric-label">Completed <span>Work delivered</span></div></div>
            <div className="metric-card"><div className="metric-topline">03 / IN MOTION</div><div className="metric-value">11</div><div className="metric-label">In progress <span>Moving forward</span></div></div>
            <div className="metric-card"><div className="metric-topline">04 / COLLABORATION</div><div className="metric-value">06</div><div className="metric-label">Team members <span>Working together</span></div></div>
          </div><section className="panel"><div className="panel-head"><div><p className="eyebrow">WORKSPACE SNAPSHOT</p><h2>Active projects</h2></div><button className="secondary" onClick={()=>setTab('Projects')}>View all</button></div><div className="guest-project-grid">{demoProjects.map(p=><article className="guest-project" key={p.name}><span className="eyebrow">{p.status}</span><h3>{p.name}</h3><div className="project-progress-label"><span>{p.tasks} tasks</span><b>{p.progress}%</b></div><div className="project-progress-track"><div className="project-progress-fill" style={{width:p.progress+'%'}}/></div></article>)}</div></section></>}
          {tab === 'Projects' && <section className="panel"><p className="eyebrow">SAMPLE PORTFOLIO</p><h2>Projects</h2><div className="guest-project-grid">{demoProjects.map(p=><article className="guest-project" key={p.name}><span className="eyebrow">{p.status}</span><h3>{p.name}</h3><p className="muted">{p.tasks} tasks in this project</p><div className="project-progress-label"><span>Completion</span><b>{p.progress}%</b></div><div className="project-progress-track"><div className="project-progress-fill" style={{width:p.progress+'%'}}/></div></article>)}</div></section>}
          {tab === 'Tasks' && <section className="panel"><p className="eyebrow">TEAM EXECUTION</p><h2>Task board</h2><div className="task-list">{demoTasks.map(t=><div className="task-row guest-task" key={t.title}><div className="task-info"><b>{t.title}</b><small>{t.project}</small><small>Due: {t.due}</small></div><span className={`priority ${t.priority}`}>{t.priority}</span><span className="guest-status">{t.status.replace('-', ' ')}</span></div>)}</div></section>}
          {tab === 'Team' && <section className="panel"><p className="eyebrow">PEOPLE & COLLABORATION</p><h2>Meet the team</h2><div className="guest-project-grid">{[['AM','Aarav Mehta','Product Lead'],['SK','Sara Khan','Frontend Developer'],['RV','Rohan Verma','Backend Developer'],['NP','Nina Patel','UI/UX Designer']].map(m=><article className="guest-project guest-person" key={m[1]}><div className="avatar">{m[0]}</div><h3>{m[1]}</h3><p className="muted">{m[2]}</p></article>)}</div></section>}
          {tab === 'AI Assistant' && <section className="panel guest-ai"><div className="ai-avatar"><Sparkles size={24}/></div><p className="eyebrow">GEMINI-POWERED WORKSPACE ASSISTANT</p><h2>Meet your AI teammate.</h2><p className="muted">In the live workspace, TeamOS AI can help summarize tasks, plan projects and answer questions using workspace context.</p><div className="suggestion-list">{['Summarize project progress','What should the team focus on next?','Create a project execution plan'].map(s=><button className="suggestion" key={s} onClick={()=>setShowInfo(true)}>{s}</button>)}</div>{showInfo && <p className="muted">AI chat is available after signing in to a workspace. This public preview does not send requests or access private data.</p>}</section>}
          <div className="guest-notice"><LockKeyhole size={16}/><span>Public read-only preview · Sample data only · No account or password needed</span></div>
        </div>
      </main>
    </div>
  );
}
