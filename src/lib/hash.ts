import bcrypt from 'bcryptjs'

export const hash = (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const compare = (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
