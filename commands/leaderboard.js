/**
 * @file leaderboard.js
 * @brief Leaderboard command configs
 */
const flagUtils = require( '../utils/flag-utils.js' );
const TOP_X_RANKINGS_DISPLAY = 15;

const readCb = (flagRecords, msg, userData) => {
    // Grab points and sort to determine rankings (handles ties as well)
    let places = flagRecords.map( p => p.weeklypoints );
    let sorted = places.slice().sort( function (a, b) {
                     return b - a;
                 } );
    let ranks = places.map( function( v ) {
                    return sorted.indexOf( v ) + 1;
                } );
    ranks.sort( function (a, b) { return a - b; } );

    // Sort flag records
    flagRecords.sort( function (a, b) {
        let x = parseInt( a.weeklypoints );
        let y = parseInt( b.weeklypoints );
        return y - x;
    } );

    let data = [];
    let totalPoints = places.reduce((a, b) => a + b, 0);

    data.push( `**Total** (recorded) Guild Weekly Flag Points: ${totalPoints}` );
    data.push( `Total # of flaggers (recorded) this week: ${ranks.length}` );
    data.push( '\nRank. Name(IGN) - Weekly Points' );

    let i = 0;
    for (const row of flagRecords) {
        // Display top rankings only
        if (i >= TOP_X_RANKINGS_DISPLAY) {
            break;
        }

        // Handle ties
        data.push( `${ranks[i]}. ${row.nickname} - ${row.weeklypoints} points` );
        ++i;
    }
    msg.channel.send( data, { split: true } );
}

module.exports = {
    name: 'leaderboard',
    description: `Returns the current top ${TOP_X_RANKINGS_DISPLAY} flag leaderboard.`,
    aliases: ['rankings', 'l', 'leader'],
    usage: ' ',
    guildOnly: true,
    execute( msg, args ) {

        if (!flagUtils.parseFlagRecordsFile( msg, null, readCb )) {
            msg.channel.send( 'There are currently no rankings to display.' );
        } else {
            // readCb will be called
        }

    },
};
