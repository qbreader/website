import { users } from './collections.js';

async function isAdminById (userId) {
  const user = await users.findOne({ _id: userId });
  return user?.admin ?? false;
}

export default isAdminById;
