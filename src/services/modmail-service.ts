import {autoInjectable, inject} from "tsyringe";
import { Pool, Client } from "pg";

@autoInjectable()
export class ModmailService {
  config: Config;
  pool: Pool;

  constructor(@inject("Config") config: Config) {
    this.pool = new Pool(config.Database)
    this.config = config;
  }

  getModmails = async () => {
    return {}
  }
}