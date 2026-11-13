
import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Project from '../models/Project.js';

const router = Router();

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const TIMEOUT_MS = 25000;

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// ==========================================
// 7-DAY PROJECT PLAN
// ==========================================

function createSevenDayPlan(workspace) {
  const days = [
    ['Day 1: Planning and requirements', [
      'Define project objectives',
      'List required features',
      'Assign responsibilities'
    ], 'Requirements document'],

    ['Day 2: Design and architecture', [
      'Design application architecture',
      'Plan database structure',
      'Create UI wireframes'
    ], 'Design plan'],

    ['Day 3: Backend development', [
      'Develop backend APIs',
      'Connect the database',
      'Implement authentication'
    ], 'Working backend APIs'],

    ['Day 4: Frontend development', [
      'Build dashboard screens',
      'Develop project and task pages',
      'Connect frontend to backend'
    ], 'Working application interface'],

    ['Day 5: Feature integration', [
      'Integrate the AI assistant',
      'Test task management',
      'Connect application modules'
    ], 'Integrated application'],

    ['Day 6: Testing and improvements', [
      'Test all features',
      'Fix bugs',
      'Improve responsive design'
    ], 'Tested application'],

    ['Day 7: Review and deployment', [
      'Review project features',
      'Prepare documentation',
      'Deploy the application'
    ], 'Final project release']
  ];

  return `YOUR 7-DAY PROJECT PLAN

Workspace overview:
- Projects: ${workspace.projects.length}
- Existing tasks: ${workspace.tasks.length}

${days.map(([title, items, deliverable]) =>
    `${title}
${items.map(item => `- ${item}`).join('\n')}
Deliverable: ${deliverable}`
  ).join('\n\n')}

These are suggestions only. They have not been saved as tasks in your database.`;
}

// ==========================================
// LOCAL AI ASSISTANT
// ==========================================

function localAssistant(question, workspace) {
  const q = question.toLowerCase();

  const {
    projects,
    tasks,
    overdueTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    highPriorityTasks
  } = workspace;

  if (
    q.includes('7-day') ||
    q.includes('7 day') ||
    q.includes('seven day') ||
    q.includes('weekly plan') ||
    q.includes('one week') ||
    q.includes('week plan')
  ) {
    return createSevenDayPlan(workspace);
  }

  if (
    q.includes('overdue') ||
    q.includes('late task') ||
    q.includes('past due')
  ) {
    if (!overdueTasks.length) {
      return 'Good news! You have no overdue tasks in your workspace.';
    }

    return `You have ${overdueTasks.length} overdue task(s):

${overdueTasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`;
  }

  if (
    q.includes('completed') ||
    q.includes('finished') ||
    q.includes('done') ||
    q.includes('how many task')
  ) {
    return `You have completed ${completedTasks} out of ${tasks.length} tasks.

- Completed: ${completedTasks}
- In progress: ${inProgressTasks}
- To do: ${pendingTasks}
- Overdue: ${overdueTasks.length}`;
  }

  if (
    q.includes('high priority') ||
    q.includes('important task') ||
    q.includes('urgent task')
  ) {
    if (!highPriorityTasks.length) {
      return 'You currently have no unfinished high-priority tasks.';
    }

    return `You have ${highPriorityTasks.length} unfinished high-priority task(s):

${highPriorityTasks.map((t, i) =>
      `${i + 1}. ${t.title} (${t.status})`
    ).join('\n')}`;
  }

  if (
    q.includes('project') &&
    (q.includes('list') || q.includes('show') || q.includes('how many'))
  ) {
    if (!projects.length) {
      return 'You have not created any projects yet.';
    }

    return `You have ${projects.length} project(s):

${projects.map((p, i) => `${i + 1}. ${p.name}`).join('\n')}`;
  }

  if (q.includes('help') || q.includes('what can you do')) {
    return 'I can answer questions about completed tasks, overdue tasks, task counts, high-priority tasks and projects. I can also create a suggested 7-day plan. Use the task generator to prepare tasks for review.';
  }

  return null;
}

