import {autoInjectable, inject} from "tsyringe";
import { TextChannel, Client, CategoryChannel } from "discord.js";

@autoInjectable()
export class ModmailHelper {
  discordBot: Client;

  constructor(discordClient: Client) {
    this.discordBot = discordClient;
  }

  formatConversation = (conversationColumn): Conversation => {
    const user = global.getDiscordUser(conversationColumn.user_id).user;
    const category = this.discordBot.channels.cache.find(category => category.id === conversationColumn.category_id) as CategoryChannel;

    return {
      ConversationID: Number(conversationColumn.conversation_id),
      Active: conversationColumn.active,
      User: {
        username: user.username,
        userID: conversationColumn.user_id,
      },
      Meta: {
        GuildName: category ? category.guild.name : 'no_permission',
        CategoryName: category ? category.name : 'no_permission',
        CategoryID: conversationColumn.category_id,
        ChannelName: `#${(user.username).toLowerCase()}-${user.discriminator}`,
        ChannelID: conversationColumn.channel_id,
      },
      LastUpdatedAt: conversationColumn.last_update_at,
      CreatedAt: conversationColumn.created_at,
      ClosingDate: conversationColumn.closing_date
    }
  }

  formatConversationMessage = (message, reqUrl): ConversationMessage => {
    return {
      MessageID: message.message_id,
      Author: {
        Mod: message.made_by_mod,
        Name: global.getDiscordUser(message.author_id).user.username,
        ID: message.author_id,
      },
      Message: {
        Internal: message.internal,
        Content: message.message,
        Deleted: message.deleted,
      },
      attachment: message.attachment === null ? null : `${reqUrl}/modmail/attachment/${message.message_id}`,
      CreatedAt: message.created_at,
    };
  }
}
