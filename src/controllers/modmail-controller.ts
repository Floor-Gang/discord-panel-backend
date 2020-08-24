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

  getActiveConversations = async (req, res: any) => {
    const data = await this.ModmailService.getActiveConversations();
    if (data == null) { 
      res.status(400)
      return res.json(data.error)
    }
    return res.json(data)
  }

  getAll = async (req, res: any) => {
    const data = await this.ModmailService.getAllEntries(req.params.table);
    if (data == null) {
      res.status(400)
      return res.json(data.error)
    }
    return res.json(data)
  }

  getFullConversation = async (req, res: any) => {
    const data = await this.ModmailService.getFullConversation(req.params.conversationID)
    if (data == null) {
      res.status(400)
      return res.json(data.error)
    }
    return res.json(data)
  }

  getAllActiveOrInactive = async (req, res: any) => {
    const data = await this.ModmailService.getAllActiveOrInactiveEntries(req.params.table, req.params.active)
    if (data == null) {
      res.status(400)
      return res.json(data.error)
    }
    return res.json(data)
  }

  getCategoryPermissions = async (req, res: any) => {
    const data = await this.ModmailService.getCategoryPermissions(req.params.categoryID)
    if (data == null) {
      res.status(400)
      return res.json(data.error)
    }
    return res.json(data)
  }

  getRouter = (): Router => {
    const router = Router();

    // Get all active conversations
    router.get('/conversations/active/get', this.getActiveConversations);
    // Get all messages and attachments for a conversation
    router.get('/conversation/:conversationID/full', this.getFullConversation);
    // Get all entries from a table in the modmail schema
    router.get('/:table/all', this.getAll);
    // Get all active or inactive entries from a table in the modmail schema
    router.get('/:table/:active/all', this.getAllActiveOrInactive);
    // Get all active permissions for a category
    router.get('/category/:categoryID/permissions', this.getCategoryPermissions);
  
    return router;
  }
}
