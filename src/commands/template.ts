// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/commands/template.ts
// Template management commands (create, list, edit, delete)

import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  EmbedBuilder 
} from 'discord.js';
import { z } from 'zod';
import getPrismaClient from '../database/db.js';
import { getModuleLogger } from '../utils/logger.js';
import { CommandError, NotFoundError, ValidationError } from '../utils/errors.js';
import { hasManagementPermissions } from '../utils/permissions.js';
import type { Command } from '../types/command.js';

const logger = getModuleLogger('template-command');
const prisma = getPrismaClient();

// Validation schema for template config
export const TemplateConfigSchema = z.object({
  roles: z.array(z.string()).min(1),
  limits: z.record(z.string(), z.number().positive()),
  emojiMap: z.record(z.string(), z.string()).optional(),
  specs: z.record(z.string(), z.array(z.string())).optional(),
  imageUrl: z.string().url().optional(),
});

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('template')
    .setDescription('Manage event templates')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new event template')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Template name')
            .setRequired(true)
            .setMaxLength(100)
        )
        .addStringOption(option =>
          option
            .setName('config')
            .setDescription('JSON config: {"roles":["Tank","Healer"],"limits":{"Tank":2,"Healer":3},"emojiMap":{"Tank":"🛡️"}}')
            .setRequired(true)
            .setMaxLength(2000)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Template description')
            .setRequired(false)
            .setMaxLength(500)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all templates for this server')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View details of a template')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Template name')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('Edit an existing template')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Template name')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option =>
          option
            .setName('config')
            .setDescription('New JSON config: {"roles":["Tank"],"limits":{"Tank":2},"emojiMap":{"Tank":"🛡️"}}')
            .setRequired(false)
            .setMaxLength(2000)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('New description')
            .setRequired(false)
            .setMaxLength(500)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete a template')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Template name')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      throw new CommandError('This command can only be used in a server');
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'create':
        await handleCreate(interaction);
        break;
      case 'list':
        await handleList(interaction);
        break;
      case 'view':
        await handleView(interaction);
        break;
      case 'edit':
        await handleEdit(interaction);
        break;
      case 'delete':
        await handleDelete(interaction);
        break;
    }
  },
};

async function handleCreate(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  // Check permissions
  const hasPermission = await hasManagementPermissions(interaction);
  if (!hasPermission) {
    throw new CommandError('You do not have permission to create templates. Only administrators or users with the configured manager role can create templates.');
  }

  const guildId = interaction.guild!.id;
  const name = interaction.options.getString('name', true).trim();
  const configString = interaction.options.getString('config', true);
  const description = interaction.options.getString('description');

  // Validate name
  if (name.length < 1 || name.length > 100) {
    throw new ValidationError('Template name must be between 1 and 100 characters');
  }
  if (!/^[a-zA-Z0-9\s\-_а-яА-ЯёЁ]+$/u.test(name)) {
    throw new ValidationError('Template name can only contain letters, numbers, spaces, hyphens, and underscores');
  }

  // Parse and validate JSON config
  let config: any;
  try {
    config = JSON.parse(configString);
  } catch (error) {
    throw new ValidationError('Invalid JSON format in config parameter. Expected format: {"roles":["Tank","Healer"],"limits":{"Tank":2,"Healer":3}}');
  }

  // Validate with schema
  const validationResult = TemplateConfigSchema.safeParse(config);
  if (!validationResult.success) {
    throw new ValidationError(`Invalid template config: ${validationResult.error.message}`);
  }

  // Ensure guild exists
  await prisma.guild.upsert({
    where: { id: guildId },
    create: { id: guildId, name: interaction.guild!.name },
    update: { name: interaction.guild!.name },
  });

  // Create template
  try {
    const template = await prisma.template.create({
      data: {
        guildId,
        name,
        description,
        config: config as object,
      },
    });

    logger.info({ templateId: template.id, name, guildId }, 'Template created');

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Template Created')
      .setDescription(`Template **${name}** has been created successfully!`)
      .addFields(
        { name: 'Roles', value: validationResult.data.roles.join(', '), inline: true },
        { name: 'ID', value: template.id, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new ValidationError(`A template named "${name}" already exists in this server`);
    }
    throw error;
  }
}

async function handleList(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;

  const templates = await prisma.template.findMany({
    where: { guildId },
    orderBy: { createdAt: 'desc' },
  });

  if (templates.length === 0) {
    await interaction.editReply('No templates found. Create one with `/template create`!');
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('📋 Event Templates')
    .setDescription(`Found ${templates.length} template(s)`)
    .setTimestamp();

  for (const template of templates.slice(0, 10)) {
    const config = template.config as any;
    const roles = config.roles?.join(', ') || 'N/A';
    embed.addFields({
      name: template.name,
      value: `${template.description || 'No description'}\nRoles: ${roles}`,
      inline: false,
    });
  }

  if (templates.length > 10) {
    embed.setFooter({ text: `Showing 10 of ${templates.length} templates` });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleView(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const name = interaction.options.getString('name', true);

  const template = await prisma.template.findUnique({
    where: { guildId_name: { guildId, name } },
  });

  if (!template) {
    throw new NotFoundError(`Template "${name}"`);
  }

  const config = template.config as any;
  const configJson = JSON.stringify(config, null, 2);

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`📄 Template: ${template.name}`)
    .setDescription(template.description || 'No description')
    .addFields(
      { name: 'ID', value: template.id, inline: true },
      { name: 'Created', value: template.createdAt.toISOString(), inline: true },
      { name: 'Configuration', value: `\`\`\`json\n${configJson.slice(0, 900)}\n\`\`\``, inline: false }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleEdit(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  // Check permissions
  const hasPermission = await hasManagementPermissions(interaction);
  if (!hasPermission) {
    throw new CommandError('You do not have permission to edit templates. Only administrators or users with the configured manager role can edit templates.');
  }

  const guildId = interaction.guild!.id;
  const name = interaction.options.getString('name', true);
  const configString = interaction.options.getString('config');
  const description = interaction.options.getString('description');

  if (!configString && description === null) {
    throw new ValidationError('Provide at least one field to update (config or description)');
  }

  const template = await prisma.template.findUnique({
    where: { guildId_name: { guildId, name } },
  });

  if (!template) {
    throw new NotFoundError(`Template "${name}"`);
  }

  const updateData: any = {};

  // If config is provided, parse and validate
  if (configString) {
    let config: any;
    try {
      config = JSON.parse(configString);
    } catch (error) {
      throw new ValidationError('Invalid JSON format in config parameter');
    }

    // Validate with schema
    const validationResult = TemplateConfigSchema.safeParse(config);
    if (!validationResult.success) {
      throw new ValidationError(`Invalid template config: ${validationResult.error.message}`);
    }

    updateData.config = config;
  }

  if (description !== null) {
    updateData.description = description;
  }

  const updated = await prisma.template.update({
    where: { id: template.id },
    data: updateData,
  });

  logger.info({ templateId: updated.id, name }, 'Template updated');

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('✅ Template Updated')
    .setDescription(`Template **${name}** has been updated successfully!`)
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleDelete(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const guildId = interaction.guild!.id;
  const name = interaction.options.getString('name', true);

  const template = await prisma.template.findUnique({
    where: { guildId_name: { guildId, name } },
  });

  if (!template) {
    throw new NotFoundError(`Template "${name}"`);
  }

  await prisma.template.delete({
    where: { id: template.id },
  });

  logger.info({ templateId: template.id, name, guildId }, 'Template deleted');

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('🗑️ Template Deleted')
    .setDescription(`Template **${name}** has been deleted.`)
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

export default command;
