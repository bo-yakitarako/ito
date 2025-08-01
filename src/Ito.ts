import { Interaction, RepliableInteraction } from 'discord.js';

const guilds: { [guildId in string]: Ito } = {};
export const game = {
  get({ guildId }: Interaction) {
    if (guildId === null) {
      return null;
    }
    return guilds[guildId] ?? null;
  },
  create(interaction: RepliableInteraction) {
    const { guildId } = interaction;
    if (guildId === null) {
      return null;
    }
    guilds[guildId] = new Ito(interaction);
    return guilds[guildId];
  },
  remove({ guildId }: Interaction) {
    if (guildId === null) {
      return;
    }
    delete guilds[guildId];
  },
};

export class Ito {
  // todo
  constructor(interaction: RepliableInteraction) {}
}
