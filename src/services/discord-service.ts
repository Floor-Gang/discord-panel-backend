import {autoInjectable, inject} from "tsyringe";
import axios from "axios";
import * as qs from "qs";
import { response } from "express";

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

    authorize = async (code) => {  
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
          });

          return response.data;
    };

    getCurrentUser = async (accessKey) => {
        return await this._createDiscordRequest(accessKey, `/users/@me`);
    };

    getMemberById = async (accessKey, guildId, userId) => {
        return await this._createDiscordRequest(accessKey, `/guilds/${guildId}/members/${userId}`);
    };

    getGuildRoles = async (accessKey, guildId) => {
        return await this._createDiscordRequest(accessKey, `/guilds/${guildId}/roles`);
    };

    _createDiscordRequest = async (accessKey, path) => {
        const response =  await axios.get(`https://discord.com/api/v6${path}`, {
            headers: {
                "Authorization": `Bearer ${accessKey}`
            }
        });

        return response.data;
    }
}