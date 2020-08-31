import { autoInjectable, inject } from 'tsyringe';
import { Pool } from 'pg';
// eslint-disable-next-line no-unused-vars
import * as discordjs from 'discord.js';

@autoInjectable()
export default class RuleManagerService {
  config: Config;

  postgres: Pool;

  constructor(@inject('Config') config: Config) {
    this.postgres = new Pool(config.Database);
    this.config = config;
  }

  getServerRules = async () => this.postgres
    .query(`select * from ${this.config.Rules.tableName} order by id desc  limit 1`)
    .then((res) => res.rows[0].rules)
    .catch(() => ({
      error: true,
    }))

  logRuleChange = async (newRules, userID) => this.postgres
    .query(`INSERT INTO ${this.config.Rules.tableName} (user_id, rules) VALUES ($1, $2)`, [userID, JSON.stringify(newRules)])
    .then(() => true)
    .catch(() => false)

  setServerRules = async (newRules, ChannelID, userID) => {
    const actChannel = global.DiscordBot.channels.cache.get(ChannelID) as discordjs.TextChannel;
    return actChannel.bulkDelete(100)
      .then(async () => {
        newRules.forEach((embed) => {
          this.sendChannelMessage(ChannelID, { embed });
        });

        // Log changes in the db.
        const logRules = await this.logRuleChange(newRules, userID);

        if (logRules) {
          return {
            success: true,
          };
        }

        return {
          success: false,
        };
      })
      .catch(async (err: discordjs.DiscordAPIError) => actChannel.messages.fetch({ limit: 100 })
        .then((messageCollection: any) => {
          messageCollection.forEach((message) => {
            message.delete();
          });

          newRules.forEach((embed) => {
            this.sendChannelMessage(ChannelID, { embed });
          });

          return {
            success: true,
          };
        })
        .catch(() => {
          global.ErrorLogGlobal('setServerRules', global.DiscordBot.users.cache.get(userID).tag, err);

          return {
            success: false,
          };
        }));
  }

  sendChannelMessage = (channelID, message) => {
    const channel = global.DiscordBot.channels.cache.get(channelID) as discordjs.TextChannel;
    channel.send(message);
  }

  getServerChannelData = () => {
    const channels = global.DiscordBot.guilds.cache
      .get(this.config.DiscordGuildID)
      .channels.cache
      .filter((channel) => channel.parentID === this.config.Rules.categoryID)
      .map((obj): any => ({
        id: obj.id,
        name: `#${obj.name}`,
      }));

    return channels.filter((x) => x);
  }
}