// ==========================================
// AI TASK GENERATOR FALLBACK
// ==========================================

function fallbackGeneratedTasks(prompt, count) {
  const p = prompt.toLowerCase();

  let ideas;

  // CAREER MANAGEMENT PLATFORM
  if (
    p.includes('career') ||
    p.includes('placement') ||
    p.includes('job') ||
    p.includes('internship') ||
    p.includes('resume')
  ) {
    ideas = [
      [
        'Build the career management dashboard',
        'Create a dashboard showing career progress, job applications, upcoming activities and recommended actions.',
        'high'
      ],
      [
        'Develop the resume builder',
        'Allow users to create, edit, preview and download professional resumes using structured profile information.',
        'high'
      ],
      [
        'Implement job and internship tracking',
        'Let users add job opportunities and track application stages such as saved, applied, interview and rejected.',
        'high'
      ],
      [
        'Create user profile and skills management',
        'Allow users to maintain education, skills, projects, certifications and work experience.',
        'medium'
      ],
      [
        'Integrate AI career recommendations',
        'Generate personalized role and skill recommendations using the user profile, career goals and interests.',
        'high'
      ],
      [
        'Build backend APIs and authentication',
        'Create secure APIs for registration, login, profiles, resumes and application records.',
        'high'
      ],
      [
        'Connect MongoDB data models',
        'Store user profiles, resumes, skills, job applications and career recommendations in MongoDB.',
        'high'
      ],
      [
        'Add job search and filtering',
        'Allow users to search and filter opportunities by role, location, company and employment type.',
        'medium'
      ],
      [
        'Test and improve the application',
        'Test authentication, profile updates, resume creation, job tracking and AI features; fix identified issues.',
        'medium'
      ],
      [
        'Prepare deployment and documentation',
        'Document installation, environment variables, API endpoints and deployment steps.',
        'low'
      ]
    ];
  }

  // TEAM OS PROJECT
  else if (
    p.includes('teamos') ||
    p.includes('team os') ||
    p.includes('team workspace')
  ) {
    ideas = [
      [
        'Design the TeamOS dashboard layout',
        'Create a responsive dashboard showing projects, tasks and progress.',
        'high'
      ],
      [
        'Implement user profile and workspace settings',
        'Allow users to view and update their profile and workspace details.',
        'medium'
      ],
      [
        'Build project and task management screens',
        'Create interfaces to add, view, edit and organize projects and tasks.',
        'high'
      ],
      [
        'Add task search and priority filters',
        'Allow users to find tasks by keyword, status and priority.',
        'medium'
      ],
      [
        'Test authentication and protected routes',
        'Verify login, registration, token handling and access restrictions.',
        'high'
      ],
      [
        'Improve mobile responsiveness',
        'Make the workspace usable on desktop, tablet and mobile screens.',
        'medium'
      ],
      [
        'Prepare application documentation',
        'Document setup instructions, API routes and key application features.',
        'low'
      ]
    ];
  }

  // GENERAL PROJECT
  else {
    ideas = [
      [
        'Define project requirements',
        'Identify the main requirements, target users and expected features for this project.',
        'high'
      ],
      [
        'Create the project implementation plan',
        'Break the work into milestones and define the order of implementation.',
        'high'
      ],
      [
        'Design the user interface',
        'Prepare wireframes and a consistent interface layout for the main user journeys.',
        'medium'
      ],
      [
        'Implement the core functionality',
        'Build and connect the main features required by the project.',
        'high'
      ],
      [
        'Set up and verify data storage',
        'Create the required data models and test database operations.',
        'medium'
      ],
      [
        'Test the application',
        'Test important user flows and fix discovered bugs.',
        'medium'
      ],
      [
        'Prepare project documentation',
        'Write setup, usage and implementation documentation.',
        'low'
      ]
    ];
  }

  return ideas.slice(0, count).map(
    ([title, description, priority]) => ({
      title,
      description,
      priority
    })
  );
}

