import { users } from './collections.js';

async function isAdminById (user_id) {
  const user = await users.findOne({ _id: user_id });
  return user?.admin ?? false;
}

export default isAdminById;
