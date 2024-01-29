import * as bcrypt from "bcrypt";

export const hash = (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const compare = (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
