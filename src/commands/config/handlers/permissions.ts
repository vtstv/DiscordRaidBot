// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Permissions settings handlers

import {
  StringSelectMenuInteraction,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import getPrismaClient from '../../../database/db.js';
import { getModuleLogger } from '../../../utils/logger.js';

const prisma = getPrismaClient();
const logger = getModuleLogger('config:permissions');

export async function handlePermissionsAction(
  interaction: StringSelectMenuInteraction,
  value: string
): Promise<void> {
  const guildId = interaction.guild!.id;

  switch (value) {
    case 'manager_role':
      await showManagerRoleSelect(interaction);
      break;

    case 'dashboard_roles':
      await showDashboardRolesSelect(interaction);
      break;

    case 'command_prefix':
      await showCommandPrefixModal(interaction);
      break;

    default:
      await interaction.update({
        content: `Action "${value}" not implemented.`,
        components: [],
      });
  }
}

async function showManagerRoleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const selectRow = new ActionRowBuilder<RoleSelectMenuBuilder>()
    .addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('config_set_manager_role')
        .setPlaceholder('Select manager role...')
        .setMaxValues(1)
    );

  const buttonRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_permissions')
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('◀')
    );

  await interaction.update({
    content: '👑 **Select Manager Role**\n\nThis role can create/edit events and templates.',
    components: [selectRow, buttonRow],
    embeds: [],
  });
}

async function showDashboardRolesSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const selectRow = new ActionRowBuilder<RoleSelectMenuBuilder>()
    .addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('config_set_dashboard_roles')
        .setPlaceholder('Select dashboard roles (up to 5)...')
        .setMinValues(0)
        .setMaxValues(5)
    );

  const buttonRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_permissions')
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('◀')
    );

  await interaction.update({
    content: '🌐 **Select Dashboard Roles**\n\nThese roles can access the web dashboard.\nLeave empty to restrict to managers only.',
    components: [selectRow, buttonRow],
    embeds: [],
  });
}

async function showCommandPrefixModal(interaction: StringSelectMenuInteraction): Promise<void> {
  const guild = await prisma.guild.findUnique({
    where: { id: interaction.guild!.id },
    select: { commandPrefix: true },
  });

  const modal = new ModalBuilder()
    .setCustomId('config_modal_command_prefix')
    .setTitle('Set Command Prefix')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('prefix')
          .setLabel('Command Prefix')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g., !, $, #')
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(3)
          .setValue(guild?.commandPrefix || '!')
      )
    );

  await interaction.showModal(modal);
}

export async function handleManagerRoleSelect(interaction: RoleSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const roleId = interaction.values[0];

  await prisma.guild.update({
    where: { id: guildId },
    data: { managerRoleId: roleId },
  });

  logger.info({ guildId, roleId }, 'Manager role updated');

  // Return to permissions menu
  const { showPermissionsMenu } = await import('../menus/others.js');
  await showPermissionsMenu(interaction);
}

export async function handleDashboardRolesSelect(interaction: RoleSelectMenuInteraction): Promise<void> {
  const guildId = interaction.guild!.id;
  const roleIds = interaction.values;

  await prisma.guild.update({
    where: { id: guildId },
    data: { dashboardRoles: roleIds },
  });

  logger.info({ guildId, roleIds }, 'Dashboard roles updated');

  // Return to permissions menu
  const { showPermissionsMenu } = await import('../menus/others.js');
  await showPermissionsMenu(interaction);
}

export async function handlePermissionsModal(interaction: ModalSubmitInteraction): Promise<void> {
  const guildId = interaction.guild!.id;

  if (interaction.customId === 'config_modal_command_prefix') {
    const prefix = interaction.fields.getTextInputValue('prefix').trim();

    if (prefix.length === 0 || prefix.length > 3) {
      await interaction.reply({
        content: '❌ Prefix must be 1-3 characters.',
        ephemeral: true,
      });
      return;
    }

    await prisma.guild.update({
      where: { id: guildId },
      data: { commandPrefix: prefix },
    });

    logger.info({ guildId, prefix }, 'Command prefix updated');

    // For modal submissions, we can't easily return to menu
    // Just show success message
    await interaction.reply({
      content: `✅ Command prefix set to \`${prefix}\`\n\nUse /config again to continue configuring.`,
      ephemeral: true,
    });
  }
}
