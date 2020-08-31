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

  initAuthorize = async (code: string): Promise<any> => axios({
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
    .then((response) => response.data)
    .catch((err) => err.response);

  getCurrentUser = async (accessKey: string) => this.createDiscordRequest(accessKey, '/users/@me')
    .then((data) => ({
      error: !data?.username,
      user: data,
    }))

  authenticateCurrentUser = async (Key: string, checkRoles: string[]): Promise<boolean> => this
    .getCurrentUser(Key)
    .then(async (data) => {
      if (data.error) {
        return false;
      }

      return this.getGuildRoles(data.user.id)
        .then((userRoles) => userRoles.some((role) => checkRoles.includes(role.ID)))
        .catch(() => false);
    })

  getParsedInfo = async (code: string): Promise<any> => {
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
      global.ErrorLogGlobal('Authentication', memberInfo.user.tag, {
        httpStatus: 400,
        message: 'Missing required roles, attempted to access panel.',
        path: '/auth/discord?code=HIDDEN_FOR_PRIVACY_REASONS',
      });

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

  getGuildRoles = async (memberID: string): Promise<MemberRole[]> => this
    .getMember(memberID).roles.cache
    .sort((a: Role, b: Role) => a.position - b.position || Number(a.id) - Number(b.id))
    .map((role): MemberRole => ({
      ID: role.id,
      Name: role.name,
      Color: role.hexColor,
    })).reverse();

  getMember = (memberID): GuildMember => global.DiscordBot.guilds.cache
    .get(this.config.DiscordGuildID)
    .members.cache.get(memberID)

  createDiscordRequest = async (accessKey: string, path: string) => axios.get(`https://discord.com/api/v6${path}`, {
    headers: {
      Authorization: `Bearer ${accessKey}`,
    },
  }).then((response) => response.data)
    .catch((err) => err.response)
}
