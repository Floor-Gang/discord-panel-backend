import { IController } from "../types/controllers";
import { Router } from "express";
import { DiscordService } from "../services/discord-service";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export class AuthController implements IController {
    discordService: DiscordService;

    constructor(discordService: DiscordService) {
        this.discordService = discordService;
    }

    getAuthDiscordAsync = (req, res) => {
        return res.json({});
    }

    getRouter = (): Router => {
        const router = Router();
        router.get("/discord", this.getAuthDiscordAsync);
        return router;
    }
}