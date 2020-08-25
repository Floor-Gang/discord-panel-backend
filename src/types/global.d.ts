import * as discordjs from 'discord.js';

declare global {
  namespace NodeJS {
    interface Global {
      DiscordBot: discordjs.Client;
      ErrorLogGlobal: (title: string, tagUser: string, error: discordError) => Promise<boolean>,
      authenticateUser: (accessKey: string, checkRoles: string[]) => any;
      getUserInfo: (code: string) => any;
      middlewareRoles: (checkRoles: string[]) => any;
    }
  }
}
