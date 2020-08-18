import "reflect-metadata";

import * as express from "express";
import { ConfigService } from "./services/config-service";
import { AuthController } from "./controllers/auth-controller";
import { ModmailController } from "./controllers/modmail-controller";
import { container } from "tsyringe";
import { IController } from "./types/controllers";
import * as bodyParser from "body-parser";
import * as discordjs from 'discord.js';

// Entry point for the app.
const mainAsync = async () => {
  const app = express();

  const config = new ConfigService<Config>().loadConfigFromPath("./config.json");
  if(config == null) {
    throw new Error(`config was not read properly. Please copy config.example.json and fill in the
                      properties.`)
  }

  container.register<Config>("Config", { useValue: config });
  
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    console.log(`${req.method} - ${req.url}\n`)
    next();
  })

  app.use((req, res, next) => {
    next();
  })

  app.use("/auth", container.resolve<IController>(AuthController).getRouter())

  app.use("/modmail", container.resolve<IController>(ModmailController).getRouter())

  app.listen(8080, () => {
    console.log("Starting the bot...");
  });
};

mainAsync();