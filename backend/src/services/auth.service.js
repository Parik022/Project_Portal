const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/database");
const { env } = require("../config/env");
const { AppError } = require("../utils/AppError");
const { notifyAdmins } = require("./notification.service");

const BCRYPT_ROUNDS = 12;

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  registerNo: true,
  department: true,
  isActive: true,
  teamId: true,
  guideId: true,
  createdAt: true,
  updatedAt: true,
};

const signToken = (user) =>
  jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

const register = async ({ name, email, password, role, registerNo, department }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  if (registerNo) {
    const taken = await prisma.user.findUnique({ where: { registerNo } });
    if (taken) throw new AppError("Register number already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const isFaculty = role === "FACULTY";

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      department,
      registerNo: role === "STUDENT" ? registerNo : null,
      // Faculty accounts can verify attendance and review work, so an admin approves them first.
      isActive: !isFaculty,
    },
    select: userSelect,
  });

  if (isFaculty) {
    await notifyAdmins(`${user.name} (${user.email}) registered as faculty and needs approval`, "FACULTY_APPROVAL");
    return {
      user,
      token: null,
      message: "Registration received. An admin must approve faculty accounts before you can log in.",
    };
  }

  return { user, token: signToken(user) };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Same message for unknown email and wrong password, so attackers can't probe accounts.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError(
      user.role === "FACULTY"
        ? "Your faculty account is waiting for admin approval"
        : "Your account has been deactivated. Contact the admin.",
      403
    );
  }

  const { password: _password, ...safeUser } = user;
  return { user: safeUser, token: signToken(user) };
};

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userSelect,
      guide: { select: { id: true, name: true, email: true } },
      internship: true,
      team: {
        include: {
          project: true,
          members: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

const updateProfile = async (userId, data) =>
  prisma.user.update({ where: { id: userId }, data, select: userSelect });

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    throw new AppError("Current password is incorrect", 400);
  }
  await prisma.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
  });
  return { changed: true };
};

module.exports = { register, login, getProfile, updateProfile, changePassword, userSelect, BCRYPT_ROUNDS };
