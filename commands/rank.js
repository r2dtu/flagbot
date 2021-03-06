/**
 * @file rank.js
 * @brief Rank command configs
 *
 * Weekly rankings: displays current rank, weekly points, weekly placements
 * Monthly rankings: displays rank across 3-4 weeks of points (based on what 
 *                   month the week begins on)
 * All-Time rankings: displays all-time flagger stats
 */
const Discord = require( 'discord.js' );
const flagUtils = require( '../utils/flag-utils.js' );
const qchart = require( 'quickchart-js' );
const utils = require( '../utils/utils.js' );

/**
 * @brief Generates a donut graph of a user's flag placements.
 *
 * @param[in] placements array of strings containing flagger's placements
 *
 * @return QuickChart URL to display in embed message
 */
const createChartUrl = ( placements ) => {

    // Create the labels for graph
    let rankLabels = [...new Set( placements )].map( Number )
    rankLabels.sort( function (a, b) { return a - b; } );

    // Replace '0' label with 'afk/out' if exists, and move to end
    let rotate = false;
    if (rankLabels[0] === 0) {
        rankLabels.shift();
        rankLabels.push( 'afk/out' );
        rotate = true;
    }

    // Count # of each placement
    let counts = {};
    placements = placements.map( Number );
    placements.sort(
        function (a, b) {
            return a - b;
        }
    );
    placements.forEach(
        function (x) {
            counts[x] = (counts[x] || 0) + 1;
        }
    );

    // Store counts in an array
    let data = [];
    for (const key in counts) {
        data.push( counts[key] );
    }
    // Rotate only if there's afk/outs
    if (rotate) {
        data = utils.arrayRotate( data );
    }
    // Now labels/data should map 1:1

    // Create donut chart
    const chart = new qchart();
    chart.setConfig(
        {
          type: 'doughnut',
          data: {
            labels: rankLabels,
            datasets: [{
              data: data,
            }]
          },
          options: {
            plugins: {
              datalabels: {
                display: true,
                backgroundColor: '#ccc',
                borderRadius: 3,
                font: {
                  color: 'red',
                  weight: 'bold',
                }
              },
              doughnutlabel: {
                labels: [{
                  text: data.reduce( (a, b) => a + b, 0 ),
                  font: {
                    size: 20,
                    weight: 'bold'
                  }
                }, {
                  text: 'Total Races'
                }]
              },
            }
          }
        }
    );

    return chart.getUrl();
};

/**
 * @brief Creates a bot response for weekly ranking data.
 *
 * @param[in] flagRecords flag data from database
 * @param[in] userid user ID to get data about
 * @param[in] pfpUrl Profile picture URL
 *
 * @return bot response
 */
const compileWeeklyRankings = ( flagRecords, userid, pfpUrl ) => {

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
            let week = flagUtils.getWeekStartDateStr();
            let placeStr = row.weeklyplacements.replace(/\//g, ', ');

            // Replace '0' with 'afk/out'
            placeStr = placeStr.replace( /, 0/g, ', afk/out' );
            found = true;

            const embed = new Discord.MessageEmbed()
                  .setTitle( `__Week of **${week}** Stats for **${row.nickname}**__` )
                  .setColor( 0x00AE86 )
                  .setThumbnail( pfpUrl )
                  .setTimestamp()
                  .addFields(
                      {
                          name: "Weekly Guild Rank",
                          value: `${ranks[idx]}`,
                          inline: true
                      })
                  .addFields(
                      {
                          name: "Weekly Points",
                          value: `${row.weeklypoints}`,
                          inline: true
                      })
                  .addFields(
                      {
                          name: "Weekly Placements",
                          value: `${placeStr}`
                      });

            resp = { embed: embed };
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

/**
 * @brief Creates a bot response for monthly ranking data.
 *
 * @param[in] flagRecords flag data from database
 * @param[in] userid user ID to get data about
 * @param[in] pfpUrl Profile picture URL
 *
 * @return bot response
 */
const compileMonthlyRankings = ( flagRecords, userid, pfpUrl ) => {

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
                         'numRaces': row.weeklyplacements.split( "/" ).length,
                         'placements': row.weeklyplacements,
                         'week': row.week,
                       } );
            nickname = row.nickname;
        }
    }

    if (!found) {
        resp.push( 'No ranking data found for you.' );
    } else {

        // Get current month
        let tmp = flagUtils.getWeekStartDateStr().split( " " );
        let currMonth = tmp[2] + ' ' + tmp[3];

        // Calculate stats
        let totalPts = data.reduce( (a, b) => a + (b['pts'] || 0), 0 );
        let totalRaces = data.reduce( (a, b) => a + (b['numRaces'] || 0), 0 );
        let placements = data.reduce( (a, b) => a + '/' + (b['placements'] || 0), 0 ).split( '/' );
        // Get rid of prepended '0'
        placements.shift();

        // Create the chart
        let chartUrl = createChartUrl( placements );

        // Can do actual median (handle even length'd array), but lazy
        placements.sort();
        let medianRank = placements[ Math.floor( placements.length / 2 ) ];
        let avgPpr = (totalPts / totalRaces).toFixed( 2 );

        // Grab week with highest points
        let bestWeek = utils.getTopN( data, 'pts', 1 );

        // color =  14076078 or 0xD6C8AE
        // can also .setDescription(), .setAuthor(), .setFooter(), .setURL()
        const embed = new Discord.MessageEmbed()
                  .setTitle( `__**${currMonth} Flag Stats for ${nickname}**__` )
                  .setColor( 0x00AE86 )
                  .setThumbnail( pfpUrl )
                  .setImage( chartUrl )
                  .setTimestamp()
                  .addFields(
                      {
                          name: "Total points for this month",
                          value: `${totalPts}`
                      })
                  .addFields(
                      {
                          name: "Number of (recorded) races",
                          value: `${totalRaces}`
                      })
                  .addFields(
                      {
                          name: "Average points per race",
                          value: `${avgPpr}`,
                          inline: true
                      })
                  .addFields(
                      {
                          name: "Median flag placement",
                          value: `${medianRank}`,
                          inline: true
                      })
                  .addFields(
                      {
                          name: '\u200b',
                          value: '\u200b',
                          inline: true
                      })
                  .addFields(
                      {
                          name: "Best week of flag",
                          value: `${bestWeek[0].week}`,
                          inline: true
                      })
                  .addFields(
                      {
                          name: "Points earned during best week",
                          value: `${bestWeek[0].pts}`,
                          inline: true
                      });

        resp = { embed: embed };
    }

    return resp;
};

