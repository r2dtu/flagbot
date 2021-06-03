/**
 * @file tips.js
 * @brief Tips and tricks links
 */
const ytube_links = [
    {
        'title': '12/7PM (Short) Flag Guide',
        'link': 'https://youtu.be/sTnh6OTjSQw',
    },
    {
        'title': 'Beginner 9PM+ Flag Guide',
        'link': 'https://youtu.be/agcgzoS4QZw'
    },
    {
        'title': 'Intermediate 9PM+ Flag Guide with detailed guide',
        'link': 'https://youtu.be/tOBe0Hh7po4'
    },
    {
        'title': 'Advanced (Snowshoe) 9PM+ Flag with key inputs',
        'link': 'https://youtu.be/E4a36F1qtzc'
    }
];

module.exports = {
    name: 'tips',
    description: 'Links to some flag tips and tricks!',
    aliases: ['tricks'],
    usage: ' ',
    execute( msg, args ) {
        let data = [];
        for (const link of ytube_links) {
            data.push( `**${link.title}:** ${link.link}` );
        }
        // @future Link specific channel ID here
        data.push ( `Also check out the #tips-and-tricks channel!` );

        return msg.author.send( data, { split: true } )
            .then( () => {
                if (msg.channel.type === 'dm') return;
                msg.reply( 'I\'ve sent you a DM with all the info I\'ve got!' );
            } )
            .catch( e => {
                console.error( `Could not send help DM to ${message.author.tag}.`, e );
                msg.reply( 'It seems like I can\'t DM you! Do you have DMs disabled?' );
            } );

    },
};
