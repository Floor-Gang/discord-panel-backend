import {autoInjectable, inject} from "tsyringe";
import { ModmailHelper } from './../helpers/modmail-helper';

class BaseError {
  constructor () {
    const error = Error.apply(this, arguments);

    Object.defineProperty(error, 'message', {
      get() {
        return arguments
      }
    });

    Error.captureStackTrace(error, BaseError);
    return error;
  }
}

class ValueError extends BaseError {
  constructor (public wrong_value: string, public accepted_values: Array<string>) {
    super();

    Object.defineProperty(super(), 'name', {
      get() {
        return 'ValueError'
      }
    });
  }
}

@autoInjectable()
export class ModmailService {
  config: Config;
  knex: typeof require;
  modmailHelper: ModmailHelper;

  constructor(@inject("Config") config: Config) {
    this.modmailHelper = new ModmailHelper(global.DiscordBot);
    this.config = config;

    this.knex = require('knex')({
      client: 'pg',
      connection: config.Database
    });
  }

  getActiveConversations = async (): Promise<Conversation[]> => {
    return await this.knex('modmail.conversations')
     .where({'active': true})
     .select('*')
     .then((columns): Conversation[] => {
        return columns.map((row): Conversation => {
          return this.modmailHelper.formatConversation(row);
        });
     }).catch((err) => {
      console.log(err)

      return {} as Conversation[];
     })
  }

  getFullConversation = async (conversationID: bigint, reqUrl: string): Promise<any> => {
    let conversations: Array<object>;
    conversations = await this.knex('modmail.conversations')
     .select('conversation_id')
     .catch((err: Error) => {
      return null
    })

    let conversationIDs = [];
    for (let convID of conversations) {
      conversationIDs.push(Object.values(convID)[0]);
    }

    if (!conversationIDs.some(x => x === conversationID.toString())) {
      return new ValueError(conversationID.toString(), conversationIDs)
    }

    return this.knex('modmail.conversations')
      .join('modmail.all_messages_attachments', 'conversations.conversation_id', '=', 'all_messages_attachments.conversation_id')
      .where({'conversations.conversation_id': conversationID.toString()})
      .select('*')
      .then((columns) => {
        return {
          Conversation: this.modmailHelper.formatConversation(columns[0]),
          Messages: columns.map((column) => { return this.modmailHelper.formatConversationMessage(column, reqUrl) }),
        };
      })
      .catch((err: Error) => {
        return {
          error: err
        }
      })
  }

  getAttachment = async (messageID: string): Promise<any>  => {
    return this.knex('modmail.all_messages_attachments')
      .where({message_id: messageID})
      .select('*')
      .then((columns) => {
        return columns[0].attachment;
      })
      .catch((err) => {
        return {
          error: 404,
          message: 'File not found.'
        }
      })
  }

  getCategoryPermissions = async (categoryID: bigint): Promise<any> => {
    let categories: string[];

    categories = await this.knex('modmail.categories')
     .select('category_id')
     .catch((err: Error) => {
      return null
    })

    let categoryIDs = [];
    for (let catID of categories) {
      categoryIDs.push(Object.values(catID)[0]);
    }

    if (!categoryIDs.some(x => x === categoryID.toString())) {
      return new ValueError(categoryID.toString(), categoryIDs)
    }

    return this.knex('modmail.categories')
     .join('modmail.permissions', 'categories.category_id', '=', 'permissions.category_id')
     .where({
       'permissions.active': true,
       'categories.category_id': categoryID.toString()
      })
     .select('*')
     .on('query-response', (response: Promise<any>) => {
      return response
    })
     .catch((err: Error) => {
      return {
        error: err
      }
    })
  }
}
