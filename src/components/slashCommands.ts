import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { game } from '../Ito';
import { makeButtonRow } from '../utils';

const flags = MessageFlags.Ephemeral;

const registration = {
  launch: {
    data: new SlashCommandBuilder().setName('launch').setDescription('伊東ではありません'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      game.create(interaction);
      let content = '人が集まったらバージョン選んではじめてこ';
      let components = [makeButtonRow('standard', 'rainbow', 'classic', 'all')];
      await interaction.reply({ content, components, flags });
      content = 'アイコンは魚のイトウだけどこのゲームのモチーフは蜘蛛の糸です';
      components = [makeButtonRow('join')];
      await (interaction.channel as TextChannel)?.send({ content, components });
    },
  },
  reset: {
    data: new SlashCommandBuilder().setName('reset').setDescription('ゲームをリセットして終了する'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      const ito = game.get(interaction);
      if (ito !== null) {
        await ito.finish(interaction, false);
      }
      game.remove(interaction);
      await interaction.reply({ content: '今までありがとう。君のことはきっと忘れない...', flags });
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
