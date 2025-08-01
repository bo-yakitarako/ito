import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, EmbedField } from 'discord.js';
import { button } from './components/buttons';

export function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  let shuffledArray: T[] = [];
  while (copy.length > 0) {
    const index = Math.floor(Math.random() * copy.length);
    shuffledArray = [...shuffledArray, copy[index]];
    copy.splice(index, 1);
  }
  return shuffledArray;
}

type ButtonKey = keyof typeof button;
export const makeButtonRow = (...buttonKeys: ButtonKey[]) => {
  const buttons = buttonKeys.map((key) => button[key]);
  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
};

const color = 0xe8d44f;

export const buildEmbed = (
  title: string,
  ...params: [string] | [EmbedField[]] | [string, EmbedField[]]
) => {
  let description = '';
  let fields: EmbedField[] = [];
  if (typeof params[0] === 'string') {
    description = params[0];
    if (params[1] instanceof Array) {
      fields = params[1];
    }
  } else {
    fields = params[0];
  }
  const embed = new EmbedBuilder();
  embed.setTitle(title);
  embed.setColor(color);
  if (description) {
    embed.setDescription(description);
  }
  if (fields.length > 0) {
    embed.addFields(fields);
  }
  return embed;
};