// ==========================================
// GEMINI REQUEST WITH TIMEOUT
// ==========================================

async function generateWithTimeout(request) {
  let timeoutId;

  try {
    return await Promise.race([
      ai.models.generateContent(request),

      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('Gemini request timed out.')),
          TIMEOUT_MS
        );
      })
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==========================================
// PARSE GEMINI RESPONSE
// ==========================================

function parseGeneratedTasks(text, count) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const parsed = JSON.parse(cleaned);
  const list = Array.isArray(parsed) ? parsed : parsed.tasks;

  if (!Array.isArray(list)) {
    throw new Error('Gemini response did not contain a task list.');
  }

  return list.slice(0, count).map(task => ({
    title: String(task.title || '').trim().slice(0, 160),

    description: String(task.description || '')
      .trim()
      .slice(0, 2000),

    priority: ['low', 'medium', 'high'].includes(task.priority)
      ? task.priority
      : 'medium'
  })).filter(task => task.title);
}

// ==========================================
// POST /api/ai/generate-tasks
// ==========================================

router.post('/generate-tasks', async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: 'Authentication required.'
      });
    }

    const prompt = String(req.body?.prompt || '').trim();

    const count = Math.min(
      20,
      Math.max(1, Number.parseInt(req.body?.count, 10) || 5)
    );

    const projectId = req.body?.projectId;

    if (!prompt) {
      return res.status(400).json({
        message: 'Describe the project or work.'
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({
        message: 'Prompt is too long.'
      });
    }

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        message: 'Select a valid project first.'
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user.id
    })
      .select('name description')
      .lean();

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.'
      });
    }

    let generatedTasks;
    let mode = 'local-fallback';

    // TRY GEMINI FIRST
    if (ai) {
      try {
        const response = await generateWithTimeout({
          model: MODEL,

          contents: `You are a professional software project manager.

Create exactly ${count} useful, specific and actionable project tasks.

PROJECT NAME:
${project.name}

PROJECT DESCRIPTION:
${project.description || 'Not provided'}

USER REQUIREMENTS:
${prompt}

Instructions:
1. Make tasks specific to this project.
2. Do not repeat the user's prompt as a task description.
3. Include frontend, backend, database, integration and testing tasks when relevant.
4. Give each task a clear action.
5. Use different task titles.
6. Use only low, medium or high priority.

Return ONLY valid JSON:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Specific actionable description",
      "priority": "high"
    }
  ]
}

Do not include markdown fences or additional text.`,

          config: {
            temperature: 0.4,
            maxOutputTokens: 2500
          }
        });

        generatedTasks = parseGeneratedTasks(
          response.text || '',
          count
        );

        if (generatedTasks.length !== count) {
          throw new Error(
            'Gemini returned fewer tasks than requested.'
          );
        }

        mode = 'gemini';

      } catch (error) {
        console.error(
          'Task generation using Gemini failed:',
          error.message
        );
      }
    }

    // USE LOCAL FALLBACK IF GEMINI FAILS
    if (!generatedTasks) {
      generatedTasks = fallbackGeneratedTasks(
        `${project.name}. ${project.description || ''}. ${prompt}`,
        count
      );
    }

    return res.json({
      message: `${generatedTasks.length} tasks generated. Review them before saving.`,

      project: {
        id: project._id,
        name: project.name
      },

      tasks: generatedTasks,
      mode,
      saved: false
    });

  } catch (error) {
    console.error(
      'Task generation route error:',
      error.message
    );

    return res.status(500).json({
      message: 'Unable to generate tasks.'
    });
  }
});

// ==========================================
// POST /api/ai/ask
// ==========================================

