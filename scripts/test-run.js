import dotenv from 'dotenv';
import path from 'path';
import { DiscordClient } from '../dist/discord.js';
import { NotebookManager } from '../dist/notebook.js';

dotenv.config();

async function main() {
  console.log('=== Testing Engineering Notebook Discord MCP Integration ===\n');

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const dataDir = process.env.NOTEBOOK_DATA_DIR || '../engineering-notebook-editor/notebook/data';

  if (!botToken || !guildId) {
    console.error('Error: DISCORD_BOT_TOKEN and DISCORD_GUILD_ID must be set in .env');
    process.exit(1);
  }

  const discord = new DiscordClient(botToken);
  const notebook = new NotebookManager(dataDir);

  // 1. Test Discord Guild Connection
  console.log('1. Connecting to Discord Server...');
  const channels = await discord.listChannels(guildId);
  console.log(`   Connected! Found ${channels.length} channels.`);

  // 2. Test Reading Messages from a Channel
  const textChannels = channels.filter(c => c.type === 0);
  console.log(`\n2. Querying text channels (${textChannels.length} found)...`);
  
  for (const ch of textChannels.slice(0, 3)) {
    const msgs = await discord.getMessages({ channelId: ch.id, limit: 3 });
    console.log(`   #${ch.name}: ${msgs.length} messages retrieved.`);
  }

  // 3. Test Notebook Author Resolution
  console.log('\n3. Testing Author Resolution...');
  const sampleUsers = ['aki6', 'randompancake', 'jmsae'];
  const resolved = await notebook.resolveAuthors(sampleUsers);
  console.log('   Resolved Discord Users:', JSON.stringify(resolved, null, 2));

  // 4. Test Similarity / Duplicate Detection
  console.log('\n4. Testing Similarity Check...');
  const similar = await notebook.findSimilarEntries({
    phase: 'develop-solution',
    titleKeywords: ['chassis', 'solution']
  });
  console.log(`   Found ${similar.length} matching entries.`);

  console.log('\n=== All Tests Passed Successfully! ===');
}

main().catch(err => {
  console.error('\nTest failed with error:', err);
  process.exit(1);
});
