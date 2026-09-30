const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { portalMode } = require('../config/aws');

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

function sessionFor(user) {
  return {
    mode: portalMode(),
    token: crypto.randomBytes(24).toString('hex'),
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

  return sessionFor(user);
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

  return sessionFor(user);
}

module.exports = { register, login };
