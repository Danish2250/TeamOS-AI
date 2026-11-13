import { useMemo, useState } from 'react';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Bot, LogOut,
  Sparkles, CalendarDays, LockKeyhole, ChevronRight, Activity,
  ArrowUpRight, Plus, Search, Bell, CirclePlus
} from 'lucide-react';

const demoProjects = [
  { id: 'p1', name: 'Career Management Platform', status: 'In progress', progress: 72, tasks: 11, completed: 8 },
  { id: 'p2', name: 'Website Redesign', status: 'In progress', progress: 48, tasks: 8, completed: 4 },
  { id: 'p3', name: 'Mobile App Launch', status: 'Planning', progress: 20, tasks: 5, completed: 1 }
];

const demoTasks = [
  { id: 't1', title: 'Finalize dashboard wireframes', project: 'Career Management Platform', priority: 'high', status: 'in-progress', due: 'Today', assignee: 'Aarav Mehta' },
  { id: 't2', title: 'Review API integration', project: 'Website Redesign', priority: 'medium', status: 'todo', due: 'Tomorrow', assignee: 'Rohan Verma' },
  { id: 't3', title: 'Prepare launch checklist', project: 'Mobile App Launch', priority: 'high', status: 'todo', due: 'Nov 18', assignee: 'Sara Khan' },
  { id: 't4', title: 'Write onboarding documentation', project: 'Career Management Platform', priority: 'low', status: 'done', due: 'Completed', assignee: 'Nina Patel' },
  { id: 't5', title: 'Build responsive project cards', project: 'Website Redesign', priority: 'medium', status: 'in-progress', due: 'Nov 19', assignee: 'Sara Khan' },
  { id: 't6', title: 'Create user profile screens', project: 'Career Management Platform', priority: 'high', status: 'done', due: 'Completed', assignee: 'Aarav Mehta' }
];

const demoMembers = [
  ['AM', 'Aarav Mehta', 'Product Lead'],
  ['SK', 'Sara Khan', 'Frontend Developer'],
  ['RV', 'Rohan Verma', 'Backend Developer'],
  ['NP', 'Nina Patel', 'UI/UX Designer']
];

