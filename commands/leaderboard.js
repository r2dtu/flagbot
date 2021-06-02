/**
 * @file leaderboard.js
 * @brief Leaderboard command configs
 */
const fastcsv = require( 'fast-csv' );

module.exports = {
    name: 'leaderboard',
    description: 'Returns the current top 10 flag leaderboard.',
    aliases: ['rankings', 'l', 'leader'],
    usage: ' ',
    guildOnly: true,
    execute( msg, args ) {

        try {
            // Parse current record file
            let flagRecords = [];
            let flagCsvFilename = "flagrecords_" + msg.guild.id + ".csv";

            fastcsv.parseFile( flagCsvFilename, { headers: true } )
                .on( "data", data => {
                    flagRecords.push( data );
                } )
                .on( "end", () => {

                    // Grab points and sort to determine rankings (handles ties as well)
                    let places = flagRecords.map( p => p.weeklyPoints );
                    let sorted = places.slice().sort( function (a, b) {
                                     return b - a;
                                 } );
                    let ranks = places.map( function( v ) {
                                    return sorted.indexOf( v ) + 1;
                                } );
                    ranks.sort( function (a, b) { return a - b; } );

                    // Sort flag records
                    flagRecords.sort( function (a, b) {
                        let x = parseInt( a.weeklyPoints );
                        let y = parseInt( b.weeklyPoints );
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
                        data.push( `${ranks[i]}. ${row.nickname} - ${row.weeklyPoints} points` );
                        ++i;
                    }
                    msg.channel.send( data, { split: true } );

                } );

        } catch (e) {
            console.log( 'File does not exist.' + e );
            msg.channel.send( 'There are currently no rankings to display.' );
        }
    },
};
