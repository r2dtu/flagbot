/**
 * @file flagbot.js
 * @author David Tu
 *
 * @brief Main bot runner.
 */
const fs = require( 'fs' );
const Discord = require( 'discord.js' );
const client = new Discord.Client();
const { prefix, token } = require( './config.json' );

// Read in list of commands
client.commands = new Discord.Collection();
const cmdFiles = fs.readdirSync( './commands' ).filter(file => file.endsWith( '.js' ));
for (const file of cmdFiles) {
  const cmd = require(`./commands/${file}`);
  client.commands.set( cmd.name, cmd );
}

// Ready message after startup
client.once( 'ready', () => {
  console.log( 'Ready!' );
} );

// Messages/commands handler
client.on( 'message', msg => {
    // Ignore bot and unprefixed commands
    if (!msg.content.startsWith( prefix ) || msg.author.bot) return;
  
    // Get rid of prefix and separate arguments passed in
    const args = msg.content.slice( prefix.length ).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
  
    // If command does not exist, just ignore it
    if (!client.commands.has( cmd )) return;
    
    try {
        client.commands.get( cmd ).execute( msg, args );
    } catch (e) {
        console.error( e );
        msg.reply( 'There was an error trying to execute that command!' );
    }

} );

// Login to app
client.login( token );
