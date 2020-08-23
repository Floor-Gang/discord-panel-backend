import { IController } from '../types/controllers';
import { Router } from 'express';
import { DiscordService } from '../services/discord-service';
import { autoInjectable } from 'tsyringe';
import { GuildMember } from 'discord.js';

@autoInjectable()
export class AuthController implements IController {
  discordService: DiscordService;

  constructor(discordService: DiscordService) {
    this.discordService = discordService;
  }

  getInitAuthDiscordAsync = async (req, res) => {
    let response = await this.discordService.initAuthorize(req.query.code);

    // Error handling ¯\_(ツ)_/¯
    if (response.error != null) {
      res.status(401)
      return res.json(response)
    }

    const memberInfo = await this.discordService.getParsedInfo(response.access_token)

    // If authcode is invalid for some reason, give status code 401
    if (memberInfo.code != null && memberInfo.code === 0) res.status(401)

    return res.json(memberInfo)
  }

  getAuthDiscordAsync = async (req, res) => {
    const memberInfo = await this.discordService.getParsedInfo(req.query.code)

    // If authcode is invalid for some reason, give status code 401
    if (memberInfo.code != null && memberInfo.code === 0) res.status(401)

    return res.json(memberInfo)
  }

  getRouter = (): Router => {
    const router = Router();

    global.authenticateUser = this.discordService.authenticateCurrentUser;
    global.getUserInfo = this.discordService.getParsedInfo;

    // Initial authentication
    router.get('/init-discord', this.getInitAuthDiscordAsync);
    // Re-authorize existing token.
    router.get('/discord', this.getAuthDiscordAsync);
  
    return router;
  }
}