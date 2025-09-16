import type { Knex } from "knex";
import path from "path";

const config: Knex.Config = {
  client: "sqlite3",
  connection: {
    filename: path.resolve(__dirname, "dev.sqlite3"),
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, "src", "migrations"),
  },
};

export default config;
