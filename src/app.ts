import 'reflect-metadata';

import * as express from 'express';
import { ConfigService } from './services/config-service';
import { container } from 'tsyringe';
import { IController } from './types/controllers';
import * as bodyParser from 'body-parser';
import * as discordjs from 'discord.js';
import * as cors from 'cors';

// Controllers
import { AuthController } from './controllers/auth-controller';
import { ModmailController } from './controllers/modmail-controller';
import { RuleManagerController } from './controllers/rulemanager-controller';

// Entry point for the app.
const mainAsync = async () => {
  const app = express();

  const config = new ConfigService<Config>().loadConfigFromPath('./config.json');
  if(config == null) {
    throw new Error(`config was not read properly. Please copy config.example.json and fill in the
                      properties.`)
  }

  container.register<Config>('Config', { useValue: config });

  // Initialize the discord bot
  global.DiscordBot = new discordjs.Client();
  global.DiscordBot.login(config.DiscordToken);

  app.use(bodyParser.json());
  app.use(cors())
  app.use(bodyParser.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Intended log for live debugging.
    console.log(`${req.method} - ${req.url}\n`)
    next();
  })

  app.use(async (req, res, next) => {
    if(req.url.startsWith('/auth/')) {
      // URL Starts with /auth/ AKA is authorizing / logging in.
      return next();
    }

    const authCode = req.header('Authorization');

    if(!authCode) {
      return error(res);
    }

    if (await global.authenticateUser(authCode, config.Permissions.defaultRole)) {
      return next();
    }

    return error(res);
  })

  app.use(async (req: any, res, next) => {
    if (!(req.url).startsWith('/auth/')) {
      // This is pretty pog. Get user data anywhere by doing req.user
      const userData = await global.getUserInfo(req.header('Authorization'));

      if (userData.error.error) {
        return error(res);
      }

      req.user = userData.user;
    }

    next();
  })

  // Authentication for inside the controller
  global.middlewareRoles = (checkRoles: string[]) => {
    app.use((req: any, res, next) => {
      if (!req.user.Roles.some((role) => checkRoles.includes(role.ID))) {
       return error(res);
      }

      return next();
    })
  };

  // Attach controllers
  app.use('/auth', container.resolve<IController>(AuthController).getRouter())
  app.use('/modmail', container.resolve<IController>(ModmailController).getRouter())
  app.use('/rule-manager', container.resolve<IController>(RuleManagerController).getRouter())

  // Start that boy
  app.listen(config.ExpressPort, () => {
    console.log('Starting the bot...');
  });

  global.DiscordBot.on('ready', () => {
    console.log('Started! Backend running')
  })

  // If authentication fails ^
  const error = (res) => {
    return res.status(401)
    .json({
      status: 401,
      message: "Unauthorized",
    });
  };

  // Error embed sender
  global.ErrorLogGlobal = async (title, tagUser, err) => {
    const channel = global.DiscordBot.channels.cache.get(config.ErrorLogChannel) as discordjs.TextChannel;
    return await channel.send(new discordjs.MessageEmbed()
      .setColor('#d13434')
      .setTitle(`Fatal error ${title}`)
      .setDescription(`Action ran by **${tagUser}**`)
      .addField('Error', err.message, false)
      .addField('Path', err.path, false)
      .setTimestamp()
      .setFooter(`HTTP Status: ${err.httpStatus}`, global.DiscordBot.user.avatarURL()))
    .then(() => {
      return true;
    })
    .catch((err) => {
      return false;
    })
  }
};

mainAsync();
