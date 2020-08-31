import 'reflect-metadata';

import * as express from 'express';
import { container } from 'tsyringe';
import * as bodyParser from 'body-parser';
import * as discordjs from 'discord.js';
import * as cors from 'cors';
import { IController } from './types/controllers';
import ConfigService from './services/config-service';

// Controllers
import AuthController from './controllers/auth-controller';
import ModmailController from './controllers/modmail-controller';
import RuleManagerController from './controllers/rulemanager-controller';

// Entry point for the app.
const mainAsync = async () => {
  const app = express();

  // If authentication fails ^
  const error = (res) => res.status(401)
    .json({
      status: 401,
      message: 'Unauthorized',
    });

  const config = new ConfigService<Config>().loadConfigFromPath('./config.json');
  if (config == null) {
    throw new Error(`config was not read properly. Please copy config.example.json and fill in the
                      properties.`);
  }

  container.register<Config>('Config', { useValue: config });

  // Initialize the discord bot
  global.DiscordBot = new discordjs.Client();
  global.DiscordBot.login(config.DiscordToken);

  app.use(bodyParser.json());
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Intended log for live debugging.
    // eslint-disable-next-line no-console
    console.log(`${req.method} - ${req.url}\n`);
    next();
  });

  app.use(async (req, res, next) => {
    if (req.url.startsWith('/auth/')) {
      // URL Starts with /auth/ AKA is authorizing / logging in.
      return next();
    }

    const authCode = req.header('Authorization');

    if (!authCode) {
      return error(res);
    }

    if (await global.authenticateUser(authCode, config.Permissions.defaultRole)) {
      return next();
    }

    return error(res);
  });

  app.use(async (req: any, res, next) => {
    if (!(req.url).startsWith('/auth/')) {
      // This is pretty pog. Get user data anywhere by doing req.user
      const userData = await global.getUserInfo(req.header('Authorization'));

      if (userData.error.error) {
        return error(res);
      }

      req.user = userData.user;
    }

    return next();
  });

  // Authentication for inside the controller
  global.middlewareRoles = (checkRoles: string[]) => {
    app.use((req: any, res, next) => {
      if (!req.user.Roles.some((role) => checkRoles.includes(role.ID))) {
        return error(res);
      }

      return next();
    });
  };

  // Attach controllers
  app.use('/auth', container.resolve<IController>(AuthController).getRouter());
  app.use('/modmail', container.resolve<IController>(ModmailController).getRouter());
  app.use('/rule-manager', container.resolve<IController>(RuleManagerController).getRouter());

  // Start that boy
  app.listen(config.ExpressPort, () => {
    // eslint-disable-next-line no-console
    console.log('Starting the bot...');
  });

  global.DiscordBot.on('ready', () => {
    // eslint-disable-next-line no-console
    console.log('Started! Backend running');
  });

  // Error embed sender
  global.ErrorLogGlobal = async (title, tagUser, err) => (global.DiscordBot.channels.cache
    .get(config.ErrorLogChannel) as discordjs.TextChannel)
    .send(new discordjs.MessageEmbed()
      .setColor('#d13434')
      .setTitle(`Fatal error ${title}`)
      .setDescription(`Action ran by **${tagUser}**`)
      .addField('Error', err.message, false)
      .addField('Path', err.path, false)
      .setTimestamp()
      .setFooter(`HTTP Status: ${err.httpStatus}`, global.DiscordBot.user.avatarURL()))
    .then(() => true)
    .catch(() => false);
};

mainAsync();
