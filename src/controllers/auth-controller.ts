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

    getAuthDiscordAsync = async (req, res) => {
        let response = await this.discordService.authorize(req.query.code);
        let user = await this.discordService.getCurrentUser(response.access_token);         

        return res.json({
            response: response,
            user: user,
        });
    }

    getRouter = (): Router => {
        const router = Router();
        router.get("/discord", this.getAuthDiscordAsync);
        return router;
    }
}