type Config = {
  DiscordToken: string;
  DiscordAccessKey: string;
  DiscordSecretKey: string;
  DiscordRedirectUrl: string;
  DiscordGuildID: string;
  DiscordScopes: string[];
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