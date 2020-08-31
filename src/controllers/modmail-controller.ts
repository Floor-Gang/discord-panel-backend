import { IController } from '../types/controllers';
import { Router } from 'express';
import { ModmailService } from '../services/modmail-service';
import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class ModmailController implements IController {
  modmailService: ModmailService;

  constructor(ModmailService: ModmailService) {
    this.modmailService = ModmailService;
  }

  getActiveConversations = async (req, res: any) => {
    return res.json(await this.modmailService.getActiveConversations())
  }

  getFullConversation = async (req, res: any) => {
    const data = await this.modmailService.getFullConversation(req.params.conversation)

    if (data === null) {
      res.status(400)
      return res.json(data.error)
    }

    return res.json(data)
  }

  getAttachment = async (req, res: any) => {
    const data = await this.modmailService.getAttachment(req.params.message);

    if (data.error !== undefined) {
      res.status(404);
      return res.json(data);
    }

    return res.end(data, 'binary')
  }

  getCategoryPermissions = async (req, res: any) => {
    const data = await this.modmailService.getCategoryPermissions(req.params.category)

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
    router.get('/conversation/:conversation/full', this.getFullConversation);

    // Get attachment of the message
    router.get('/attachment/:message', this.getAttachment);

    // Get all active permissions for a category
    router.get('/category/:category/permissions', this.getCategoryPermissions);

    return router;
  }
}
