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

                    // Sort flag records
                    flagRecords.sort( function (a, b) {
                        return a.weeklyPoints > b.weeklyPoints;
                    } );

                    let data = [];
                    data.push( 'Rank. Name(IGN) - Weekly Points' );

                    let i = 1;
                    for (const row of flagRecords) {
                        if (i > 10) {
                            break;
                        }

                        data.push( `${i}. ${row.nickname} - ${row.weeklyPoints} points` );
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
