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
    return res.json(await this.ModmailService.activeConversations())
  }

  getAll = async (req, res: any) => {
    return res.json(await this.ModmailService.allEntries(req.params.table))
  }

  getFullConversation = async (req, res: any) => {
    return res.json(await this.ModmailService.fullConversation(req.params.conversationID))
  }

  getAllActiveOrInactive = async (req, res: any) => {
    return res.json(await this.ModmailService.allEntriesBool(req.params.table, req.params.active))
  }

  getCategoryPermissions = async (req, res: any) => {
    return res.json(await this.ModmailService.categoryPermissions(req.params.categoryID))
  }

  getRouter = (): Router => {
    const router = Router();

    // Get all active conversations
    router.get("/conversations/active/get", this.getActiveConversations);
    // Get all messages and attachments for a conversation
    router.get("/conversation/:conversationID/full", this.getFullConversation);
    // Get all entries from a table in the modmail schema
    router.get("/:table/all", this.getAll);
    // Get all active or inactive entries from a table in the modmail schema
    router.get("/:table/:active/all", this.getAllActiveOrInactive);
    // Get all active permissions for a category
    router.get("/category/:categoryID/permissions", this.getCategoryPermissions);
  
    return router;
  }
}
