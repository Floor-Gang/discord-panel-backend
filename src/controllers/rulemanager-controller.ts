import { IController } from '../types/controllers';
import { Router } from 'express';
import { RuleManagerService } from '../services/rulemanager-service';
import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class RuleManagerController implements IController {
  RuleManagerService: RuleManagerService;

  constructor(RuleManagerService: RuleManagerService) {
    this.RuleManagerService = RuleManagerService;
  }

  getRuleSettings = async (req, res) => {
    return res.json(await this.RuleManagerService.getServerRules())
  }

  setRuleSettings = async (req, res) => {
    const data: postRules = req.body;
    const response: { success: boolean } =  await this.RuleManagerService.setServerRules(data.rules, data.channel, req.user.ID)

    if (!response.success) {
      res.status(401)
    }

    return res.json(response)
  }

  // Get the channels that you can pick from :)
  getChannels = async (req, res) => {
    const data = await this.RuleManagerService.getServerChannelData();
    return res.json(data)
  }

  getRouter = (): Router => {
    const router = Router();

    // Nothing to do with auth just uhm 
    router.get('/get', this.getRuleSettings)

    // Posting the rules.
    router.post('/set', this.setRuleSettings)

    // Get the channels that you can post them in
    router.get('/channels', this.getChannels)
  
    return router;
  }
}
