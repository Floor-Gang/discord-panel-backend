/* eslint-disable no-unused-vars */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { GuildMember, Client } from 'discord.js';

declare global {
  namespace NodeJS {
    interface Global {
      DiscordBot: Client;
      ErrorLogGlobal: (title: string, tagUser: string, error: discordError) => Promise<boolean>,
      authenticateUser: (accessKey: string, checkRoles: string[]) => any;
      getUserInfo: (code: string) => any;
      middlewareRoles: (checkRoles: string[]) => any;
      getDiscordUser: (userID: string) => GuildMember;
    }
  }
}
