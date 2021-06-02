/**
 * @file leaderboard.js
 * @brief Leaderboard command configs
 */
const flagUtils = require( '../utils/flag-utils.js' );

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
    data.push( 'Rank. Name(IGN) - Weekly Points' );

    let i = 0;
    for (const row of flagRecords) {
        if (i >= 10) {
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
    description: 'Returns the current top 10 flag leaderboard.',
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
