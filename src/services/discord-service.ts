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
      return data;
    })
    .catch((err) => {
      return err.response
    });
  };

  getParsedInfo = async (code) => {
    let userData = await this.getCurrentUser(code);

    if (userData.status != null && userData.status != 200) {
      // Probably 401 - unauthorized. AKA Invalid auth code.
      return userData.data;
    }

    let memberInfo: discordjs.GuildMember = this.getMember(userData.id);
    let userRoles = await this.getGuildRoles(userData.id);

    return {
      AccessToken: code,
      ID: userData.id,
      Email: userData.email,
      AvatarHash: userData.avatar,
      ProfileURL: memberInfo.user.avatarURL(),
      Username: `${userData.username}#${memberInfo.user.discriminator}`,
      Roles: userRoles,
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