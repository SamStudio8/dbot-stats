var stats = function(dbot){
    var name = 'stats';

    var commands = {
        '~lines': function(event){
            if(event.params[1]){
                var input = event.params[1].trim()
                if(dbot.db.userStats.hasOwnProperty(input)){
                    event.reply(dbot.t("user_lines", {
                        "user": input,
                        "chan": event.channel,
                        "lines": dbot.db.userStats[input][event.channel]["total_lines"],
                        "start": new Date(dbot.db.userStats[input][event.channel]["startstamp"]).toDateString()}
                    ));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": input}
                    ));
                }
            }
            else{
                event.reply(dbot.t("chan_lines", {
                    "chan": event.channel,
                    "lines": dbot.db.chanStats[event.channel]["total_lines"],
                    "start": new Date(dbot.db.chanStats[event.channel]["startstamp"]).toDateString()}
                ));
            }
        },

        '~lincent': function(event){
            if(event.params[1]){
                var input = event.params[1].trim();
                if(dbot.db.chanStats[event.channel]["users"].hasOwnProperty(input)){
                    var percent = ((dbot.db.chanStats[event.channel]["users"][input]["lines"]
                        / dbot.db.chanStats[event.channel]["total_lines"])*100);
                    event.reply(dbot.t("lines_percent", {
                        "user": input,
                        "chan": event.channel,
                        "percent": percent.numberFormat(2),
                        "lines": dbot.db.chanStats[event.channel]["users"][input]["lines"].numberFormat(0) }
                    ));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": input}
                    ));
                }
            }
        },

        '~active': function(event){
            var max = -1;
            var max_index = -1;
            for(var i=0; i<=23; i++) {
                if(dbot.db.userStats[event.user][event.channel]["freq_hours"][i] > max){
                    max = dbot.db.userStats[event.user][event.channel]["freq_hours"][i];
                    max_index = i;
                }
            }
            var start = max_index;
            var end = max_index + 1;
            if(start == 23){
                end = "00";
            }
            event.reply(dbot.t("hours_active", {
                "start_hour": start,
                "end_hour": end}
            ));
        },

        '~loudest': function(event){
            var max = -1;
            var max_user = "nobody";
            for(var user in dbot.db.chanStats[event.channel]["users"]){
                if(dbot.db.chanStats[event.channel]["users"].hasOwnProperty(user)){
                    if(dbot.db.chanStats[event.channel]["users"][user] > max){
                        max = dbot.db.chanStats[event.channel]["users"][user];
                        max_user = user;
                    }
                }
            }
            event.reply(dbot.t("loudest_user", {
                "user": max_user}
            ));
        },
    };

    commands['~lines'].regex = [/^~lines (\w{1,})?/, 2];
    commands['~lincent'].regex = [/^~lincent (\w{1,})/, 2]

    return {
        'name': 'stats',
        'ignorable': true,
        'commands': commands,
        'listener': function(event){
            
            // Ignore command messages
            if(event.message[0] == "~" || event.user == dbot.name){
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
                    "in_mentions": 0,
                    "out_mentions": {},
                    "startstamp": Date.now(),
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
                    "users": {},
                    "startstamp": Date.now(),
                };
                
                // Initialize hour frequency counters
                for(var i=0; i<=23; i++){
                    dbot.db.chanStats[event.channel]["freq_hours"][i] = 0;
                }
            }
            if(!dbot.db.chanStats[event.channel]["users"].hasOwnProperty(event.user)){
                dbot.db.chanStats[event.channel]["users"][event.user] = {
                    "lines": 0,
                    "mentions": 0 };
            }
            dbot.db.chanStats[event.channel]["users"][event.user]["lines"] += 1;
            dbot.db.chanStats[event.channel]["freq_hours"][event.time.getHours()] += 1;
            dbot.db.chanStats[event.channel]["total_lines"] += 1;

            // Check whether the line includes any mentions
            if(dbot.db.hasOwnProperty("knownUsers")){
                // Server key should exist in knownUsers
                for (var i = 0; i < dbot.db.knownUsers[event.server].users.length; i++){
                    var name = dbot.db.knownUsers[event.server].users[i];
                    var toMatch = "\\b"+name+":?\\b"
                    if(event.message.search(toMatch) > -1){
                        if(!dbot.db.userStats[event.user][event.channel]["out_mentions"].hasOwnProperty(name)){
                            dbot.db.userStats[event.user][event.channel]["out_mentions"][name] = 0;
                        }
                        dbot.db.userStats[event.user][event.channel]["out_mentions"][name] += 1;
                        dbot.db.userStats[name][event.channel]["in_mentions"] += 1;
                    }
                }
            }
        },
        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot){
    return stats(dbot);
};
