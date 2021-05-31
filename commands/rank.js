/**
 * @file rank.js
 * @brief Rank command configs
 */
const fastcsv = require( 'fast-csv' );

module.exports = {
    name: 'rank',
    aliases: ['r'],
    description: 'Returns your current flag rank and points.',
    guildOnly: true,
    execute( msg, args ) {

        try {
            // Parse current record file
            var flagRecords = [];
            var flagCsvFilename = "flagrecords_" + msg.guild.id + ".csv";

            fastcsv.parseFile( flagCsvFilename, { headers: true } )
                .on( "data", data => {
                    flagRecords.push( data );
                } )
                .on( "end", () => {
                    var data = [];

                    // Sort flag records
                    flagRecords.sort( function (a, b) {
                        return a.weeklyPoints > b.weeklyPoints;
                    } );

                    // Find the user's ranking info
                    var found = false;
                    var rank = 1;
                    for (const row of flagRecords) {
                        if (row.userId === msg.author.id) {
                            data.push( `**Name:** ${row.nickname}` );
                            data.push( `**Weekly Guild Rank:** ${rank}` );
                            data.push( `**Weekly Points:** ${row.weeklyPoints}` );
                            data.push( `**Weekly Placements:** ${row.weeklyPlacements}` );
                            found = true;
                            break;
                        } else {
                            // Continue searching
                            rank += 1;
                        }
                    }

                    if (!found) {
                        data.push( `No ranking data found for ${nickname}` );
                    } else {
                        // Already formatted response
                    }

                    msg.channel.send( data, { split: true } );
                } );

        } catch (e) {
            console.log( 'File does not exist.' );
            msg.channel.send( 'There are currently no rankings to display.' );
        }
    },
};
