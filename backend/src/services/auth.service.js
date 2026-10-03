const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { portalMode } = require('../config/aws');
const { hashToken } = require('../middleware/requireAuth');
const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_ROLE, ADMIN_NAME } = require('../config/admin');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function requireCredentials(email, password) {
  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.status = 400;
    throw error;
  }

  if (!email.includes('@') || password.length < 6) {
    const error = new Error('Use a valid email and a password of at least 6 characters.');
    error.status = 400;
    throw error;
  }
}

function publicUser(user) {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function issueSession(user) {
  const token = crypto.randomBytes(24).toString('hex');
  user.sessionTokenHash = hashToken(token);
  await user.save();
  return {
    mode: portalMode(),
    token,
    user: publicUser(user),
  };
}

async function register({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = String(name || '').trim();
  const normalizedPassword = String(password || '');

  if (!normalizedName) {
    const error = new Error('Name is required.');
    error.status = 400;
    throw error;
  }

  requireCredentials(normalizedEmail, normalizedPassword);

  if (normalizedEmail === ADMIN_EMAIL) {
    const error = new Error('This email is reserved.');
    error.status = 409;
    throw error;
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const error = new Error('An account with this email already exists.');
    error.status = 409;
    throw error;
  }

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(normalizedPassword, 10),
    role: 'Service Catalog End User',
  });

  return issueSession(user);
}

async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '');
  requireCredentials(normalizedEmail, normalizedPassword);

  const user = await User.findOne({ email: normalizedEmail });
  const matches = user ? await bcrypt.compare(normalizedPassword, user.passwordHash) : false;
  if (!user || !matches) {
    const error = new Error('Email or password is incorrect.');
    error.status = 401;
    throw error;
  }

  if (user.role === ADMIN_ROLE) {
    const error = new Error('Use the admin sign-in page.');
    error.status = 403;
    throw error;
  }

  return issueSession(user);
}

async function adminLogin({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '');
  requireCredentials(normalizedEmail, normalizedPassword);

  if (normalizedEmail !== ADMIN_EMAIL || normalizedPassword !== ADMIN_PASSWORD) {
    const error = new Error('Email or password is incorrect.');
    error.status = 401;
    throw error;
  }

  let user = await User.findOne({ email: ADMIN_EMAIL });
  if (!user) {
    user = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: ADMIN_ROLE,
    });
  } else if (user.role !== ADMIN_ROLE) {
    user.role = ADMIN_ROLE;
    await user.save();
  }

  return issueSession(user);
}

module.exports = { register, login, adminLogin };
