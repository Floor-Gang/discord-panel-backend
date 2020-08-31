import { Router } from 'express';
import { autoInjectable, inject } from 'tsyringe';
import RuleManagerService from '../services/rulemanager-service';
import { IController } from '../types/controllers';

type resp = {
  success: boolean
}

@autoInjectable()
export default class RuleManagerController implements IController {
  ruleManagerService: RuleManagerService;

  Config: Config;

  constructor(@inject('Config') config: Config, service: RuleManagerService) {
    this.ruleManagerService = service;
    this.Config = config;
  }

  getRuleSettings = async (req, res) => res.json(await this.ruleManagerService.getServerRules())

  setRuleSettings = async (req, res) => {
    const data: postRules = req.body;
    const response: resp = await this.ruleManagerService
      .setServerRules(data.rules, data.channel, req.user.ID);

    if (!response.success) {
      res.status(401);
    }

    return res.json(response);
  }

  // Get the channels that you can pick from :)
  getChannels = async (req, res) => {
    const data = await this.ruleManagerService.getServerChannelData();
    return res.json(data);
  }

  getRouter = (): Router => {
    const router = Router();

    // Authenticate
    global.middlewareRoles(this.Config.Permissions.ruleManager);

    // Nothing to do with auth just uhm
    router.get('/get', this.getRuleSettings);

    // Posting the rules.
    router.post('/set', this.setRuleSettings);

    // Get the channels that you can post them in
    router.get('/channels', this.getChannels);

    return router;
  }
}
