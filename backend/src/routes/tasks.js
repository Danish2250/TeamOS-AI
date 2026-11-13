
import { Router } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

const router = Router();

// Find the workspace owner for the logged-in user.
async function getWorkspaceOwner(userId) {
  const owner = await User.findOne({ teamMembers: userId });

  if (owner) return owner;

  return User.findById(userId);
}

// Check whether a user belongs to a workspace.
async function isWorkspaceMember(ownerId, memberId) {
  if (!mongoose.isValidObjectId(memberId)) return false;

  if (String(ownerId) === String(memberId)) return true;

  const owner = await User.findById(ownerId).select('teamMembers');

  return Boolean(
    owner?.teamMembers?.some(
      id => String(id) === String(memberId)
    )
  );
}

// GET /api/tasks/members
router.get('/members', async (req, res) => {
  try {
    const owner = await getWorkspaceOwner(req.user.id);

    if (!owner) {
      return res.status(404).json({
        message: 'Workspace not found.'
      });
    }

    await owner.populate('teamMembers', 'name email');

    res.json([
      {
        _id: owner._id,
        name: owner.name,
        email: owner.email
      },
      ...(owner.teamMembers || [])
    ]);
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      message: 'Failed to fetch members.'
    });
  }
});

// POST /api/tasks/members
// Only the workspace owner can add members.
router.post('/members', async (req, res) => {
  try {
    const owner = await getWorkspaceOwner(req.user.id);

    if (!owner || String(owner._id) !== String(req.user.id)) {
      return res.status(403).json({
        message: 'Only the workspace owner can add members.'
      });
    }

    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: 'Member email is required.'
      });
    }

    const member = await User.findOne({ email })
      .select('name email');

    if (!member) {
      return res.status(404).json({
        message: 'No registered user found with this email.'
      });
    }

    if (String(member._id) === String(owner._id)) {
      return res.status(400).json({
        message: 'You are already the workspace owner.'
      });
    }

    await User.findByIdAndUpdate(owner._id, {
      $addToSet: { teamMembers: member._id }
    });

    res.json({
      message: 'Team member added successfully.',
      member
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      message: 'Failed to add team member.'
    });
  }
});

// GET /api/tasks
// Owner and members can view workspace tasks.
router.get('/', async (req, res) => {
  try {
    const owner = await getWorkspaceOwner(req.user.id);

    if (!owner) {
      return res.status(404).json({
        message: 'Workspace not found.'
      });
    }

    const tasks = await Task.find({
      owner: owner._id
    })
      .populate('project', 'name')
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      message: 'Failed to fetch tasks.'
    });
  }
});

// POST /api/tasks
// Owner and members can create tasks in shared projects.
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      project,
      assignee
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: 'Task title is required.'
      });
    }

    if (!mongoose.isValidObjectId(project)) {
      return res.status(400).json({
        message: 'Valid project is required.'
      });
    }

    const owner = await getWorkspaceOwner(req.user.id);

    if (!owner) {
      return res.status(404).json({
        message: 'Workspace not found.'
      });
    }

    const projectExists = await Project.findOne({
      _id: project,
      owner: owner._id
    });

    if (!projectExists) {
      return res.status(404).json({
        message: 'Project not found in this workspace.'
      });
    }

    if (assignee) {
      const validMember = await isWorkspaceMember(
        owner._id,
        assignee
      );

      if (!validMember) {
        return res.status(403).json({
          message: 'Assignee must belong to this workspace.'
        });
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description || '',
      priority: ['low', 'medium', 'high'].includes(priority)
        ? priority
        : 'medium',
      dueDate: dueDate || null,
      project,
      owner: owner._id,
      assignee: assignee || null
    });

    const populatedTask = await task.populate([
      { path: 'project', select: 'name' },
      { path: 'assignee', select: 'name email' }
    ]);

    const io = req.app.get('io');
    if (io) io.emit('task-created', populatedTask);

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      message: 'Failed to create task.'
    });
  }
});

