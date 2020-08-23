import * as discordjs from 'discord.js';

declare global {
  namespace NodeJS {
    interface Global {
      DiscordBot: discordjs.Client;
      authenticateUser: any;
      getUserInfo: any;
    }
  }
}