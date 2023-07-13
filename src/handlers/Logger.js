"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Logger {
    constructor(bot) {
        this.bot = bot;
    }
    async log_error(response) {
        const data = {
            error_id: response.error_code || "custom",
            error_message: response.error_message,
            command_name: response.interaction.commandName,
            user_ID: response.interaction.user.id,
            guild_ID: response.interaction.guild.id,
            timestamp: new Date(),
        };
        // @ts-ignore
        return await new this.bot.models.logs({ ...data }).save();
    }
}
exports.default = Logger;
