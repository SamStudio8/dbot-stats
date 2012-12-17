var stats = function(dbot){
    var name = 'stats';
    var stats_db = dbot.db.userStats;

    var commands = {
        '~lines': function(event){
            event.reply(dbot.t("lines_spoken", 
                {"lines": stats_db[event.user.toLowerCase()]["lines"]}
            ));
        },
    };

    commands['~lines'].regex = [/^~lines/, 1];

    return {
        'name': 'stats',
        'ignorable': true,
        'commands': commands,
        'listener': function(event){
            var stats_db = dbot.db.userStats;

            // Line Counter Listener
            if(event.message[0] != "~"){
                if(stats_db.hasOwnProperty(event.user.toLowerCase())){
                    stats_db[event.user.toLowerCase()]["lines"] += 1;
                }
                else{
                    stats_db[event.user.toLowerCase()] = {"lines": 1};
                }
            }
        },
        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot){
    return stats(dbot);
};