// POST /api/tasks/bulk
// Save AI-generated tasks to the shared workspace.
router.post('/bulk', async (req, res) => {
  try {
    const { project, tasks } = req.body;

    if (!mongoose.isValidObjectId(project)) {
      return res.status(400).json({
        message: 'Valid project is required.'
      });
    }

    if (!Array.isArray(tasks) || tasks.length < 1 || tasks.length > 20) {
      return res.status(400).json({
        message: 'Please provide between 1 and 20 tasks.'
      });
    }

    const owner = await getWorkspaceOwner(req.user.id);

    if (!owner) {
      return res.status(404).json({
        message: 'Workspace not found.'
      });
    }

    const projectExists = await Project.findOne({
      _id: project,
      owner: owner._id
    });

    if (!projectExists) {
      return res.status(404).json({
        message: 'Project not found.'
      });
    }

    const taskDocuments = [];

    for (const task of tasks) {
      const title = String(task.title || '').trim();

      if (!title || title.length > 160) {
        return res.status(400).json({
          message: 'Every task must have a title of 1 to 160 characters.'
        });
      }

      taskDocuments.push({
        title,
        description: String(task.description || '').slice(0, 2000),
        priority: ['low', 'medium', 'high'].includes(task.priority)
          ? task.priority
          : 'medium',
        status: 'todo',
        project,
        owner: owner._id
      });
    }

    const savedTasks = await Task.insertMany(taskDocuments);

    const populatedTasks = await Task.populate(savedTasks, [
      { path: 'project', select: 'name' },
      { path: 'assignee', select: 'name email' }
    ]);

    const io = req.app.get('io');

    if (io) {
      populatedTasks.forEach(task => {
        io.emit('task-created', task);
      });
    }

    res.status(201).json({
      message: `${populatedTasks.length} tasks saved successfully.`,
      tasks: populatedTasks
    });
  } catch (error) {
    console.error('Bulk tasks error:', error);
    res.status(500).json({
      message: 'Failed to save generated tasks.'
    });
  }
});

// PATCH /api/tasks/:id
// Workspace members can update tasks.
router.patch('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid task ID.'
      });
    }

    const owner = await getWorkspaceOwner(req.user.id);

    if (!owner) {
      return res.status(404).json({
        message: 'Workspace not found.'
      });
    }

    const updates = {};
    const allowedFields = [
      'title',
      'description',
      'status',
      'priority',
      'dueDate',
      'assignee'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.title !== undefined) {
      updates.title = String(updates.title).trim();

      if (!updates.title || updates.title.length > 160) {
        return res.status(400).json({
          message: 'Invalid task title.'
        });
      }
    }

    if (updates.description !== undefined) {
      updates.description = String(updates.description).slice(0, 2000);
    }

    if (
      updates.status !== undefined &&
      !['todo', 'in-progress', 'done'].includes(updates.status)
    ) {
      return res.status(400).json({
        message: 'Invalid task status.'
      });
    }

    if (
      updates.priority !== undefined &&
      !['low', 'medium', 'high'].includes(updates.priority)
    ) {
      return res.status(400).json({
        message: 'Invalid task priority.'
      });
    }

    if (updates.assignee !== undefined) {
      if (updates.assignee === '' || updates.assignee === null) {
        updates.assignee = null;
      } else {
        const validMember = await isWorkspaceMember(
          owner._id,
          updates.assignee
        );

        if (!validMember) {
          return res.status(403).json({
            message: 'Assignee must belong to this workspace.'
          });
        }
      }
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: owner._id
      },
      updates,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('project', 'name')
      .populate('assignee', 'name email');

    if (!task) {
      return res.status(404).json({
        message: 'Task not found.'
      });
    }

    const io = req.app.get('io');
    if (io) io.emit('task-updated', task);

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      message: 'Failed to update task.'
    });
  }
});

// DELETE /api/tasks/:id
// Only workspace owner can delete tasks.
router.delete('/:id', async (req, res) => {
  try {
    const owner = await getWorkspaceOwner(req.user.id);

    if (!owner || String(owner._id) !== String(req.user.id)) {
      return res.status(403).json({
        message: 'Only the workspace owner can delete tasks.'
      });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: owner._id
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found.'
      });
    }

    const io = req.app.get('io');

    if (io) {
      io.emit('task-deleted', { _id: req.params.id });
    }

    res.json({
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      message: 'Failed to delete task.'
    });
  }
});

export default router;
