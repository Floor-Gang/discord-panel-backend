import { IController } from "../types/controllers";
import { Router } from "express";
import { PostgresService } from "../services/postgres-service";
import { autoInjectable } from "tsyringe";
import { GuildMember } from "discord.js";

@autoInjectable()
export class ModmailController implements IController {
  postgresService: PostgresService;

  constructor(postgresService: PostgresService) {
    this.postgresService = postgresService;
  }

  testFunction = async (req, res) => {
    return res.json({
      success: true,
    })
  }

  getRouter = (): Router => {
    const router = Router();

    // Initial authentication
    router.get("/notes", this.testFunction);
    // Re-authorize existing token.
    router.get("/discord", this.testFunction);
  
    return router;
  }
}