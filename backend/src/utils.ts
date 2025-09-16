import bcrypt from "bcrypt";

export const hash = (s: string) => bcrypt.hash(s, 10);
export const compare = (s: string, hashStr: string) =>
  bcrypt.compare(s, hashStr);
