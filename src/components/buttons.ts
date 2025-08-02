import { ButtonBuilder, ButtonInteraction, ButtonStyle, MessageFlags } from 'discord.js';
import { game, Ito } from '../Ito';
import { getThemes, Version } from '../themes';

const flags = MessageFlags.Ephemeral;

const registration = {
  join: {
    component: new ButtonBuilder()
      .setCustomId('join')
      .setLabel('参加する')
      .setStyle(ButtonStyle.Primary),
    async execute(interaction: ButtonInteraction, ito: Ito) {
      await ito.join(interaction);
    },
  },
  standard: generateStartButton('standard'),
  rainbow: generateStartButton('rainbow'),
  classic: generateStartButton('classic'),
  all: generateStartButton('all'),
  displayCard: {
    component: new ButtonBuilder()
      .setCustomId('displayCard')
      .setLabel('数字カードを見る')
      .setStyle(ButtonStyle.Primary),
    async execute(interaction: ButtonInteraction, ito: Ito) {
      await ito.displayCard(interaction);
    },
  },
  submit: {
    component: new ButtonBuilder()
      .setCustomId('submit')
      .setLabel('カードを出す')
      .setStyle(ButtonStyle.Success),
    async execute(interaction: ButtonInteraction, ito: Ito) {
      await ito.submit(interaction);
    },
  },
  completeSubmit: {
    component: new ButtonBuilder()
      .setCustomId('completeSubmit')
      .setLabel('全員のカードが出し終わったら押すやつ')
      .setStyle(ButtonStyle.Success),
    async execute(interaction: ButtonInteraction, ito: Ito) {
      await ito.completeSubmit(interaction);
    },
  },
  resetSubmit: {
    component: new ButtonBuilder()
      .setCustomId('resetSubmit')
      .setLabel('カードを出し直す')
      .setStyle(ButtonStyle.Secondary),
    async execute(interaction: ButtonInteraction, ito: Ito) {
      await ito.resetSubmit(interaction);
    },
  },
  next: {
    component: new ButtonBuilder()
      .setCustomId('next')
      .setLabel('続ける')
      .setStyle(ButtonStyle.Primary),
    async execute(interaction: ButtonInteraction, ito: Ito) {
      await ito.start(interaction);
    },
  },
  finish: {
    component: new ButtonBuilder()
      .setCustomId('finish')
      .setLabel('やめる')
      .setStyle(ButtonStyle.Secondary),
    async execute(interaction: ButtonInteraction, ito: Ito) {
      await ito.finish(interaction);
    },
  },
};

function generateStartButton(version: Version) {
  const startButtonLabel: Record<Version, string> = {
    standard: '通常版',
    rainbow: 'レインポー',
    classic: 'クラシック',
    all: '全部',
  };
  const component = new ButtonBuilder()
    .setCustomId(version)
    .setLabel(startButtonLabel[version])
    .setStyle(ButtonStyle.Success);
  const execute = async (interaction: ButtonInteraction, ito: Ito) => {
    await ito.start(interaction, getThemes(version));
  };
  return { component, execute };
}

type CustomId = keyof typeof registration;

export const button = Object.fromEntries(
  (Object.keys(registration) as CustomId[]).map((id) => [id, registration[id].component] as const),
) as { [key in CustomId]: ButtonBuilder };

export const buttonInteraction = async (interaction: ButtonInteraction) => {
  const ito = game.get(interaction);
  if (ito === null) {
    await interaction.reply({ content: '`/ito`しようね', flags });
    return;
  }
  const customId = interaction.customId as CustomId;
  await registration[customId].execute(interaction, ito);
};
