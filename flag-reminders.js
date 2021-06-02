/**
 * @file flag-reminders.js
 * @brief Set up reminders for flag race.
 */
const cron = require( 'node-cron' );
const { flagChannelId, flagRoleId } = require( './flag-settings.json' );

// List out flag race times
const FlagReminders = new Map();
FlagReminders.set( 'Dummy Test Flag Reminder', { hr: 14, min: 54 });
FlagReminders.set( '12pm UTC Flag', { hr: 11, min: 55 });
FlagReminders.set( '7pm UTC Flag', { hr: 18, min: 55 });
FlagReminders.set( '9pm UTC Flag', { hr: 20, min: 55 });
FlagReminders.set( '10pm UTC Flag', { hr: 21, min: 55 });
FlagReminders.set( '11pm UTC Flag', { hr: 22, min: 55 });

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
            general.send( `🔔 Reminder 🔔 <@&${flagRoleId}> ${flagName} in 5 minutes!` );
        },
        {
            scheduled: true,
            timezone: 'Etc/UTC'
        });
    });
};

module.exports = { setSchedules };
