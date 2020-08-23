import {autoInjectable, inject} from "tsyringe";
import axios from "axios";
import * as qs from "qs";
import * as discordjs from 'discord.js';

@autoInjectable()
export class DiscordService {
  config: Config;

  oauthAccessToken: string;
  oauthSecretToken: string;
  oauthRedirectUrl: string;
  oauthScopes: string[];

  constructor(@inject("Config") config: Config) {
    this.config = config;

    this.oauthAccessToken = config.DiscordAccessKey;
    this.oauthSecretToken = config.DiscordSecretKey;
    this.oauthRedirectUrl = config.DiscordRedirectUrl;
    this.oauthScopes = config.DiscordScopes;
  }

  initAuthorize = async (code) => {  
    const response = await axios({
      method: 'POST',
      headers: { 
        'content-type': 'application/x-www-form-urlencoded' 
      },
      data: qs.stringify({
        client_id: this.oauthAccessToken,
        client_secret: this.oauthSecretToken,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.oauthRedirectUrl,
        scope: this.oauthScopes.join(" ")
      }),
      url: 'https://discord.com/api/v6/oauth2/token',
    })
    .catch((err) => {
      return err.response;
    });

    return response.data;
  };

  getCurrentUser = async (accessKey) => {
    return await this._createDiscordRequest(accessKey, `/users/@me`)
    .then((data) => {
      return {
        error: false,
        user: data,
      };
    })
    .catch((err) => {
      console.log(`discord-service - GetCurrentUser ${err.response}`);
  
      return {
        error: true,
        user: {},
      }
    });
  };

  authenticateCurrentUser = async (accessKey: string, checkRoles: string[]) => {
    return await this.getCurrentUser(accessKey)
    .then(async(data) => {
      if (data.error) {
        return false;
      }

      return await this.getGuildRoles(data.user.id)
      .then((userRoles) => {
        return userRoles.some((role) => checkRoles.includes(role.ID))
      })
      .catch((err) => {
        return false;
      })
    })
  };

  getParsedInfo = async (code) => {
    let userData = await this.getCurrentUser(code);

    if (userData.error) {
      // Probably 401 - unauthorized. AKA Invalid auth code.
      return {
        error: {
          error: true,
          message: 'Error while authenticating user.'
        },
        user: {}
      };
    }

    let memberInfo: discordjs.GuildMember = this.getMember(userData.user.id);
    let userRoles = await this.getGuildRoles(userData.user.id);

    return {
      error: {
        error: false,
        message: ''
      },
      user: {
        AccessToken: code,
        ID: userData.user.id,
        Email: userData.user.email,
        AvatarHash: userData.user.avatar,
        ProfileURL: userData.user.user.avatarURL(),
        Username: `${userData.user.username}#${memberInfo.user.discriminator}`,
        Roles: userRoles,
      }
    }
  }

  getGuildRoles = async (memberID) => {
    const roles: Role[] = [];
    const member: discordjs.GuildMember = this.getMember(memberID);
    const actRoles = member.roles.cache.sort((a: discordjs.Role, b: discordjs.Role) => a.position - b.position || Number(a.id) - Number(b.id));

    actRoles.forEach(role => {
      roles.push({
        ID: role.id,
        Name: role.name,
        Color: role.hexColor
      })
    });

    // Sort from highest role in the hierarchy to lowest.
    return roles.reverse();
  };

  getMember = (memberID) => {
    return global.DiscordBot.guilds.cache.get(this.config.DiscordGuildID).members.cache.get(memberID)
  }

  _createDiscordRequest = async (accessKey, path) => {
    const response =  await axios.get(`https://discord.com/api/v6${path}`, {
      headers: {
        "Authorization": `Bearer ${accessKey}`
      }
    });

    return response.data;
  }
}
