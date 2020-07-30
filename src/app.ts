import "reflect-metadata";

import * as express from "express";
import { ConfigService } from "./services/config-service";
import { AuthController } from "./controllers/auth-controller";
import { container } from "tsyringe";
import { IController } from "./types/controllers";

// Entry point for the app.
const mainAsync = async () => {
    const app = express();

    const config = new ConfigService<Config>().loadConfigFromPath("./config.json");
    if(config == null) {
        throw new Error(`config was not read properly. Please copy config.example.json and fill in the
                         properties.`)
    }
    container.register<Config>("Config", { useValue: config });

    app.use("/auth", container.resolve<IController>(AuthController).getRouter());

    app.listen(8080, () => {
        console.log("backend running.");
    });
};

mainAsync();