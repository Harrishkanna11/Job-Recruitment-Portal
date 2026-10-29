import bcrypt from 'bcryptjs';
import dbService from '../services/dbService.js';
import { generateToken } from '../utils/jwt.js';

export const register = async (req, res) => {
  try {
    const { email, password, role, fullName, companyName, companyWebsite } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
    }

    if (!['job_seeker', 'recruiter'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified for public registration.' });
    }

    const emailClean = email.trim().toLowerCase();
    const existing = await dbService.findUserByEmail(emailClean);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await dbService.createUser({
      email: emailClean,
      password_hash: passwordHash,
      role,
      account_status: 'active',
    });

    let profile = null;

    if (role === 'job_seeker') {
      profile = await dbService.upsertSeekerProfile(newUser.id, {
        full_name: fullName || 'Job Seeker',
      });
      // Welcome notification
      await dbService.createNotification({
        userId: newUser.id,
        title: 'Welcome to HireHub!',
        message: 'Your profile has been created. Complete your skills and upload your resume to get discovered.',
        link: '/profile',
      });
    } else if (role === 'recruiter') {
      let company = null;
      if (companyName) {
        company = await dbService.upsertCompany({
          name: companyName,
          website: companyWebsite || '',
        });
      }
      profile = await dbService.upsertRecruiterProfile(newUser.id, {
        full_name: fullName || 'Recruiter',
        company_id: company ? company.id : null,
      });
      await dbService.createNotification({
        userId: newUser.id,
        title: 'Welcome to HireHub for Employers!',
        message: 'Your recruiter account is ready. Complete your company profile to begin posting jobs.',
        link: '/dashboard/recruiter',
      });
    }

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        account_status: newUser.account_status,
      },
      profile,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const emailClean = email.trim().toLowerCase();
    const user = await dbService.findUserByEmail(emailClean);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.account_status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account is suspended. Please contact platform administrators.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    let profile = null;
    if (user.role === 'job_seeker') {
      profile = await dbService.getSeekerProfile(user.id);
    } else if (user.role === 'recruiter') {
      profile = await dbService.getRecruiterProfile(user.id);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        account_status: user.account_status,
      },
      profile,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await dbService.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let profile = null;
    if (user.role === 'job_seeker') {
      profile = await dbService.getSeekerProfile(user.id);
    } else if (user.role === 'recruiter') {
      profile = await dbService.getRecruiterProfile(user.id);
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        account_status: user.account_status,
      },
      profile,
    });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve user session.' });
  }
};

export const logout = async (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
};
