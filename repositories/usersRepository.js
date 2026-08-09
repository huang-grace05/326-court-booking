import User from "../models/userModel.js";

export async function findUserByEmail(email) {
  const user = await User.findOne({ email })
    .select("+passwordHash")
    .lean();
  return user ? toServiceUser(user) : null;
}

export async function createUser(user) {
  const savedUser = await User.create(user);
  return toServiceUser(savedUser.toObject());
}

function toServiceUser(user) {
  const { _id, __v, ...fields } = user;
  return { id: _id.toString(), ...fields };
}
