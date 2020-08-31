import { autoInjectable, inject } from 'tsyringe';
import axios from 'axios';
import * as qs from 'qs';
import { GuildMember, Role } from 'discord.js';

@autoInjectable()
export default class DiscordService {
  config: Config;

  oauthAccessToken: string;

  oauthSecretToken: string;

  oauthRedirectUrl: string;

  oauthScopes: string[];

  constructor(@inject('Config') config: Config) {
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
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: qs.stringify({
        client_id: this.oauthAccessToken,
        client_secret: this.oauthSecretToken,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.oauthRedirectUrl,
        scope: this.oauthScopes.join(' '),
      }),
      url: 'https://discord.com/api/v6/oauth2/token',
    })
      .catch((err) => err.response);

    return response.data;
  };

  getCurrentUser = async (accessKey) => this.createDiscordRequest(accessKey, '/users/@me')
    .then((data) => ({
      error: false,
      user: data,
    }))
    .catch(() => ({
      error: true,
      user: {},
    }));

  authenticateCurrentUser = async (Key: string, checkRoles: string[]) => this.getCurrentUser(Key)
    .then(async (data) => {
      if (data.error) {
        return false;
      }

      return this.getGuildRoles(data.user.id)
        .then((userRoles) => userRoles.some((role) => checkRoles.includes(role.ID)))
        .catch(() => false);
    })

  getParsedInfo = async (code) => {
    const userData = await this.getCurrentUser(code);

    if (userData.error) {
      // Probably 401 - unauthorized. AKA Invalid auth code.
      return {
        error: {
          error: true,
          message: 'Error while authenticating user.',
        },
        user: {},
      };
    }

    const memberInfo: GuildMember = this.getMember(userData.user.id);
    const userRoles = await this.getGuildRoles(userData.user.id);

    if (!userRoles.some((role) => (this.config.Permissions.defaultRole).includes(role.ID))) {
      // eslint-disable-next-line no-console
      console.log(`${userData.user.username}#${memberInfo.user.discriminator} Attempted to access the panel.`);

      return {
        error: {
          error: true,
          message: 'You don\'t have the required roles',
        },
        user: {},
      };
    }

    return {
      error: {
        error: false,
        message: '',
      },
      user: {
        AccessToken: code,
        ID: userData.user.id,
        Email: userData.user.email,
        AvatarHash: userData.user.avatar,
        ProfileURL: memberInfo.user.avatarURL(),
        Username: `${userData.user.username}#${memberInfo.user.discriminator}`,
        Roles: userRoles,
      },
    };
  }

  getGuildRoles = async (memberID) => {
    const roles: MemberRole[] = [];
    const member: GuildMember = this.getMember(memberID);
    const actRoles = member.roles.cache
      .sort((a: Role, b: Role) => a.position - b.position || Number(a.id) - Number(b.id));

    actRoles.forEach((role) => {
      roles.push({
        ID: role.id,
        Name: role.name,
        Color: role.hexColor,
      });
    });

    // Sort from highest role in the hierarchy to lowest.
    return roles.reverse();
  };

  getMember = (memberID) => global.DiscordBot.guilds.cache
    .get(this.config.DiscordGuildID)
    .members.cache.get(memberID)

  createDiscordRequest = async (accessKey, path) => {
    const response = await axios.get(`https://discord.com/api/v6${path}`, {
      headers: {
        Authorization: `Bearer ${accessKey}`,
      },
    });

    return response.data;
  }
}
