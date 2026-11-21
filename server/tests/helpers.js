const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');

const createUser = async ({ role = 'candidate', isVerified = true, ...overrides } = {}) => {
  const password = await bcrypt.hash('Password1!', 10);
  return User.create({
    name: 'Test User',
    email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password,
    role,
    isVerified,
    ...overrides,
  });
};

const tokenFor = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

module.exports = { createUser, tokenFor };
