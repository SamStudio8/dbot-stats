var stats = function(dbot){
    var name = 'stats';
    var userStats = dbot.db.userStats;
    var chanStats = dbot.db.chanStats;

    var commands = {
        '~lines': function(event){
            if(event.params[1]){
                var input = event.params[1].trim()
                if(userStats[event.server].hasOwnProperty(input)){
                    event.reply(dbot.t("user_lines", {
                        "user": input,
                        "chan": event.channel,
                        "lines": userStats[event.server][input][event.channel]["total_lines"].numberFormat(0),
                        "start": new Date(userStats[event.server][input][event.channel]["startstamp"]).toDateString()}
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
                    "lines": chanStats[event.server][event.channel]["total_lines"].numberFormat(0),
                    "start": new Date(chanStats[event.server][event.channel]["startstamp"]).toDateString()}
                ));
            }
        },

        '~words': function(event){
            if(event.params[1]){
                var input = event.params[1].trim()
                if(userStats[event.server].hasOwnProperty(input)){
                    event.reply(dbot.t("user_words", {
                        "user": input,
                        "chan": event.channel,
                        "words": userStats[event.server][input][event.channel]["total_words"].numberFormat(0),
                        "avg": (userStats[event.server][input][event.channel]["total_words"] 
                            / userStats[event.server][input][event.channel]["total_lines"]).numberFormat(2),
                        "start": new Date(userStats[event.server][input][event.channel]["startstamp"]).toDateString()}
                    ));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": input}
                    ));
                }
            }
            else{
                event.reply(dbot.t("chan_words", {
                    "chan": event.channel,
                    "words": chanStats[event.server][event.channel]["total_words"].numberFormat(0),
                    "avg": (chanStats[event.server][event.channel]["total_words"] 
                        / chanStats[event.server][event.channel]["total_lines"]).numberFormat(2),
                    "start": new Date(chanStats[event.server][event.channel]["startstamp"]).toDateString()}
                ));
            }
        },

        '~lincent': function(event){
            if(event.params[1]){
                var input = event.params[1].trim();
                if(chanStats[event.server][event.channel]["users"].hasOwnProperty(input)){
                    var percent = ((chanStats[event.server][event.channel]["users"][input]["lines"]
                        / chanStats[event.server][event.channel]["total_lines"])*100);
                    event.reply(dbot.t("lines_percent", {
                        "user": input,
                        "chan": event.channel,
                        "percent": percent.numberFormat(2),
                        "lines": chanStats[event.server][event.channel]["users"][input]["lines"].numberFormat(0) }
                    ));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": input}
                    ));
                }
            }
            else{
                var percent = ((chanStats[event.server][event.channel]["users"][event.user]["lines"]
                    / chanStats[event.server][event.channel]["total_lines"])*100);
                event.reply(dbot.t("lines_percent", {
                    "user": event.user,
                    "chan": event.channel,
                    "percent": percent.numberFormat(2),
                    "lines": chanStats[event.server][event.channel]["users"][event.user]["lines"].numberFormat(0) }
                ));
            }
        },

        '~active': function(event){
            if(event.params[1]){
                var input = event.params[1].trim();
                if(userStats[event.server].hasOwnProperty(input)){
                    var max = -1;
                    var max_index = -1;
                    for(var i=0; i<=23; i++) {
                        if(userStats[event.server][input][event.channel]["freq_hours"][i] > max){
                            max = userStats[event.server][input][event.channel]["freq_hours"][i];
                            max_index = i;
                        }
                    }
                    var start = max_index;
                    var end = max_index + 1;
                    if(start == 23){
                        end = "00";
                    }
                    event.reply(dbot.t("hours_active", {
                        "name": input,
                        "start_hour": start,
                        "end_hour": end}
                    ));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": input}
                    ));
                }
            }
            else{
                //Channel active
                var max = -1;
                var max_index = -1;
                for(var i=0; i<=23; i++) {
                    if(chanStats[event.server][event.channel]["freq_hours"][i] > max){
                        max = chanStats[event.server][event.channel]["freq_hours"][i];
                        max_index = i;
                    }
                }
                var start = max_index;
                var end = max_index + 1;
                if(start == 23){
                    end = "00";
                }
                event.reply(dbot.t("hours_active", {
                    "name": event.channel,
                    "start_hour": start,
                    "end_hour": end}
                ));
            }
        },

        '~loudest': function(event){
            var max = -1;
            var max_user = "nobody";
            for(var user in chanStats[event.server][event.channel]["users"]){
                if(chanStats[event.server][event.channel]["users"].hasOwnProperty(user)){
                    if(chanStats[event.server][event.channel]["users"][user]["lines"] > max){
                        max = chanStats[event.server][event.channel]["users"][user]["lines"];
                        max_user = user;
                    }
                }
            }
            event.reply(dbot.t("loudest_user", {
                "user": max_user}
            ));
        },
    };

    return {
        'name': 'stats',
        'ignorable': true,
        'commands': commands,
        'listener': function(event){
            
            // Ignore command messages
            if(event.message[0] == "~" || event.user == dbot.name){
                return;
            }
            
            // Check server dbKeys exist
            if(!userStats.hasOwnProperty(event.server)){
                userStats[event.server] = {}
            }
            if(!chanStats.hasOwnProperty(event.server)){
                chanStats[event.server] = {}
            }

            // User-centric Stats
            if(!userStats[event.server].hasOwnProperty(event.user)){
                userStats[event.server][event.user] = {}
            }
            if(!userStats[event.server][event.user].hasOwnProperty(event.channel)){
                userStats[event.server][event.user][event.channel] = {
                    "total_lines": 0,
                    "total_words": 0,
                    "freq_hours": {},
                    "in_mentions": 0,
                    "out_mentions": {},
                    "startstamp": Date.now(),
                };
                
                // Initialize hour frequency counters
                for(var i=0; i<=23; i++){
                    userStats[event.server][event.user][event.channel]["freq_hours"][i] = 0;
                }
            }
            userStats[event.server][event.user][event.channel]["freq_hours"][event.time.getHours()] += 1;
            userStats[event.server][event.user][event.channel]["total_lines"] += 1;
            userStats[event.server][event.user][event.channel]["total_words"] += event.message.split(" ").length;
            
            // Channel-centric Stats
            if(!chanStats[event.server].hasOwnProperty(event.channel)){
                chanStats[event.server][event.channel] = {
                    "total_lines": 0,
                    "total_words": 0,
                    "freq_hours": {},
                    "users": {},
                    "startstamp": Date.now(),
                };
                
                // Initialize hour frequency counters
                for(var i=0; i<=23; i++){
                    chanStats[event.server][event.channel]["freq_hours"][i] = 0;
                }
            }
            if(!chanStats[event.server][event.channel]["users"].hasOwnProperty(event.user)){
                chanStats[event.server][event.channel]["users"][event.user] = {
                    "lines": 0,
                    "mentions": 0 };
            }
            chanStats[event.server][event.channel]["users"][event.user]["lines"] += 1;
            chanStats[event.server][event.channel]["freq_hours"][event.time.getHours()] += 1;
            chanStats[event.server][event.channel]["total_lines"] += 1;
            chanStats[event.server][event.channel]["total_words"] += event.message.split(" ").length;

            // Check whether the line includes any mentions
            if(dbot.db.hasOwnProperty("knownUsers")){
                // Server key should exist in knownUsers
                for (var i = 0; i < dbot.db.knownUsers[event.server].users.length; i++){
                    var name = dbot.db.knownUsers[event.server].users[i];
                    var toMatch = "\\b"+name+":?\\b"
                    if(event.message.search(toMatch) > -1){
                        if(!userStats[event.server][event.user][event.channel]["out_mentions"].hasOwnProperty(name)){
                            userStats[event.server][event.user][event.channel]["out_mentions"][name] = 0;
                        }
                        userStats[event.server][event.user][event.channel]["out_mentions"][name] += 1;
                        userStats[event.server][name][event.channel]["in_mentions"] += 1;
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
