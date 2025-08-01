import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { game } from '../Ito';

const flags = MessageFlags.Ephemeral;

const registration = {
  launch: {
    data: new SlashCommandBuilder().setName('launch').setDescription('伊東ではありません'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      game.create(interaction);
      await interaction.reply({ content: '伊東ではありません', flags });
    },
  },
  reset: {
    data: new SlashCommandBuilder().setName('reset').setDescription('ゲームをリセットして終了する'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await interaction.reply({ content: '今までありがとう。君のことはきっと忘れない...', flags });
      game.remove(interaction);
    },
  },
};

type CommandName = keyof typeof registration;

export const commands = Object.values(registration).map(({ data }) => data.toJSON());
export const slashCommandsInteraction = async (interaction: ChatInputCommandInteraction) => {
  if (!(interaction.channel instanceof TextChannel)) {
    await interaction.reply({ content: 'ほ？', flags });
    return;
  }
  const commandName = interaction.commandName as CommandName;
  await registration[commandName].execute(interaction);
};
