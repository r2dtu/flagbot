/**
 * @file flag-reminders.js
 * @brief Set up reminders for flag race.
 */
const cron = require( 'node-cron' );

const flagChannelId = process.env.flagChannelId;
const flagRoleId = process.env.flagRoleId;

// List out flag race times
const FlagReminders = new Map();
FlagReminders.set( '12pm UTC long flag; snowshoes are optional~!', { hr: 11, min: 55 });
FlagReminders.set( '7pm UTC short flag; remember to wear snowshoes!', { hr: 18, min: 55 });
FlagReminders.set( '9pm UTC long flag; snowshoes are optional~', { hr: 20, min: 55 });
FlagReminders.set( '10pm UTC long flag; snowshoes are optional~', { hr: 21, min: 55 });
FlagReminders.set( '11pm UTC long flag; snowshoes are optional~', { hr: 22, min: 55 });

/**
 * @brief Creates the CRON job to send reminders
 *
 * @param[in] client Discord client object
 */
const setSchedules = (client) => {
    // Fetch the general channel that you'll send the birthday message
    const general = client.channels.cache.get( flagChannelId );
  
    // For every flag race time
    console.log( "Setting up flag reminders..." );
    FlagReminders.forEach( (reminder, flagName) => {
        // Create a cron schedule
        cron.schedule(`0 ${reminder.min} ${reminder.hr} * * *`, () => {
            general.send( `🔔 Reminder 🔔 <@&${flagRoleId}> Flag in 5 minutes! ${flagName}` );
        },
        {
            scheduled: true,
            timezone: 'Etc/UTC'
        });
    });
};

module.exports = { setSchedules };