router.post('/ask', async (req, res) => {
  console.log('\n========== AI REQUEST ==========');
  console.log('Authenticated user:', req.user?.id);
  console.log('Question:', req.body?.question);

  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: 'User authentication information is missing.'
      });
    }

    const question = String(
      req.body?.question || ''
    ).trim();

    if (!question) {
      return res.status(400).json({
        message: 'Please enter a question.'
      });
    }

    if (question.length > 3000) {
      return res.status(400).json({
        message: 'Question is too long. Maximum 3000 characters.'
      });
    }

    const [tasks, projects] = await Promise.all([
      Task.find({
        owner: req.user.id
      })
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),

      Project.find({
        owner: req.user.id
      })
        .select('name description')
        .lean()
    ]);

    const now = new Date();

    const overdueTasks = tasks.filter(task =>
      task.status !== 'done' &&
      task.dueDate &&
      new Date(task.dueDate) < now
    );

    const completedTasks = tasks.filter(
      task => task.status === 'done'
    ).length;

    const pendingTasks = tasks.filter(
      task => task.status === 'todo'
    ).length;

    const inProgressTasks = tasks.filter(
      task => task.status === 'in-progress'
    ).length;

    const highPriorityTasks = tasks
      .filter(task =>
        task.priority === 'high' &&
        task.status !== 'done'
      )
      .map(task => ({
        title: task.title,
        status: task.status,
        project: task.project?.name || 'Unknown'
      }));

    const workspace = {
      projects,
      tasks,
      overdueTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      highPriorityTasks
    };

    // CHECK LOCAL WORKSPACE QUESTIONS FIRST
    const localAnswer = localAssistant(
      question,
      workspace
    );

    if (localAnswer !== null) {
      return res.json({
        answer: localAnswer,
        mode: 'local-fallback'
      });
    }

    if (!ai) {
      return res.json({
        answer: 'Gemini is not configured. You can still ask about completed tasks, overdue tasks, priorities, projects, or request a 7-day plan.',
        mode: 'local-fallback'
      });
    }

    // CHAT HISTORY
    const history = Array.isArray(req.body?.history)
      ? req.body.history
          .filter(item =>
            ['user', 'model'].includes(item.role) &&
            typeof item.text === 'string'
          )
          .slice(-8)
          .map(item => ({
            role: item.role,
            parts: [{
              text: item.text.slice(0, 1200)
            }]
          }))
      : [];

    const prompt = `You are TeamOS AI, a helpful project-management assistant.

Use simple professional English.
Never invent saved tasks or projects.
Clearly distinguish suggestions from saved database records.

WORKSPACE DATA:
${JSON.stringify({
  totalProjects: projects.length,

  projects: projects.map(p => ({
    name: p.name,
    description: p.description
  })),

  totalTasks: tasks.length,
  completedTasks,
  pendingTasks,
  inProgressTasks,

  overdueTasks: overdueTasks.map(t => t.title),
  highPriorityTasks
})}

USER QUESTION:
${question}`;

    try {
      const response = await generateWithTimeout({
        model: MODEL,

        contents: [
          ...history,

          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],

        config: {
          temperature: 0.5,
          maxOutputTokens: 1500
        }
      });

      const answer = response.text?.trim();

      if (!answer) {
        throw new Error('Gemini returned an empty response.');
      }

      return res.json({
        answer,
        mode: 'gemini',
        model: MODEL
      });

    } catch (error) {
      console.error(
        'Gemini unavailable:',
        error.message
      );

      return res.json({
        answer: 'Gemini is temporarily unavailable. Your workspace-data questions still work in local mode. Try asking about completed tasks, overdue tasks, high-priority tasks, projects, or a 7-day plan. To generate task previews, use the task generator.',
        mode: 'local-fallback'
      });
    }

  } catch (error) {
    console.error('AI route error:', error.message);

    return res.status(500).json({
      message: 'Unable to process your AI request. Please check the backend terminal.'
    });
  }
});

export default router;
