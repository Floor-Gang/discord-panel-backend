import { Router } from 'express';
import { autoInjectable } from 'tsyringe';
import { IController } from '../types/controllers';
import ModmailService from '../services/modmail-service';

@autoInjectable()
export default class ModmailController implements IController {
  modmailService: ModmailService;

  constructor(modmailService: ModmailService) {
    this.modmailService = modmailService;
  }

  getActiveConversations = async (req, res: any) => res
    .json(await this.modmailService.getActiveConversations())

  getFullConversation = async (req, res: any) => {
    const data = await this.modmailService.getFullConversation(req.params.conversation, `${req.protocol}://${req.get('Host')}`);

    if (data) {
      res.status(400);
      return res.json(data);
    }

    return res.json(data);
  }

  getAttachment = async (req, res: any) => {
    const data = await this.modmailService.getAttachment(req.params.message);

    if (data.error !== undefined) {
      res.status(404);
      return res.json(data);
    }

    return res.end(data, 'binary');
  }

  getCategoryPermissions = async (req, res: any) => {
    const data = await this.modmailService.getCategoryPermissions(req.params.category);

    if (data == null) {
      res.status(400);
      return res.json(data.error);
    }

    return res.json(data);
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
