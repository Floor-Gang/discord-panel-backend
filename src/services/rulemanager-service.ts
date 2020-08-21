import {autoInjectable, inject} from "tsyringe";
import { Pool, Client } from "pg";
import * as discordjs from 'discord.js';

@autoInjectable()
export class RuleManagerService {
  config: Config;
  postgres: Pool;

  constructor(@inject("Config") config: Config) {
    this.postgres = new Pool(config.Database)
    this.config = config;
  }

  getServerRules = async () => {
    return await this.postgres
      .query(`select * from ${this.config.Rules.tableName} order by id desc  limit 1`)
      .then((res) => {
        return res.rows[0].rules
      })
      .catch((err) => {
        return {
          error: true,
        }
      })
  }

  setServerRules = async (newRules, ChannelID) => {
    const actChannel = global.DiscordBot.channels.cache.get(ChannelID) as discordjs.TextChannel;
    return await actChannel.bulkDelete(100)
    .then(() => {
      newRules.forEach(embed => {
        this.sendChannelMessage(ChannelID, { embed: embed })
      });

      return {
        success: true
      }
    })
    .catch(async (err: discordjs.DiscordAPIError) => {
      console.log(err.message)
      // Probably 14 days old.

      return await actChannel.messages.fetch({ limit: 100 })
      .then((messageCollection: any) => {
        messageCollection.forEach(message => {
          message.delete()
        });

        newRules.forEach(embed => {
          this.sendChannelMessage(ChannelID, { embed: embed })
        });

        return {
          success: true
        }
      })
      .catch((err) => {
        console.log(err);
        return {
          success: false
        }
      })
    })
  }

  sendChannelMessage = (channelID, message) => {
    const channel = global.DiscordBot.channels.cache.get(channelID) as discordjs.TextChannel;
    channel.send(message)
  }

  getServerChannelData = () => {
   const channels = global.DiscordBot.guilds.cache.get(this.config.DiscordGuildID).channels.cache.map((obj) => {
    if (obj.parentID == this.config.Rules.categoryID) {
      return {
        id: obj.id,
        name: obj.name,
      };
    }
   })

   return channels.filter(x => x)
  }
}