import {
  ButtonInteraction,
  Interaction,
  MessageFlags,
  RepliableInteraction,
  TextChannel,
} from 'discord.js';
import { buildEmbed, makeButtonRow, shuffle } from './utils';

const guilds: { [guildId in string]: Ito } = {};
export const game = {
  get({ guildId }: Interaction) {
    if (guildId === null) {
      return null;
    }
    return guilds[guildId] ?? null;
  },
  create({ guildId }: RepliableInteraction) {
    if (guildId === null) {
      return null;
    }
    guilds[guildId] = new Ito();
    return guilds[guildId];
  },
  remove({ guildId }: Interaction) {
    if (guildId === null) {
      return;
    }
    delete guilds[guildId];
  },
};

const flags = MessageFlags.Ephemeral;

type Player = {
  id: string;
  name: string;
  number: number;
};

type Status = 'ready' | 'playing' | 'result';
const differentStatusMessage = {
  ready: '今やってるから待っててねー',
  playing: 'ちょ、今はやっとらんじゃろ',
  result: 'ねー終わってないってー',
};

export class Ito {
  private status: Status = 'ready';
  private themes: string[] = [];
  private attendees: Player[] = [];
  private submitted: { [playerId: string]: number } = {};
  private gameCount = 0;
  private successCount = 0;

  public async join(interaction: ButtonInteraction) {
    if (!(await this.checkStatus(interaction, 'ready'))) {
      return;
    }
    const { guild, user, channel } = interaction;
    if (this.attendees.some(({ id }) => id === user.id)) {
      await interaction.reply({ content: 'いやもうおるやん', flags });
      return;
    }
    if (this.attendees.length >= 10) {
      await interaction.reply({ content: 'おめぇの席ねぇから！', flags });
      return;
    }
    const name = guild?.members.cache.get(user.id)?.displayName ?? user.username;
    const player: Player = { id: user.id, name, number: 0 };
    this.attendees = [...this.attendees, player];
    await interaction.deferUpdate();
    await (channel as TextChannel)?.send(`${name}っちがやってきたぜぃ`);
  }

  public async start(interaction: ButtonInteraction, themes: string[] = []) {
    const status = themes.length > 0 ? 'ready' : 'result';
    if (!(await this.checkStatus(interaction, status))) {
      return;
    }
    if (this.attendees.length < 2) {
      const content = this.attendees.length < 1 ? '誰もいないよー' : 'ぼっち乙ｗｗｗｗｗｗ';
      await interaction.reply({ content, flags });
      return;
    }
    if (themes.length > 0) {
      this.themes = themes;
    }
    this.submitted = {};
    this.status = 'playing';
    this.gameCount += 1;
    this.dealNumbers();
    const embeds = [this.buildThemeEmbed(this.themes.pop()!)];
    let components = [makeButtonRow('displayCard', 'submit')];
    await (interaction.channel as TextChannel)?.send({ embeds, components });
    components = [makeButtonRow('completeSubmit', 'resetSubmit')];
    await interaction.reply({ components, flags });
  }

  private dealNumbers() {
    const numbers = shuffle([...Array(100).keys()].map((i) => i + 1));
    for (const player of this.attendees) {
      player.number = numbers.pop()!;
    }
  }

  private buildThemeEmbed(theme: string) {
    const warning =
      '・自分の数字がテーマに応じてどんなもんか話し合いましょう！\n・直接数字を言うのはNG！\n・カードは数字の小さい人から出すように！';
    const fields = [{ name: ':warning:注意:warning:', value: warning, inline: false }];
    return buildEmbed('今回のテーマ', `**${theme}**`, fields);
  }

  public async displayCard(interaction: ButtonInteraction) {
    if (!(await this.checkStatus(interaction, 'playing'))) {
      return;
    }
    const player = this.interactionPlayer(interaction);
    if (player === null) {
      const description = [...this.attendees]
        .sort((a, b) => a.number - b.number)
        .map(({ name, number }) => `${name}っち: ${number}`)
        .join('\n');
      await interaction.reply({ embeds: [buildEmbed('みんなのカード', description)], flags });
      return;
    }
    const embeds = [buildEmbed(`${player.name}っちのカード`, `**${player.number}**`)];
    await interaction.reply({ embeds, flags });
  }

  public async submit(interaction: ButtonInteraction) {
    if (!(await this.checkStatus(interaction, 'playing'))) {
      return;
    }
    const player = this.interactionPlayer(interaction);
    if (player === null) {
      await interaction.reply({ content: 'どなたー？', flags });
      return;
    }
    if (player.id in this.submitted) {
      await interaction.reply({ content: 'もう出してるやん', flags });
      return;
    }
    await interaction.deferUpdate();
    this.submitted[player.id] = player.number;
    const content = `${player.name}っちが出しやがりやがった...！`;
    await (interaction.channel as TextChannel)?.send(content);
  }

  public async completeSubmit(interaction: ButtonInteraction) {
    if (!(await this.checkStatus(interaction, 'playing'))) {
      return;
    }
    const emptyPlayers = this.attendees.filter(({ id }) => !(id in this.submitted));
    if (emptyPlayers.length > 0) {
      const content = `${emptyPlayers.map(({ name }) => `${name}っち`).join('と')}が出してないやん`;
      await interaction.reply({ content, flags });
      return;
    }
    this.status = 'result';
    const order = Object.keys(this.submitted)
      .map((id) => this.attendees.find((p) => p.id === id)!)
      .map(({ name, number }) => `**${number}** (${name}っち)`)
      .join('\n');
    const isSuccess = this.judge();
    const title = isSuccess ? '成功 :laughing:' : '失敗 :cry:';
    const color = isSuccess ? 'success' : 'failure';
    this.successCount += isSuccess ? 1 : 0;
    await (interaction.channel as TextChannel)?.send({ embeds: [buildEmbed(title, order, color)] });
    if (this.themes.length === 0) {
      await this.finish(interaction);
      return;
    }
    const content = '次行く？もう終わりにしとく？';
    const components = [makeButtonRow('next', 'finish')];
    await interaction.reply({ content, components, flags });
  }

  private judge() {
    return Object.values(this.submitted).every((num, i, arr) => i === 0 || num > arr[i - 1]);
  }

  public async resetSubmit(interaction: ButtonInteraction) {
    if (!(await this.checkStatus(interaction, 'playing'))) {
      return;
    }
    this.submitted = {};
    await interaction.deferUpdate();
    await (interaction.channel as TextChannel)?.send('出てたカードをリセットしたよ。出直してこ');
  }

  public async finish(interaction: RepliableInteraction, hasCheck = true) {
    if (this.gameCount === 0 || (hasCheck && !(await this.checkStatus(interaction, 'result')))) {
      return;
    }
    if (interaction.isButton()) {
      await interaction.deferUpdate();
    }
    const percentage = ((this.successCount / this.gameCount) * 100).toFixed(1);
    const result = `成功率: ${percentage}% (${this.successCount} / ${this.gameCount})`;
    await (interaction.channel as TextChannel)?.send({ embeds: [buildEmbed('おつ～', result)] });
    game.remove(interaction);
  }

  private interactionPlayer(interaction: RepliableInteraction) {
    return this.attendees.find(({ id }) => id === interaction.user.id) ?? null;
  }

  private async checkStatus(interaction: RepliableInteraction, status: Status) {
    if (status === this.status) {
      return true;
    }
    await interaction.reply({ content: differentStatusMessage[status], flags });
    return false;
  }
}
