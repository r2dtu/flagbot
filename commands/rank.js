/**
 * @file rank.js
 * @brief Rank command configs
 *
 * Weekly rankings: displays current rank, weekly points, weekly placements
 * Monthly rankings: displays rank across 4 weeks of points
 */
const flagUtils = require( '../utils/flag-utils.js' );

const compileWeeklyRankings = ( flagRecords, userid ) => {

    let resp = [];
    // Grab points and sort to determine rankings (handles ties as well)
    let places = flagRecords.map( p => p.weeklypoints );
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
        if (row.userid === userid) {
            resp.push( `**Name:** ${row.nickname}` );
            resp.push( `**Weekly Guild Rank:** ${ranks[idx]}` );
            resp.push( `**Weekly Points:** ${row.weeklypoints}` );
            let placeStr = row.weeklyplacements.replace(/\//g, ', ');
            resp.push( `**Weekly Placements:** ${placeStr}` );

            found = true;
            break;
        } else {
            // Continue searching
            idx += 1;
        }
    }

    if (!found) {
        resp.push( 'No ranking data found for you.' );
    } else {
        // Already formatted response
    }

    return resp;
};

const compileMonthlyRankings = ( flagRecords, userid ) => {

    let nickname = "";
    let data = [];
    let resp = [];

    // Combine all data into single entity for each flagger
    let found = false;
    for (const row of flagRecords) {
        if (row.userid === userid) {
            found = true;
            data.push( { 
//                         'rank': row.endofweekrank,
                         'pts': row.weeklypoints,
                         'numRaces': row.weeklyplacements.split( "/" ).length
                       } );
            nickname = row.nickname;
        }
    }

    if (!found) {
        resp.push( 'No ranking data found for you.' );
    } else {
        let totalPts = data.reduce( (a, b) => a + (b['pts'] || 0), 0 );
        let totalRaces = data.reduce( (a, b) => a + (b['numRaces'] || 0), 0 );

        let tmp = flagUtils.getWeekStartDateStr().split( " " );
        let currMonth = tmp[2] + ' ' + tmp[3];
        resp.push( `**${currMonth} Ranking Stats for ${nickname}**` );
//        resp.push( `**Weekly Guild Ranks:** ${ranks[idx]}` );
        resp.push( `**Total Points for the month:** ${totalPts}` );
        resp.push( `**Number of Recorded Races:** ${totalRaces}` );
        resp.push( `Check the monthly leaderboard to see your rank.` );
    }

    return resp;
};

const compileAllTimeRankings = ( flagRecords, userid ) => {

    let nickname = "";
    let data = [];
    let resp = [];

    // Combine all data into single entity for each flagger
    let found = false;
    for (const row of flagRecords) {
        if (row.userid === userid) {
            found = true;
            data.push( { 
                         'pts': row.weeklypoints,
                         'numRaces': row.weeklyplacements.split( "/" ).length
                       } );
            nickname = row.nickname;
        }
    }

    if (!found) {
        resp.push( 'No ranking data found for you.' );
    } else {
        let totalPts = data.reduce( (a, b) => a + (b['pts'] || 0), 0 );
        let totalRaces = data.reduce( (a, b) => a + (b['numRaces'] || 0), 0 );

        resp.push( `**All-time Ranking Stats for ${nickname}**` );
//        resp.push( `**Weekly Guild Ranks:** ${ranks[idx]}` );
        resp.push( `**Total Monthly Points:** ${totalPts}` );
        resp.push( `**Number of Recorded Races:** ${totalRaces}` );
    }

    return resp;
};

module.exports = {
    name: 'rank',
    description: 'Returns your current flag rank and points.',
    aliases: ['r'],
    usage: ' ',
    guildOnly: true,
    execute( msg, args ) {

        let recordType = flagUtils.getRecordType( args[0] );
        let readCb = ( flagRecords, msg, newData ) => {

            let data = [];
            switch (recordType) {
                case flagUtils.RecordTypeEnum.WEEKLY:
                    data = compileWeeklyRankings( flagRecords, msg.author.id );
                    break;
                case flagUtils.RecordTypeEnum.MONTHLY:
                    data = compileMonthlyRankings( flagRecords, msg.author.id );
                    break;
                case flagUtils.RecordTypeEnum.ALLTIME:
                    data = compileAllTimeRankings( flagRecords, msg.author.id );
                    break;
                default:
                    // Should not have gotten here
                    break;
            }

            msg.channel.send( data, { split: true } );
        };

        if (recordType === flagUtils.RecordTypeEnum.INVALID) {
            msg.channel.send( 'Valid ranking types are: weekly (-w), ' +
                              ' monthly (-m), or all-time (-a)' );
        } else if (!flagUtils.getFlagRecords( recordType, msg, 
                                              null, readCb )) {
            msg.channel.send( 'There are currently no rankings to display.' );
        } else {
            // readCb will be called
        }
    },
};
