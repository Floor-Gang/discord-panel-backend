import {autoInjectable, inject} from "tsyringe";

@autoInjectable()
export class DiscordService {
    config: Config;
    
    constructor(@inject("Config") config: Config) {
        this.config = config;
    }
}