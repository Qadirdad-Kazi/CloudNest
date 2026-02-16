import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

console.log('Debugging JWT authentication:');
console.log('------------------------------');

// Check if JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set in .env file');
  process.exit(1);
}

console.log('JWT_SECRET is set:', process.env.JWT_SECRET ? 'Yes' : 'No');

// Try to create a test token
try {
  const testToken = jwt.sign(
    { userId: '123456789012345678901234' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  console.log('Successfully created test token');
  
  // Try to verify the token
  try {
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
    console.log('Successfully verified test token');
    console.log('Decoded payload:', decoded);
  } catch (error) {
    console.error('ERROR: Failed to verify token:', error.message);
  }
} catch (error) {
  console.error('ERROR: Failed to create token:', error.message);
}

console.log('------------------------------');
