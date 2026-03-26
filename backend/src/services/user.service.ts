import { UserModel, UserRole } from "../models/user.model";
import { NotFoundError } from "../utils/error";

export const userService = {
  async getAllUsers() {
    const users = await UserModel.find({})
      .select("-passwordHash")
      .sort({ createdAt: -1 });
    return users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  },

  async updateRole(userId: string, role: UserRole) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true },
    ).select("-passwordHash");

    if (!user) {
      throw new NotFoundError("User");
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      updatedAt: user.updatedAt,
    };
  },

  async getUsersByRole(role: UserRole) {
    return UserModel.find({ role }).select("_id name email role").lean();
  },

  async getUserById(userId: string) {
    const user = await UserModel.findById(userId).select("-passwordHash");
    if (!user) throw new NotFoundError("User");
    return user;
  },
};
