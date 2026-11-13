
import { Router } from 'express';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

const router = Router();

// Find the owner of the logged-in user's workspace.
async function getWorkspaceOwner(userId) {
  const owner = await User.findOne({ teamMembers: userId });

  if (owner) return owner;

  return User.findById(userId);
}

// GET all projects belonging to the workspace.
router.get('/', async (req, res) => {
  try {
    const owner = await getWorkspaceOwner(req.user.id);

    if (!owner) {
      return res.status(404).json({ message: 'Workspace not found.' });
    }

    const projects = await Project.find({
      owner: owner._id
    }).sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Failed to fetch projects.' });
  }
});

// Create projects: workspace owner only.
router.post('/', async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        message: 'Project name is required.'
      });
    }

    const owner = await getWorkspaceOwner(req.user.id);

    if (!owner || String(owner._id) !== String(req.user.id)) {
      return res.status(403).json({
        message: 'Only the workspace owner can create projects.'
      });
    }

    const project = await Project.create({
      name,
      description: req.body.description || '',
      owner: owner._id
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Failed to create project.' });
  }
});

// Delete projects: workspace owner only.
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    await Task.deleteMany({
      project: project._id,
      owner: req.user.id
    });

    res.json({ message: 'Project and its tasks deleted.' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Failed to delete project.' });
  }
});

export default router;
