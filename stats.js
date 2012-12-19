var stats = function(dbot){
    var name = 'stats';

    var commands = {
        '~lines': function(event){
            event.reply(dbot.t("lines_spoken", {
                "lines": dbot.db.userStats[event.user][event.channel]["total_lines"]}
            ));
        },
    };

    commands['~lines'].regex = [/^~lines/, 1];

    return {
        'name': 'stats',
        'ignorable': true,
        'commands': commands,
        'listener': function(event){
            
            // Ignore command messages
            if(event.message[0] == "~"){
                return;
            }
            
            // User-centric Stats
            if(!dbot.db.userStats.hasOwnProperty(event.user)){
                dbot.db.userStats[event.user] = {}
            }
            if(!dbot.db.userStats[event.user].hasOwnProperty(event.channel)){
                dbot.db.userStats[event.user][event.channel] = {
                    "total_lines": 0,
                    "freq_hours": {},
                };
                
                // Initialize hour frequency counters
                for(var i=0; i<=23; i++){
                    dbot.db.userStats[event.user][event.channel]["freq_hours"][i] = 0;
                }
            }
            dbot.db.userStats[event.user][event.channel]["freq_hours"][event.time.getHours()] += 1;
            dbot.db.userStats[event.user][event.channel]["total_lines"] += 1;
            
            // Channel-centric Stats
            if(!dbot.db.chanStats.hasOwnProperty(event.channel)){
                dbot.db.chanStats[event.channel] = {
                    "total_lines": 0,
                    "freq_hours": {},
                };
                
                // Initialize hour frequency counters
                for(var i=0; i<=23; i++){
                    dbot.db.chanStats[event.channel]["freq_hours"][i] = 0;
                }
            }
            dbot.db.chanStats[event.channel]["freq_hours"][event.time.getHours()] += 1;
            dbot.db.chanStats[event.channel]["total_lines"] += 1;
        },
        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot){
    return stats(dbot);
};
