/**
 * @file place.js
 * @brief Placement command configs
 */
const FLAG_RECORD_TIME_LIMIT_MINUTES = 15;

/**
 * @brief Checks that current time is a flag race hour.
 */
var flagUTCTimes = [12, 19, 21, 22, 23];
function validFlagTime( flagHr ) {
    return flagUTCTimes.includes( flagHr );
}

/**
 * @brief Returns the amount of points earned from flag placement.
 */
function calculateFlagPoints( rank ) {
    var pts = 0;
    if (rank == 0) {
        pts = 10;
    } else if (rank == 1) {
        pts = 100;
    } else if (rank == 2) {
        pts = 50;
    } else if (rank == 3) {
        pts = 40;
    } else if (rank == 4) {
        pts = 35;
    } else if (rank == 5) {
        pts = 30;
    } else if (rank > 5 && rank < 21) {
        pts = 20;
    } else {
        console.log( "Invalid flag placement!" );
    }

    return pts;
}

module.exports = {
    name: 'place',
    aliases: ['p'],
    description: 'Records your most recent flag placement.',
    guildOnly: true,
    execute( msg, args ) {

        // Only allow command to be run within 15 minutes of flag races
        const now = Date.now();
        const date = new Date( now );
        if (validFlagTime( date.getUTCHours() ) && date.getMinutes() < FLAG_RECORD_TIME_LIMIT_MINUTES) {
            var place = parseInt( args[0] );
            var pts = calculateFlagPoints( place );
            if (pts > 0) {
                if (place > 0) {
                    msg.channel.send( 'You placed ' + place + ' and earned ' + pts + ' points.' );
                } else {
                    msg.channel.send( 'You did not place and earned ' + pts + ' points.' );
                }
            } else {
                msg.channel.send( 'Not a valid placement. Please try again.' );
            }
        } else {
            msg.channel.send( 'This command is only usable within the first 15 minutes after a flag race.' )
        }

    },
};

