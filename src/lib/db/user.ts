import { prisma } from "@/lib/connect-db";

type User = {
  email: string;
  password: string;
  name: string;
};

export const createUser = async ({ email, name, password }: User) => {
  return await prisma.user.create({
    data: {
      email,
      name,
      password,
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
  });
  return user;
};
