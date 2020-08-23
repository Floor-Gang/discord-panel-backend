type Config = {
  ExpressPort: number,
  DiscordToken: string;
  DiscordAccessKey: string;
  DiscordSecretKey: string;
  DiscordRedirectUrl: string;
  DiscordGuildID: string;
  DiscordScopes: string[];
  Database: object;
  Rules: {
    tableName: string;
    categoryID: string;
  }
  Permissions: {
    defaultRole: string[];
    ruleManager: string[];
  }
}

type Member = {
  AccessToken: string;
  ID: string;
  Email: string;
  AvatarHash: string,
  ProfileURL: string,
  Username: string,
  Roles: Role[]
}

type Role = {
  ID: string;
  Name: string;
  Color: string;
}

type postRules = {
  rules: object[];
  channel: string;
}