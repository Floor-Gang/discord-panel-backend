import {autoInjectable, inject} from "tsyringe";

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
  postgresTables: string[];
  knex: typeof require;

  constructor(@inject("Config") config: Config) {
    this.knex = require('knex')({
      client: 'pg',
      connection: config.Database
    });
    this.config = config;
    this.postgresTables = [
      'all_messages_attachments',
      'categories',
      'conversations',
      'messages',
      'muted',
      'notes',
      'permissions',
      'standardreplies',
    ];
  }

  async getActiveConversations(): Promise<any> {
    return this.knex('modmail.conversationsbingbong')
     .where({'active': true})
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

  async getFullConversation(conversationID: bigint): Promise<any> {
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
     .on('query-response', (response: Promise<any>) => {
       return response
     })
      .catch((err: Error) => {
        return {
          error: err
        }
     })
  }

  async getAllEntries(table: string): Promise<any> {
    if (!this.postgresTables.some(x => x === table)) {
      return new ValueError(table, this.postgresTables)
    }

    return this.knex(`modmail.${table}`)
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

  async getAllActiveOrInactiveEntries(table: string, active: boolean): Promise<any> {
    if (!this.postgresTables.some(x => x === table)) {
      return new ValueError(table, this.postgresTables)
    }

    return this.knex(`modmail.${table}`)
     .where('active', active)
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

  async getCategoryPermissions(categoryID: bigint): Promise<any> {
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