export default function GuestDemo({ onExit }) {
  const [tab, setTab] = useState('Overview');
  const [search, setSearch] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState({});
  const [selectedProject, setSelectedProject] = useState('all');

  const tasks = useMemo(() => demoTasks.map(task => ({
    ...task,
    status: taskStatuses[task.id] || task.status
  })), [taskStatuses]);
  const filteredTasks = tasks.filter(task =>
    `${task.title} ${task.project} ${task.assignee}`.toLowerCase().includes(search.toLowerCase())
    && (selectedProject === 'all' || demoProjects.find(p => p.name === task.project)?.id === selectedProject)
  );
  const stats = {
    total: 24,
    done: 9,
    progress: 11
  };
  const nav = [
    ['Overview', LayoutDashboard], ['Projects', FolderKanban],
    ['Tasks', CheckSquare], ['Team', Users], ['AI Assistant', Bot]
  ];
  const askDemoAI = value => {
    const prompt = (value || question).trim();
    if (!prompt) return;
    setChat(old => [...old, { role: 'user', text: prompt }, {
      role: 'ai',
      text: 'This is a public product preview. In a signed-in workspace, TeamOS AI uses Gemini to answer questions with your workspace context. The demo keeps your information private and does not send this message to an AI service.'
    }]);
    setQuestion('');
  };

  return (
    <div className="app-shell guest-shell">
      <aside className="sidebar premium-sidebar">
        <div className="brand premium-brand"><div className="brand-mark small">T</div><span>team<span className="accent">OS</span><sup>AI</sup></span></div>
        <div className="workspace-switcher"><div className="workspace-switcher-icon"><Sparkles size={16}/></div><div><small>PUBLIC PREVIEW</small><b>Demo workspace</b></div><ChevronRight size={15}/></div>
        <p className="nav-label">EXPLORE</p>
        <nav>{nav.map(([name, Icon]) => <button key={name} className={`premium-nav-item ${tab === name ? 'active' : ''}`} onClick={() => setTab(name)}><Icon size={18}/>{name}{name === 'AI Assistant' && <span className="nav-badge">AI</span>}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="user-card"><div className="avatar">G</div><div><b>Guest visitor</b><small>Read-only demo</small></div></div>
          <button className="logout" onClick={onExit}><LogOut size={17}/> Exit demo</button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar premium-topbar">
          <div><div className="breadcrumb"><span>TEAM OS</span><ChevronRight size={12}/><span>PUBLIC DEMO</span></div><h1>{tab}</h1></div>
          <div className="top-actions">
            <div className="topbar-date"><CalendarDays size={15}/> <span>Sample workspace</span></div>
            <div className="search-box premium-search"><Search size={16}/><input placeholder="Search sample tasks..." value={search} onChange={e => setSearch(e.target.value)}/></div>
            <span className="nav-badge">GUEST MODE</span>
          </div>
        </header>

        <div className="content">
          {tab === 'Overview' && <div className="executive-dashboard">
            <section className="dashboard-hero">
              <div className="dashboard-hero-copy">
                <div className="hero-kicker"><span className="live-pulse"/> YOUR PRODUCTIVITY OVERVIEW</div>
                <h2>Make space for<br/><span>meaningful work.</span></h2>
                <p>Welcome to the TeamOS AI demo workspace. Explore how a team plans projects, tracks tasks and works with AI.</p>
                <div className="hero-actions">
                  <button className="primary hero-primary" onClick={() => setTab('Tasks')}><CirclePlus size={17}/> Explore tasks <ChevronRight size={15}/></button>
                  <button className="hero-secondary" onClick={() => setTab('Projects')}>Explore projects <ArrowUpRight size={15}/></button>
                </div>
              </div>
              <div className="hero-orbit" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core"><div className="orbit-core-inner"><Sparkles size={29}/></div></div><div className="orbit-caption"><span>TEAMOS</span><b>WORKSPACE</b></div></div>
              <div className="hero-bottom-line"><span>WORKSPACE STATUS</span><b><i/> ALL SYSTEMS READY</b><span className="hero-bottom-right">YOUR TEAM. IN SYNC.</span></div>
            </section>

            <section className="metric-strip">
              <div className="metric-card metric-primary"><div className="metric-topline"><span>01 / WORKLOAD</span><CheckSquare size={18}/></div><div className="metric-value">{String(stats.total).padStart(2,'0')}</div><div className="metric-label">Total tasks <span>Across your workspace</span></div><div className="metric-decoration metric-bars"><i/><i/><i/><i/><i/><i/><i/><i/></div></div>
              <div className="metric-card"><div className="metric-topline"><span>02 / COMPLETION</span><Sparkles size={18}/></div><div className="metric-value">{String(stats.done).padStart(2,'0')}</div><div className="metric-label">Completed <span>Work delivered</span></div><div className="metric-bottom"><div className="mini-progress"><i style={{width:`${stats.done / stats.total * 100}%`}}/></div><small>{Math.round(stats.done / stats.total * 100)}%</small></div></div>
              <div className="metric-card"><div className="metric-topline"><span>03 / ACTIVE</span><Activity size={18}/></div><div className="metric-value">{String(stats.progress).padStart(2,'0')}</div><div className="metric-label">In progress <span>Currently moving</span></div><div className="metric-status"><i/> LIVE WORKFLOW</div></div>
              <div className="metric-card"><div className="metric-topline"><span>04 / PORTFOLIO</span><FolderKanban size={18}/></div><div className="metric-value">03</div><div className="metric-label">Projects <span>Ideas in motion</span></div><button className="metric-link" onClick={() => setTab('Projects')}>View portfolio <ArrowUpRight size={14}/></button></div>
            </section>

            <section className="dashboard-lower-grid">
              <div className="dashboard-module activity-module">
                <div className="module-heading"><div><span className="module-index">01 — ACTIVITY</span><h2>Recent work</h2><p>Latest tasks in this sample workspace.</p></div><button className="module-link" onClick={() => setTab('Tasks')}>All tasks <ArrowUpRight size={15}/></button></div>
                <div className="task-list">{filteredTasks.slice(0,5).map(task => <div className="task-row" key={task.id}><div className="task-info"><b>{task.title}</b><small>{task.project}</small><small>Assigned to: {task.assignee}</small></div><span className={`priority ${task.priority}`}>{task.priority}</span><span className="guest-status">{task.status.replace('-', ' ')}</span></div>)}</div>
              </div>
              <div className="dashboard-module projects-module">
                <div className="module-heading"><div><span className="module-index">02 — PORTFOLIO</span><h2>Projects</h2><p>What this team is building.</p></div><button className="round-arrow" onClick={() => setTab('Projects')} aria-label="View projects"><ArrowUpRight size={17}/></button></div>
                <div className="premium-project-list">{demoProjects.map((project,index) => <button className="premium-project-row" key={project.id} onClick={() => {setSelectedProject(project.id);setTab('Tasks');}}><span className={`project-number project-number-${index % 4}`}>0{index+1}</span><span className="premium-project-name"><b>{project.name}</b><small>{project.tasks} tasks · {project.completed} completed</small></span><span className="project-ring" style={{'--progress':`${project.progress * 3.6}deg`}}><b>{project.progress}%</b></span><ChevronRight size={15}/></button>)}</div>
                <button className="new-project-link" onClick={() => setTab('Projects')}><Plus size={15}/> Explore all projects</button>
              </div>
            </section>
          </div>}

          {tab === 'Projects' && <section className="panel"><div className="panel-head"><div><h2>Projects</h2><p className="muted">Organize your team's work.</p></div><span className="count">03</span></div><div className="project-grid">{demoProjects.map(project => <article className="project-card" key={project.id}><div className="project-icon"><FolderKanban size={20}/></div><h3>{project.name}</h3><p className="muted">{project.tasks} tasks</p><div className="project-progress"><div className="project-progress-label"><span>Progress</span><strong>{project.progress}%</strong></div><div className="project-progress-track"><div className="project-progress-fill" style={{width:`${project.progress}%`}}/></div><small>{project.completed} of {project.tasks} tasks completed</small></div><button className="text-btn" onClick={() => {setSelectedProject(project.id);setTab('Tasks');}}>View tasks</button></article>)}</div></section>}

          {tab === 'Tasks' && <section className="panel"><div className="panel-head"><div><h2>Tasks</h2><p className="muted">Sample team execution board. Change a task status to try the controls.</p></div><span className="count">{filteredTasks.length}</span></div><div className="inline-form"><label>Project</label><select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}><option value="all">All projects</option>{demoProjects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select><button className="secondary" onClick={() => setSelectedProject('all')}>Clear filter</button></div><div className="task-list">{filteredTasks.map(task => <div className="task-row" key={task.id}><div className="task-info"><b>{task.title}</b><small>{task.project}</small><small>Assigned to: {task.assignee} · Due: {task.due}</small></div><span className={`priority ${task.priority}`}>{task.priority}</span><select aria-label={`Demo status for ${task.title}`} value={task.status} onChange={e => setTaskStatuses(old => ({...old,[task.id]:e.target.value}))}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option></select></div>)}</div></section>}

          {tab === 'Team' && <section className="panel"><div className="panel-head"><div><p className="eyebrow">PEOPLE & COLLABORATION</p><h2>Team Members</h2><p className="muted">Meet the people behind this sample workspace.</p></div><span className="count">04</span></div><div className="project-grid">{demoMembers.map(member => <article className="project-card guest-person" key={member[1]}><div className="avatar">{member[0]}</div><h3>{member[1]}</h3><p className="muted">{member[2]}</p></article>)}</div></section>}

          {tab === 'AI Assistant' && <div className="ai-layout"><section className="panel generator-panel"><div className="panel-head"><div><p className="eyebrow">AI PRODUCTIVITY TOOL</p><h2><Sparkles size={20}/> AI Task Generator</h2><p className="muted">Preview how AI-assisted planning fits into the workspace.</p></div><span className="nav-badge">AI</span></div><p className="muted">In a signed-in workspace, Gemini can generate task suggestions from a project brief. Public demo actions are simulated and never access private workspace data.</p><button className="primary" onClick={() => setShowInfo(true)}><Sparkles size={16}/> Preview AI task generation</button>{showInfo && <div className="generated-section"><h3>Sample AI task suggestions</h3>{['Define project milestones','Create frontend implementation tasks','Plan API integration and testing'].map((item,index)=><div className="generated-task" key={item}><b>{index+1}. {item}</b><p className="muted">Sample suggestion · Not saved to any workspace</p></div>)}</div>}</section><section className="panel chat-panel"><div className="panel-head"><div><h2><Bot size={20}/> TeamOS AI Assistant</h2><p className="muted">Try a sample workspace question.</p></div><span className="online-dot">Demo</span></div><div className="chat-messages">{chat.length === 0 && <div className="chat-empty"><div className="ai-avatar"><Sparkles size={24}/></div><h3>How can I help you today?</h3><p className="muted">Ask about the sample projects and tasks.</p><div className="suggestion-list">{['Summarize project progress','What should the team focus on next?','Create a project execution plan'].map(item=><button className="suggestion" key={item} onClick={() => askDemoAI(item)}>{item}</button>)}</div></div>}{chat.map((message,index)=><div className={`chat-message ${message.role === 'user' ? 'user-message' : 'ai-message'}`} key={index}><div className="message-avatar">{message.role === 'user' ? 'G' : <Bot size={17}/>}</div><div className="message-content"><b>{message.role === 'user' ? 'You' : 'TeamOS AI Demo'}</b><p>{message.text}</p></div></div>)}</div><form className="chat-input" onSubmit={e => {e.preventDefault();askDemoAI();}}><input placeholder="Ask about sample workspace..." value={question} onChange={e => setQuestion(e.target.value)}/><button className="primary" type="submit" disabled={!question.trim()}>Ask AI</button></form></section></div>}

          <div className="guest-notice"><LockKeyhole size={16}/><span>Public read-only preview · Sample data only · Changes stay in this demo · No account or password needed</span></div>
        </div>
      </main>
    </div>
  );
}
