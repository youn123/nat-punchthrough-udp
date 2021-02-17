const crypto = require('crypto');

function generateRandomBase64String(length) {
  let str = crypto.randomBytes(Math.ceil(length * 6 / 8)).toString('base64');
  return str.substring(0, length);
}

module.exports = {
  generateRandomBase64String
};