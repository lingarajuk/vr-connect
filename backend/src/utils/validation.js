/**
 * Validation utilities for VR Connect API
 */

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.trim());
};

const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return typeof username === 'string' && usernameRegex.test(username.trim());
};

const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

const isValidPin = (pin) => {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
};

module.exports = {
  isValidEmail,
  isValidUsername,
  isValidPassword,
  isValidPin,
};
