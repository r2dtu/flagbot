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
const flagReminder = require( './flag-reminders.js' );

// Read in list of commands
client.commands = new Discord.Collection();
const cmdFiles = fs.readdirSync( './commands' ).filter(file => file.endsWith( '.js' ));
for (const file of cmdFiles) {
    const cmd = require( `./commands/${file}` );
    client.commands.set( cmd.name, cmd );
}

// Ready message after startup
client.once( 'ready', () => {
    flagReminder.setSchedules( client );
    console.log( 'Ready!' );
} );

// Messages/commands handler
client.on( 'message', msg => {

    // Ignore bot and unprefixed commands
    if (!msg.content.startsWith( prefix ) || msg.author.bot) return;
  
    // Get rid of prefix and separate arguments passed in
    const args = msg.content.slice( prefix.length ).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const cmd = client.commands.get( cmdName )
        || client.commands.find( c => c.aliases && c.aliases.includes( cmdName ) );
  
    // If command does not exist, just ignore it
    if (!cmd) return;

    // Ensure command can only be used where it can
    if (cmd.guildOnly && msg.channel.type === 'dm') {
        return msg.reply('I can\'t execute that command inside DMs!');
    }

    // Ensure user has permissions to use command
    if (cmd.permissions) {
        const authorPerms = msg.channel.permissionsFor( msg.author );
        if (!authorPerms || !authorPerms.has( cmd.permissions )) {
            return msg.reply( 'You are not authorized to use this command.' );
        }
    }

    // Check that user inputted an argument
    if (cmd.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;
        if (cmd.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
        }
        return msg.channel.send( reply );
    }

    try {
        cmd.execute( msg, args );
    } catch (e) {
        console.error( e );
        msg.reply( 'There was an error trying to execute that command!' );
    }

} );

// Login to app
client.login( token );
