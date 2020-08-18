import {autoInjectable, inject} from "tsyringe";
import { Pool, Client } from "pg";

@autoInjectable()
export class PostgresService {
  config: Config;
  pool: Pool;

  constructor(@inject("Config") config: Config) {
    this.pool = new Pool(config.Database)
    this.config = config;

    this.pool.query("select * from mcauth.account_links", (err, res) => {
      console.log(err, res)
      this.pool.end()
    });
  }
}