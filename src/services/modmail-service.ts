import { autoInjectable, inject } from 'tsyringe';
import * as Knex from 'knex';
import ModmailHelper from '../helpers/modmail-helper';

@autoInjectable()
export default class ModmailService {
  config: Config;

  knex: any;

  modmailHelper: ModmailHelper;

  constructor(@inject('Config') config: Config) {
    this.modmailHelper = new ModmailHelper(global.DiscordBot);
    this.config = config;

    this.knex = Knex({
      client: 'pg',
      connection: config.Database,
    });
  }

  getActiveConversations = async (): Promise<Conversation[]> => this.knex('modmail.conversations')
    .where({ active: true })
    .select('*')
    .then((columns): Conversation[] => columns
      .map((row): Conversation => this.modmailHelper.formatConversation(row)))
    .catch(() => ({} as Conversation[]))

  getFullConversation = async (conversationID: bigint, reqUrl: string): Promise<FullConversation> => this.knex('modmail.conversations')
    .join('modmail.all_messages_attachments', 'conversations.conversation_id', '=', 'all_messages_attachments.conversation_id')
    .where({ 'conversations.conversation_id': conversationID.toString() })
    .select('*')
    .then((columns): FullConversation => ({
      Conversation: this.modmailHelper.formatConversation(columns[0]),
      Messages: columns
        .map((column) => this.modmailHelper.formatConversationMessage(column, reqUrl)),
    }))
    .catch(() => ({
      status: 404,
      message: 'Conversation not found',
    }))

  getAttachment = async (messageID: string): Promise<any> => this.knex('modmail.all_messages_attachments')
    .where({ message_id: messageID })
    .select('*')
    .then((columns) => columns[0].attachment)
    .catch(() => ({
      error: 404,
      message: 'File not found.',
    }))

  getCategoryPermissions = async (categoryID: bigint): Promise<any> => this.knex('modmail.categories')
    .join('modmail.permissions', 'categories.category_id', '=', 'permissions.category_id')
    .where({
      'permissions.active': true,
      'categories.category_id': categoryID.toString(),
    })
    .select('*')
    .on('query-response', (response: Promise<any>) => response)
    .catch((err: Error) => ({
      error: err,
    }))
}
