import * as discordjs from 'discord.js';

declare global {
  namespace NodeJS {
    interface Global {
      DiscordBot: discordjs.Client;
      authenticateUser: (accessKey: string, checkRoles: string[]) => any;
      getUserInfo: (code: string) => any;
      middlewareRoles: (checkRoles: string[]) => any;
    }
  }
}
