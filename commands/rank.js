/**
 * @file rank.js
 * @brief Rank command configs
 */
const fastcsv = require( 'fast-csv' );

let readCb = ( flagRecords, msg, newData ) => {
    let data = [];

    // Grab points and sort to determine rankings (handles ties as well)
    let places = flagRecords.map( p => p.weeklyPoints );
    let sorted = places.slice().sort( function (a, b) {
                     return b - a;
                 } );
    let ranks = places.map( function( v ) {
                    return sorted.indexOf( v ) + 1;
                } );

    // Find the user's ranking info
    let found = false;
    let idx = 0;
    for (const row of flagRecords) {
        if (row.userId === msg.author.id) {
            data.push( `**Name:** ${row.nickname}` );
            data.push( `**Weekly Guild Rank:** ${ranks[idx]}` );
            data.push( `**Weekly Points:** ${row.weeklyPoints}` );
            let placeStr = row.weeklyPlacements.replace(/\//g, ', ');
            data.push( `**Weekly Placements:** ${placeStr}` );
            found = true;
            break;
        } else {
            // Continue searching
            idx += 1;
        }
    }

    if (!found) {
        data.push( 'No ranking data found for you.' );
    } else {
        // Already formatted response
    }

    msg.channel.send( data, { split: true } );
};

module.exports = {
    name: 'rank',
    description: 'Returns your current flag rank and points.',
    aliases: ['r'],
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
