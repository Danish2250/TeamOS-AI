import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Bot,
  Users,
  LogOut,
  Plus,
  Search,
  Bell,
  Sparkles,
  Trash2,
  ArrowUpRight,
  Pencil,
  Save,
  X,
  ChevronRight,
  CalendarDays,
  Activity,
  CirclePlus
} from 'lucide-react';
import api from './api';
import GuestDemo from './GuestDemo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const socket = io(API_URL, {
  autoConnect: false
});

const initialAuth = {
  name: '',
  email: '',
  password: ''
};

function Auth({ onAuth, onGuest }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialAuth);
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    setError('');

    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      localStorage.setItem('teamos_token', data.token);
      onAuth(data.user);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to connect to server.'
      );
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand-mark">T</div>
        <p className="eyebrow">YOUR TEAM, IN SYNC</p>

        <h1>
          {mode === 'login'
            ? 'Welcome back'
            : 'Create your workspace account'}
        </h1>

        <p className="muted">
          Sign in to your TeamOS AI workspace.
        </p>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <input
              placeholder="Full name"
              value={form.name}
              onChange={e =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={e =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <input
            type="password"
            placeholder="Password (min. 8 characters)"
            value={form.password}
            onChange={e =>
              setForm({ ...form, password: e.target.value })
            }
            minLength="8"
            required
          />

          {error && <div className="error">{error}</div>}

          <button className="primary full">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {mode === 'login' && (
          <button className="secondary full guest-entry" type="button" onClick={onGuest}>
            Explore demo — no password
          </button>
        )}

        <p className="switch">
          {mode === 'login'
            ? 'New to TeamOS? '
            : 'Already have an account? '}

          <button
            className="link"
            type="button"
            onClick={() =>
              setMode(mode === 'login' ? 'register' : 'login')
            }
          >
            {mode === 'login' ? 'Create account' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [tab, setTab] = useState('Overview');

  const [projectName, setProjectName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [priority, setPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');

  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [busy, setBusy] = useState(false);

  // AI task generator state
  const [generatorPrompt, setGeneratorPrompt] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [savingGenerated, setSavingGenerated] = useState(false);
  const [generatorCount, setGeneratorCount] = useState(5);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterDeadline, setFilterDeadline] = useState('all');
  const [notice, setNotice] = useState('');

  const isWorkspaceOwner = Boolean(
    user && members.length > 0 &&
    String(members[0]._id) === String(user.id || user._id)
  );

  const load = async () => {
    const [p, t] = await Promise.all([
      api.get('/projects'),
      api.get('/tasks')
    ]);

    setProjects(p.data);
    setTasks(t.data);

    // Load team members separately so a missing team route does not
    // prevent the existing dashboard, projects, and tasks from loading.
    try {
      const { data } = await api.get('/tasks/members');
      const memberList = Array.isArray(data)
        ? data
        : data.members || [];
      setMembers(memberList);
    } catch (error) {
      console.error('Could not load team members:', error);
      setMembers([]);
    }

    if (!selectedProject && p.data[0]) {
      setSelectedProject(p.data[0]._id);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('teamos_token');

    if (!token) return;

    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('teamos_token'));
  }, []);

  useEffect(() => {
    if (user) {
      load().catch(() =>
        setNotice('Could not load workspace data.')
      );
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    socket.connect();
    socket.emit('join-user', user.id);

    socket.on('task-created', task =>
      setTasks(old => [
        task,
        ...old.filter(t => t._id !== task._id)
      ])
    );

    socket.on('task-updated', task =>
      setTasks(old =>
        old.map(t => t._id === task._id ? task : t)
      )
    );

    return () => {
      socket.off('task-created');
      socket.off('task-updated');
      socket.disconnect();
    };
  }, [user]);

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    progress: tasks.filter(t => t.status === 'in-progress').length,
    todo: tasks.filter(t => t.status === 'todo').length
  }), [tasks]);

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  const visibleTasks = tasks.filter(task => {
    const projectId = task.project?._id || task.project || '';
    const deadline = task.dueDate ? String(task.dueDate).slice(0, 10) : '';
    const searchText = `${task.title || ''} ${task.description || ''} ${task.project?.name || ''}`.toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase().trim());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesProject = filterProject === 'all' || projectId === filterProject;

    let matchesDeadline = true;
    if (filterDeadline === 'overdue') {
      matchesDeadline = Boolean(deadline && deadline < todayString && task.status !== 'done');
    } else if (filterDeadline === 'upcoming') {
      matchesDeadline = Boolean(deadline && deadline >= todayString && task.status !== 'done');
    } else if (filterDeadline === 'no-deadline') {
      matchesDeadline = !deadline;
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesDeadline;
  });

  const resetTaskFilters = () => {
    setSearch('');
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterProject('all');
    setFilterDeadline('all');
  };

  const logout = () => {
    localStorage.removeItem('teamos_token');
    setUser(null);
    setProjects([]);
    setTasks([]);
    setChatHistory([]);
    setQuestion('');
  };

  const addProject = async e => {
    e.preventDefault();

    if (!projectName.trim()) return;

    try {
      const { data } = await api.post('/projects', {
        name: projectName
      });

      setProjects(old => [data, ...old]);
      setSelectedProject(data._id);
      setProjectName('');
      setNotice('Project created.');
    } catch {
      setNotice('Could not create project.');
    }
  };

  const addMember = async e => {
    e.preventDefault();

    const email = memberEmail.trim().toLowerCase();
    if (!email) return;

    setAddingMember(true);

    try {
      const { data } = await api.post('/tasks/members', { email });
      const updatedMembers = data.members || data.teamMembers || [];
      setMembers(updatedMembers);
      setMemberEmail('');
      setNotice(data.message || 'Team member added successfully.');

      // Refresh the member list in case the API returns only a message.
      try {
        const response = await api.get('/tasks/members');
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.members || [];
        setMembers(list);
      } catch {
        // Keep the list returned by the add-member endpoint.
      }
    } catch (error) {
      setNotice(
        error.response?.data?.message ||
        'Could not add team member. Check that the backend team route is running.'
      );
    } finally {
      setAddingMember(false);
    }
  };

  const addTask = async e => {
    e.preventDefault();

    if (!taskTitle.trim() || !selectedProject) return;

    try {
      const { data } = await api.post('/tasks', {
        title: taskTitle,
        project: selectedProject,
        priority,
        dueDate: taskDueDate || null,
        assignee: taskAssignee || null
      });

      setTasks(old => [data, ...old]);
      setTaskTitle('');
      setTaskDueDate('');
      setTaskAssignee('');
      setNotice('Task added.');
    } catch {
      setNotice('Could not add task.');
    }
  };

  const updateTask = async (id, changes) => {
    try {
      const updates = typeof changes === 'string'
        ? { status: changes }
        : changes;
      const { data } = await api.patch(`/tasks/${id}`, updates);

      setTasks(old =>
        old.map(t => t._id === id ? data : t)
      );
      return true;
    } catch {
      setNotice('Could not update task.');
      return false;
    }
  };

  const deleteTask = async id => {
    try {
      await api.delete(`/tasks/${id}`);

      setTasks(old =>
        old.filter(t => t._id !== id)
      );
    } catch {
      setNotice('Could not delete task.');
    }
  };

  // Generate task suggestions using Gemini or the local fallback.
  const generateTasks = async e => {
    e.preventDefault();

    if (!generatorPrompt.trim()) {
      setNotice('Describe what tasks you want to generate.');
      return;
    }

    if (!selectedProject) {
      setNotice('Create a project or select a project before generating tasks.');
      return;
    }

    setGenerating(true);
    setGeneratedTasks([]);

    try {
      const { data } = await api.post('/ai/generate-tasks', {
        prompt: generatorPrompt.trim(),
        count: Number(generatorCount),
        projectId: selectedProject
      });

      setGeneratedTasks(data.tasks || []);
      setNotice(data.message || 'Task suggestions generated.');
    } catch (error) {
      setNotice(
        error.response?.data?.message ||
        'Could not generate tasks. Check your backend.'
      );
    } finally {
      setGenerating(false);
    }
  };

  // Save reviewed AI-generated tasks to MongoDB.
  const saveGeneratedTasks = async () => {
    if (!generatedTasks.length || !selectedProject) return;

    setSavingGenerated(true);

    try {
      const { data } = await api.post('/tasks/bulk', {
        project: selectedProject,
        tasks: generatedTasks
      });

      setTasks(old => [
        ...(data.tasks || []).filter(
          task => !old.some(existing => existing._id === task._id)
        ),
        ...old
      ]);

      setGeneratedTasks([]);
      setGeneratorPrompt('');
      setNotice(data.message || 'Generated tasks saved successfully.');
    } catch (error) {
      setNotice(
        error.response?.data?.message ||
        'Could not save generated tasks.'
      );
    } finally {
      setSavingGenerated(false);
    }
  };  // Ask TeamOS AI a question.
  const askAI = async e => {
    e.preventDefault();

    const currentQuestion = question.trim();

    if (!currentQuestion || busy) return;

    setQuestion('');
    setBusy(true);

    const previousHistory = chatHistory;

    setChatHistory(old => [
      ...old,
      { role: 'user', text: currentQuestion }
    ]);

    try {
      const { data } = await api.post('/ai/ask', {
        question: currentQuestion,
        history: previousHistory
      });

      setChatHistory(old => [
        ...old,
        { role: 'model', text: data.answer }
      ]);
    } catch (error) {
      setChatHistory(old => [
        ...old,
        {
          role: 'model',
          text: error.response?.data?.message ||
            'AI is temporarily unavailable. Please try again.'
        }
      ]);
    } finally {
      setBusy(false);
    }
  };

  if (guestMode) return <GuestDemo onExit={() => setGuestMode(false)} />;

  if (!user) {
    return <Auth onAuth={setUser} onGuest={() => setGuestMode(true)} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar premium-sidebar">
        <div className="brand premium-brand">
          <div className="brand-mark small">T</div>
          <span>team<span className="accent">OS</span><sup>AI</sup></span>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-switcher-icon"><Activity size={16} /></div>
          <div><small>WORKSPACE</small><b>My workspace</b></div>
          <ChevronRight size={15} />
        </div>
        <p className="nav-label">YOUR SPACE</p>

        <nav>
          {[
            { name: 'Overview', icon: <LayoutDashboard size={18} /> },
            { name: 'Projects', icon: <FolderKanban size={18} /> },
            { name: 'Tasks', icon: <CheckSquare size={18} /> },
            { name: 'Team', icon: <Users size={18} /> },
            { name: 'AI Assistant', icon: <Bot size={18} /> }
          ].map(item => (
            <button
              key={item.name}
              className={`premium-nav-item ${tab === item.name ? 'active' : ''}`}
              onClick={() => setTab(item.name)}
            >
              {item.icon}
              {item.name}
              {item.name === 'AI Assistant' && (
                <span className="nav-badge">AI</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="avatar">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <b>{user.name}</b>
              <small>{user.email}</small>
            </div>
          </div>

          <button className="logout" onClick={logout}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar premium-topbar">
          <div>
            <div className="breadcrumb"><span>TEAM OS</span><ChevronRight size={12} /><span>{tab.toUpperCase()}</span></div>
            <h1>{tab}</h1>
          </div>

          <div className="top-actions">
            <div className="topbar-date"><CalendarDays size={15} /> <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span></div>
            <div className="search-box premium-search">
              <Search size={16} />
              <input
                placeholder="Search tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <button className="icon-btn" title="Notifications">
              <Bell size={18} />
            </button>

            <div className="top-avatar premium-top-avatar" title={user.name}>
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {notice && (
          <div className="notice">
            {notice}
            <button onClick={() => setNotice('')}>×</button>
          </div>
        )}

        <div className="content">

          {/* OVERVIEW — redesigned executive workspace */}
          {tab === 'Overview' && (
            <div className="executive-dashboard">
              <section className="dashboard-hero">
                <div className="dashboard-hero-copy">
                  <div className="hero-kicker"><span className="live-pulse" /> YOUR PRODUCTIVITY OVERVIEW</div>
                  <h2>Make space for<br /><span>meaningful work.</span></h2>
                  <p>Good to see you, {user.name?.split(' ')[0] || 'there'}. Here's your workspace at a glance.</p>
                  <div className="hero-actions">
                    {isWorkspaceOwner && <button className="primary hero-primary" onClick={() => setTab('Tasks')}><CirclePlus size={17} /> Create a task <ChevronRight size={15} /></button>}
                    <button className="hero-secondary" onClick={() => setTab('Projects')}>Explore projects <ArrowUpRight size={15} /></button>
                  </div>
                </div>
                <div className="hero-orbit" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="orbit-core"><div className="orbit-core-inner"><Sparkles size={29} /></div></div>
                  <div className="orbit-caption"><span>TEAMOS</span><b>WORKSPACE</b></div>
                </div>
                <div className="hero-bottom-line"><span>WORKSPACE STATUS</span><b><i /> ALL SYSTEMS READY</b><span className="hero-bottom-right">YOUR TEAM. IN SYNC.</span></div>
              </section>

              <section className="metric-strip">
                <div className="metric-card metric-primary">
                  <div className="metric-topline"><span>01 / WORKLOAD</span><CheckSquare size={18} /></div>
                  <div className="metric-value">{stats.total.toString().padStart(2, '0')}</div>
                  <div className="metric-label">Total tasks <span>Across your workspace</span></div>
                  <div className="metric-decoration metric-bars"><i /><i /><i /><i /><i /><i /><i /><i /></div>
                </div>
                <div className="metric-card">
                  <div className="metric-topline"><span>02 / COMPLETION</span><Sparkles size={18} /></div>
                  <div className="metric-value">{stats.done.toString().padStart(2, '0')}</div>
                  <div className="metric-label">Completed <span>Work delivered</span></div>
                  <div className="metric-bottom"><div className="mini-progress"><i style={{ width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%` }} /></div><small>{stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%</small></div>
                </div>
                <div className="metric-card">
                  <div className="metric-topline"><span>03 / ACTIVE</span><Activity size={18} /></div>
                  <div className="metric-value">{stats.progress.toString().padStart(2, '0')}</div>
                  <div className="metric-label">In progress <span>Currently moving</span></div>
                  <div className="metric-status"><i /> LIVE WORKFLOW</div>
                </div>
                <div className="metric-card">
                  <div className="metric-topline"><span>04 / PORTFOLIO</span><FolderKanban size={18} /></div>
                  <div className="metric-value">{projects.length.toString().padStart(2, '0')}</div>
                  <div className="metric-label">Projects <span>Ideas in motion</span></div>
                  <button className="metric-link" onClick={() => setTab('Projects')}>View portfolio <ArrowUpRight size={14} /></button>
                </div>
              </section>

              <section className="dashboard-lower-grid">
                <div className="dashboard-module activity-module">
                  <div className="module-heading">
                    <div><span className="module-index">01 — ACTIVITY</span><h2>Recent work</h2><p>Your latest tasks and updates.</p></div>
                    <button className="module-link" onClick={() => setTab('Tasks')}>All tasks <ArrowUpRight size={15} /></button>
                  </div>
                  <TaskList tasks={visibleTasks.slice(0, 5)} projects={projects} onUpdate={updateTask} onDelete={deleteTask} members={members} isOwner={isWorkspaceOwner} />
                </div>
                <div className="dashboard-module projects-module">
                  <div className="module-heading">
                    <div><span className="module-index">02 — PORTFOLIO</span><h2>Projects</h2><p>What your team is building.</p></div>
                    <button className="round-arrow" onClick={() => setTab('Projects')} aria-label="View projects"><ArrowUpRight size={17} /></button>
                  </div>
                  {projects.length === 0 ? <Empty text="Create your first project to get started." /> : (
                    <div className="premium-project-list">
                      {projects.slice(0, 4).map((project, index) => {
                        const projectTasks = tasks.filter(t => (t.project?._id || t.project) === project._id);
                        const completed = projectTasks.filter(t => t.status === 'done').length;
                        const percent = projectTasks.length ? Math.round(completed / projectTasks.length * 100) : 0;
                        return (
                          <button className="premium-project-row" key={project._id} onClick={() => { setSelectedProject(project._id); setTab('Tasks'); }}>
                            <span className={`project-number project-number-${index % 4}`}>0{index + 1}</span>
                            <span className="premium-project-name"><b>{project.name}</b><small>{projectTasks.length} tasks · {completed} completed</small></span>
                            <span className="project-ring" style={{ '--progress': `${percent * 3.6}deg` }}><b>{percent}%</b></span>
                            <ChevronRight size={15} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <button className="new-project-link" onClick={() => setTab('Projects')}><Plus size={15} /> Explore all projects</button>
                </div>
              </section>
            </div>
          )}

          {/* PROJECTS */}
          {tab === 'Projects' && (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Projects</h2>
                  <p className="muted">Organize your team's work.</p>
                </div>
              </div>

              <form className="inline-form" onSubmit={addProject}>
                <input
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  required
                />
                <button className="primary">
                  <Plus size={16} /> Create project
                </button>
              </form>

              <div className="project-grid">
                {projects.map(project => (
                  <div className="project-card" key={project._id}>
                    <div className="project-icon">
                      <FolderKanban size={20} />
                    </div>
                    <h3>{project.name}</h3>
                    <p className="muted">
                      {tasks.filter(t =>
                        (t.project?._id || t.project) === project._id
                      ).length} tasks
                    </p>
                    <ProjectProgress
                      tasks={tasks.filter(t =>
                        (t.project?._id || t.project) === project._id
                      )}
                    />
                    <button
                      className="text-btn"
                      onClick={() => {
                        setSelectedProject(project._id);
                        setTab('Tasks');
                      }}
                    >
                      View tasks
                    </button>
                  </div>
                ))}
              </div>

              {!projects.length && (
                <Empty text="No projects yet. Create one above." />
              )}
            </section>
          )}

          {/* TASKS */}
          {tab === 'Tasks' && (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Tasks</h2>
                  <p className="muted">Create and manage your work.</p>
                </div>
                <span className="count">{tasks.length}</span>
              </div>

              {isWorkspaceOwner && (
              <form className="inline-form" onSubmit={addTask}>
                <input
                  placeholder="What needs to be done?"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  required
                />

                <select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  required
                >
                  <option value="">Select project</option>
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                >
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </select>

                <input
                  type="date"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                  aria-label="Task deadline"
                  title="Optional task deadline"
                />

                <select
                  value={taskAssignee}
                  onChange={e => setTaskAssignee(e.target.value)}
                  aria-label="Assign task to a team member"
                >
                  <option value="">Unassigned</option>
                  {members.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.name}{String(member._id) === String(user.id || user._id) ? ' (You)' : ''}
                    </option>
                  ))}
                </select>

                <button className="primary">
                  <Plus size={16} /> Add task
                </button>
              </form>
              )}
              {!isWorkspaceOwner && (
                <p className="muted">You have view-only access to this workspace. The owner creates and assigns tasks.</p>
              )}

              <div className="task-filters">
                <div className="task-filter-heading">
                  <div>
                    <h3>Filter tasks</h3>
                    <p className="muted">Narrow your tasks by status, priority, project or deadline.</p>
                  </div>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={resetTaskFilters}
                  >
                    Reset filters
                  </button>
                </div>

                <div className="task-filter-grid">
                  <label>
                    Status
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                      <option value="all">All statuses</option>
                      <option value="todo">To do</option>
                      <option value="in-progress">In progress</option>
                      <option value="done">Completed</option>
                    </select>
                  </label>

                  <label>
                    Priority
                    <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                      <option value="all">All priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>

                  <label>
                    Project
                    <select value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                      <option value="all">All projects</option>
                      {projects.map(project => (
                        <option key={project._id} value={project._id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Deadline
                    <select value={filterDeadline} onChange={e => setFilterDeadline(e.target.value)}>
                      <option value="all">All deadlines</option>
                      <option value="overdue">Overdue</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="no-deadline">No deadline</option>
                    </select>
                  </label>
                </div>

                <p className="muted task-filter-count">
                  Showing <strong>{visibleTasks.length}</strong> of <strong>{tasks.length}</strong> tasks
                </p>
              </div>

              <TaskList
                tasks={visibleTasks}
                projects={projects}
                onUpdate={updateTask}
                onDelete={deleteTask}
                members={members}
                isOwner={isWorkspaceOwner}
              />
            </section>
          )}          {/* TEAM MEMBERS */}
          {tab === 'Team' && (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Team Members</h2>
                  <p className="muted">
                    Add existing TeamOS users to your workspace.
                  </p>
                </div>
                <span className="count">{members.length}</span>
              </div>

              <form className="inline-form" onSubmit={addMember}>
                <input
                  type="email"
                  placeholder="Enter registered member email"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  required
                />
                <button className="primary" disabled={addingMember}>
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
              </form>

              <div className="project-list">
                {members.map(member => (
                  <div className="project-item" key={member._id}>
                    <div className="avatar">
                      {(member.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <b>{member.name || 'Team member'}</b>
                      <small>{member.email}</small>
                    </div>
                  </div>
                ))}
              </div>

              {members.length === 0 && (
                <Empty text="No team members found yet. Add an existing registered user above." />
              )}

              <p className="muted" style={{ marginTop: 16 }}>
                Team members can view shared workspace tasks. Only the workspace owner can create, assign, edit, or delete tasks.
              </p>
            </section>
          )}

          {/* AI ASSISTANT */}
          {tab === 'AI Assistant' && (
            <div className="ai-layout">

              {/* AI TASK GENERATOR */}
              <section className="panel generator-panel">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">AI PRODUCTIVITY TOOL</p>
                    <h2>
                      <Sparkles size={20} /> AI Task Generator
                    </h2>
                    <p className="muted">
                      Generate project tasks automatically and review them
                      before saving.
                    </p>
                  </div>
                  <span className="nav-badge">AI</span>
                </div>

                <form onSubmit={generateTasks}>
                  <label>Choose project</label>
                  <select
                    value={selectedProject}
                    onChange={e => setSelectedProject(e.target.value)}
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>

                  <label>What tasks do you want?</label>
                  <textarea
                    rows="4"
                    placeholder="Example: Create tasks for building my AI-powered career management platform."
                    value={generatorPrompt}
                    onChange={e => setGeneratorPrompt(e.target.value)}
                  />

                  <label>Number of tasks</label>
                  <select
                    value={generatorCount}
                    onChange={e => setGeneratorCount(Number(e.target.value))}
                  >
                    {[3, 5, 10, 15, 20].map(number => (
                      <option key={number} value={number}>
                        {number} tasks
                      </option>
                    ))}
                  </select>

                  <button
                    className="primary"
                    type="submit"
                    disabled={generating || !projects.length}
                  >
                    <Sparkles size={16} />
                    {generating ? 'Generating...' : 'Generate Tasks'}
                  </button>
                </form>

                {!projects.length && (
                  <p className="muted">
                    Create a project first before generating tasks.
                  </p>
                )}

                {/* GENERATED TASK PREVIEW */}
                {generatedTasks.length > 0 && (
                  <div className="generated-section">
                    <div className="panel-head">
                      <div>
                        <h3>Generated task preview</h3>
                        <p className="muted">
                          Review these suggestions before saving.
                        </p>
                      </div>
                      <span className="count">
                        {generatedTasks.length}
                      </span>
                    </div>

                    <div className="generated-list">
                      {generatedTasks.map((task, index) => (
                        <div className="generated-task" key={index}>
                          <div className="generated-task-top">
                            <b>{index + 1}. {task.title}</b>

                            <span className={`priority ${task.priority}`}>
                              {task.priority}
                            </span>
                          </div>

                          <p className="muted">
                            {task.description}
                          </p>

                          <button
                            type="button"
                            className="text-btn danger"
                            onClick={() =>
                              setGeneratedTasks(old =>
                                old.filter((_, i) => i !== index)
                              )
                            }
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="generator-actions">
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => setGeneratedTasks([])}
                        disabled={savingGenerated}
                      >
                        Discard all
                      </button>

                      <button
                        className="primary"
                        type="button"
                        onClick={saveGeneratedTasks}
                        disabled={savingGenerated}
                      >
                        {savingGenerated
                          ? 'Saving...'
                          : 'Save Tasks to MongoDB'}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* AI CHAT */}
              <section className="panel chat-panel">
                <div className="panel-head">
                  <div>
                    <h2>
                      <Bot size={20} /> TeamOS AI Assistant
                    </h2>
                    <p className="muted">
                      Ask questions about your workspace.
                    </p>
                  </div>
                  <span className="online-dot">Online</span>
                </div>

                <div className="chat-messages">
                  {chatHistory.length === 0 && (
                    <div className="chat-empty">
                      <div className="ai-avatar">
                        <Sparkles size={24} />
                      </div>

                      <h3>How can I help you today?</h3>

                      <p className="muted">
                        Ask me about your tasks, projects and productivity.
                      </p>

                      <div className="suggestion-list">
                        {[
                          'How many tasks are completed?',
                          'Show my overdue tasks',
                          'List my projects',
                          'Create a 7-day project plan'
                        ].map(suggestion => (
                          <button
                            key={suggestion}
                            type="button"
                            className="suggestion"
                            onClick={() => setQuestion(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {chatHistory.map((message, index) => (
                    <div
                      className={`chat-message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
                      key={index}
                    >
                      <div className="message-avatar">
                        {message.role === 'user'
                          ? (user.name || 'U').charAt(0).toUpperCase()
                          : <Bot size={17} />}
                      </div>

                      <div className="message-content">
                        <b>
                          {message.role === 'user' ? 'You' : 'TeamOS AI'}
                        </b>
                        <p>{message.text}</p>
                      </div>
                    </div>
                  ))}

                  {busy && (
                    <div className="chat-message ai-message">
                      <div className="message-avatar">
                        <Bot size={17} />
                      </div>
                      <div className="message-content">
                        <b>TeamOS AI</b>
                        <p>Thinking...</p>
                      </div>
                    </div>
                  )}
                </div>

                <form className="chat-input" onSubmit={askAI}>
                  <input
                    placeholder="Ask anything about your workspace..."
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    disabled={busy}
                  />

                  <button
                    className="primary"
                    type="submit"
                    disabled={busy || !question.trim()}
                  >
                    Ask AI
                  </button>
                </form>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// REUSABLE COMPONENTS

function Stat({ title, value, note, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <div className="stat-icon">{icon}</div>
      </div>
      <h2>{value}</h2>
      <p className="muted">{note}</p>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="empty-state">
      <FolderKanban size={25} />
      <p>{text}</p>
    </div>
  );
}

function ProjectProgress({ tasks, compact = false }) {
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === 'done').length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className={`project-progress ${compact ? 'compact' : ''}`}>
      <div className="project-progress-label">
        <span>Progress</span>
        <strong>{percentage}%</strong>
      </div>
      <div
        className="project-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-label={`Project completion ${percentage}%`}
      >
        <div
          className="project-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <small>{completed} of {total} tasks completed</small>
    </div>
  );
}

function ProjectForm({ value, setValue, onSubmit }) {
  return (
    <form className="inline-form" onSubmit={onSubmit}>
      <input
        placeholder="Enter project name"
        value={value}
        onChange={e => setValue(e.target.value)}
        required
      />
      <button className="primary">
        <Plus size={16} /> Create project
      </button>
    </form>
  );
}

function TaskList({ tasks, projects, onUpdate, onDelete, members = [], isOwner = false }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    project: ''
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  if (!tasks.length) {
    return <Empty text="No tasks found. Add a task to get started." />;
  }

  const startEditing = task => {
    setEditingId(task._id);
    setEditError('');
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      project: task.project?._id || task.project || ''
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditError('');
  };

  const saveEditing = async taskId => {
    if (!editForm.title.trim() || !editForm.project) {
      setEditError('Task title and project are required.');
      return;
    }

    setSaving(true);
    setEditError('');
    try {
      const updated = await onUpdate(taskId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        priority: editForm.priority,
        project: editForm.project
      });
      if (updated) setEditingId(null);
      else setEditError('Could not save task changes. Please try again.');
    } catch {
      setEditError('Could not save task changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Compare date-only strings to avoid timezone shifts in date inputs.
  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  return (
    <div className="task-list">
      {tasks.map(task => {
        const deadline = task.dueDate
          ? String(task.dueDate).slice(0, 10)
          : '';
        const overdue = Boolean(
          deadline && deadline < todayString && task.status !== 'done'
        );
        const isEditing = isOwner && editingId === task._id;

        if (isEditing) {
          return (
            <div className="task-edit-card" key={task._id}>
              <div className="task-edit-grid">
                <label>
                  Task title
                  <input
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    maxLength={160}
                    required
                  />
                </label>

                <label>
                  Project
                  <select
                    value={editForm.project}
                    onChange={e => setEditForm({ ...editForm, project: e.target.value })}
                    required
                  >
                    <option value="">Select project</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    value={editForm.priority}
                    onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label className="task-edit-description">
                  Description
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    rows={2}
                    maxLength={2000}
                    placeholder="Add task details (optional)"
                  />
                </label>
              </div>

              {editError && <p className="error task-edit-error">{editError}</p>}

              <div className="task-edit-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X size={15} /> Cancel
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => saveEditing(task._id)}
                  disabled={saving}
                >
                  <Save size={15} /> {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="task-row" key={task._id}>
            <div className="task-info">
              <b>{task.title}</b>
              <small>{task.project?.name || 'Project'}</small>
              <small>Assigned to: {task.assignee?.name || 'Unassigned'}</small>
              {deadline && (
                <small className={overdue ? 'deadline overdue' : 'deadline'}>
                  {overdue ? 'Overdue · ' : 'Deadline · '}
                  {new Date(`${deadline}T00:00:00`).toLocaleDateString('en-IN')}
                </small>
              )}
            </div>

            <span className={`priority ${task.priority}`}>
              {task.priority}
            </span>

            {isOwner && (
              <>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => onUpdate(task._id, {
                    dueDate: e.target.value || null
                  })}
                  aria-label={`Deadline for ${task.title}`}
                  title="Change task deadline"
                />

                <select
                  value={task.status}
                  onChange={e => onUpdate(task._id, e.target.value)}
                  aria-label={`Status of ${task.title}`}
                >
                  <option value="todo">To do</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>

                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => startEditing(task)}
                  title="Edit task details"
                  aria-label={`Edit ${task.title}`}
                >
                  <Pencil size={16} />
                </button>

                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => onDelete(task._id)}
                  title="Delete task"
                  aria-label={`Delete ${task.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
