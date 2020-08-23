import { IController } from '../types/controllers';
import { Router } from 'express';
import { ModmailService } from '../services/modmail-service';
import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class ModmailController implements IController {
  ModmailService: ModmailService;

  constructor(ModmailService: ModmailService) {
    this.ModmailService = ModmailService;
  }

  testFunction = async (req, res) => {
    return res.json(this.ModmailService.getModmails())
  }

  getRouter = (): Router => {
    const router = Router();

    // Get all modmails
    router.get('/get/all', this.testFunction);
  
    return router;
  }
}