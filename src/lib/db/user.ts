import { prisma } from "@/lib/connect-db";

type User = {
  email: string;
  password: string;
  userName: string;
  userAvatar: string;
};

export const createUser = async ({
  email,
  password,
  userName,
  userAvatar,
}: User) => {
  return await prisma.user.create({
    data: {
      email,
      password,
      userName,
      userAvatar,
    },
  });
};

export const getAllUsers = async () => {
  const users = await prisma.user.findMany();
  return users;
};

export const findUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      providers: true,
    },
  });
  return user;
};
