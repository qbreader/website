import { emailCollation, users } from './collections.js';

const DUPLICATE_KEY_ERROR = 11000;
const NOT_VERIFIED = { matchedCount: 0, modifiedCount: 0 };

// mark user email as verified (unless its already been verified by another account in which case the function returns NOT_VERFIED)
async function verifyEmail (userId) {
  const user = await users.findOne({ _id: userId }, { projection: { email: 1 } });
  if (!user || !user.email) {
    return NOT_VERIFIED;
  }

  const conflict = await users.findOne(
    { _id: { $ne: userId }, email: user.email, verifiedEmail: true },
    { collation: emailCollation, projection: { _id: 1 } }
  );
  if (conflict) {
    return NOT_VERIFIED;
  }

  try {
    return await users.updateOne(
      { _id: userId },
      { $set: { verifiedEmail: true } }
    );
  } catch (error) {
    // the unique index on verified emails caught a concurrent verification
    if (error.code === DUPLICATE_KEY_ERROR) {
      return NOT_VERIFIED;
    }
    throw error;
  }
}

export default verifyEmail;