/**
 * @brief Creates a bot response for all-time ranking data.
 *
 * @param[in] flagRecords flag data from database
 * @param[in] userid user ID to get data about
 * @param[in] pfpUrl Profile picture URL
 *
 * @return bot response
 */
const compileAllTimeRankings = ( flagRecords, userid, pfpUrl ) => {

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
                         'numRaces': row.weeklyplacements.split( "/" ).length,
                         'placements': row.weeklyplacements,
                         'week': row.week,
                       } );
            nickname = row.nickname;
        }
    }

    if (!found) {
        resp.push( 'No ranking data found for you.' );
    } else {

        // Calculate stats
        let totalPts = data.reduce( (a, b) => a + (b['pts'] || 0), 0 );
        let totalRaces = data.reduce( (a, b) => a + (b['numRaces'] || 0), 0 );
        let placements = data.reduce( (a, b) => a + '/' + (b['placements'] || 0), 0 ).split( '/' );
        placements.shift();

        // Create the chart
        let chartUrl = createChartUrl( placements );

        // Can do actual median (handle even length'd array), but lazy
        placements.sort();
        let medianRank = placements[ Math.floor( placements.length / 2 ) ];
        let avgPpr = (totalPts / totalRaces).toFixed( 2 );

        // Grab week with highest points
        let bestWeek = utils.getTopN( data, 'pts', 1 );

        // color =  14076078 or 0xD6C8AE
        // can also .setAuthor(), .setFooter(), .setURL()
        const embed = new Discord.MessageEmbed()
                  .setTitle( `__**All-time Flag Stats for ${nickname}**__` )
                  .setColor( 0xD6C8AE )
                  .setThumbnail( pfpUrl )
                  .setImage( chartUrl )
                  .setTimestamp()
                  .addFields(
                      {
                          name: "Total points recorded",
                          value: `${totalPts}`
                      })
                  .addFields(
                      {
                          name: "Number of recorded races",
                          value: `${totalRaces}`
                      })
                  .addFields(
                      {
                          name: "Average points per race",
                          value: `${avgPpr}`,
                          inline: true
                      })
                  .addFields(
                      {
                          name: "Median rank placement",
                          value: `${medianRank}`,
                          inline: true
                      })
                  .addFields(
                      {
                          name: '\u200b',
                          value: '\u200b',
                          inline: true
                      })
                  .addFields(
                      {
                          name: "Best week of flag",
                          value: `${bestWeek[0].week}`,
                          inline: true
                      })
                  .addFields(
                      {
                          name: "Most weekly points earned in flag",
                          value: `${bestWeek[0].pts}`,
                          inline: true
                      });

        resp = { embed: embed };
    }

    return resp;
};

module.exports = {
    name: 'rank',
    description: 'Returns your current flag rank, points, and other stats. Note that ' +
                 'all-time rankings will take much longer to fetch than weekly or ' +
                 'monthly.',
    aliases: ['r'],
    usage: ' [-w | --weekly | -m | --monthly | -a | --all-time]',
    guildOnly: true,
    execute( msg, args ) {

        let recordType = flagUtils.getRecordType( args[0] );
        let readCb = ( flagRecords, msg, newData ) => {

            let data = [];
            switch (recordType) {
                case flagUtils.RecordTypeEnum.WEEKLY:
                    data = compileWeeklyRankings( flagRecords, msg.author.id,
                                                  msg.author.avatarURL() );
                    break;
                case flagUtils.RecordTypeEnum.MONTHLY:
                    data = compileMonthlyRankings( flagRecords, msg.author.id,
                                                   msg.author.avatarURL() );
                    break;
                case flagUtils.RecordTypeEnum.ALLTIME:
                    data = compileAllTimeRankings( flagRecords, msg.author.id,
                                                   msg.author.avatarURL() );
                    break;
                default:
                    // Should not have gotten here
                    break;
            }

            msg.channel.send( data );
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
