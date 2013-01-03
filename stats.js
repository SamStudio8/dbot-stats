var stats = function(dbot){
    var name = 'stats';
    var userStats = dbot.db.userStats;
    var chanStats = dbot.db.chanStats;

    var linkUser = function(server, name){
        if(dbot.db.hasOwnProperty("knownUsers") && dbot.db.knownUsers.hasOwnProperty(server)){
            if(dbot.db.knownUsers[server]["aliases"].hasOwnProperty(name)){
                return dbot.db.knownUsers[server]["aliases"][name].trim().toLowerCase();
            }
        }
        return name.trim().toLowerCase();
    };

    var formatDate = function(d){
        return new Date(d).toDateString();
    };

    var getTimezone = function(d){
        var date = new Date(d);
        var d = date.toString().match("^(\\w{3} \\w{3} \\d{1,2} \\d{4}) ((\\d{2}:){2}\\d{2}).*\\((.*)\\)$");
        return d[4];
    };

    var leaderboarder = function(sorted, num_results, val_suffix){
        num_results = typeof num_results !== "undefined" ? num_results : 5;
        val_suffix = typeof val_suffix !== "undefined" ? val_suffix : "";

        sorted = sorted.filter(function(w, i, array) { return w[1] > 0; }).reverse().slice(0, num_results);

        var leaderboard = "";
        for(var i=0; i < sorted.length; i++) {
            leaderboard += sorted[i][0] + " (" + sorted[i][1] + val_suffix + "), ";
        }
        return leaderboard.slice(0, -2);
    };

    var commands = {
        '~lines': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;
            if(event.params[1]){
                var input = linkUser(event.server, event.params[1]);
                if(userStats[event.server].hasOwnProperty(input) && userStats[event.server][input].hasOwnProperty(event.channel)){
                    event.reply(dbot.t("user_lines", {
                        "user": input,
                        "chan": event.channel,
                        "lines": userStats[event.server][input][event.channel]["total_lines"].numberFormat(0),
                        "start": formatDate(userStats[event.server][input][event.channel]["startstamp"])}
                    ));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": input}
                    ));
                }
            }
            else{
                if(!chanStats.hasOwnProperty(event.server) || !chanStats[event.server].hasOwnProperty(event.channel)) return;
                event.reply(dbot.t("chan_lines", {
                    "chan": event.channel,
                    "lines": chanStats[event.server][event.channel]["total_lines"].numberFormat(0),
                    "start": formatDate(chanStats[event.server][event.channel]["startstamp"])}
                ));
            }
        },

        '~words': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;
            if(event.params[1]){
                var input = linkUser(event.server, event.params[1]);
                if(userStats[event.server].hasOwnProperty(input) && userStats[event.server][input].hasOwnProperty(event.channel)){
                    event.reply(dbot.t("user_words", {
                        "user": input,
                        "chan": event.channel,
                        "words": userStats[event.server][input][event.channel]["total_words"].numberFormat(0),
                        "avg": (userStats[event.server][input][event.channel]["total_words"] 
                            / userStats[event.server][input][event.channel]["total_lines"]).numberFormat(2),
                        "start": formatDate(userStats[event.server][input][event.channel]["startstamp"])}
                    ));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": input}
                    ));
                }
            }
            else{
                if(!chanStats.hasOwnProperty(event.server) || !chanStats[event.server].hasOwnProperty(event.channel)) return;
                event.reply(dbot.t("chan_words", {
                    "chan": event.channel,
                    "words": chanStats[event.server][event.channel]["total_words"].numberFormat(0),
                    "avg": (chanStats[event.server][event.channel]["total_words"] 
                        / chanStats[event.server][event.channel]["total_lines"]).numberFormat(2),
                    "start": formatDate(chanStats[event.server][event.channel]["startstamp"])}
                ));
            }
        },

        '~lincent': function(event){
            if(!chanStats.hasOwnProperty(event.server) || !chanStats[event.server].hasOwnProperty(event.channel)) return;
            if(event.params[1]){
                var input = linkUser(event.server, event.params[1]);
                if(chanStats[event.server][event.channel]["users"].hasOwnProperty(input)){
                    var percent = ((chanStats[event.server][event.channel]["users"][input]["lines"]
                        / chanStats[event.server][event.channel]["total_lines"])*100);
                    event.reply(dbot.t("lines_percent", {
                        "user": input,
                        "chan": event.channel,
                        "percent": percent.numberFormat(2),
                        "lines": chanStats[event.server][event.channel]["users"][input]["lines"].numberFormat(0),
                        "start": formatDate(userStats[event.server][input][event.channel]["startstamp"])}
                    ));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": input}
                    ));
                }
            }
            else{
                event.message = '~lincent ' + linkUser(event.server, event.user);
                event.action = 'PRIVMSG';
                event.params = event.message.split(' ');
                dbot.instance.emit(event);
            }
        },

        '~active': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;
            if(event.params[1]){
                var input = linkUser(event.server, event.params[1]);
                if(userStats[event.server].hasOwnProperty(input) && userStats[event.server][input].hasOwnProperty(event.channel)){
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
                        "end_hour": end,
                        "start": formatDate(userStats[event.server][event.user][event.channel]["startstamp"]),
                        "tz": getTimezone(userStats[event.server][event.user][event.channel]["startstamp"])}
                    ));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": input}
                    ));
                }
            }
            else{
                if(!chanStats.hasOwnProperty(event.server) || !chanStats[event.server].hasOwnProperty(event.channel)) return;
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
                    "end_hour": end,
                    "start": formatDate(chanStats[event.server][event.channel]["startstamp"]),
                    "tz": getTimezone(chanStats[event.server][event.channel]["startstamp"])}
                ));
            }
        },

        '~loudest': function(event){
            if(!chanStats.hasOwnProperty(event.server) || !chanStats[event.server].hasOwnProperty(event.channel)) return;

            var chan_users = chanStats[event.server][event.channel]["users"];
            var user_sort = Object.prototype.sort(chan_users, function(key, obj) {
                return ((obj[key].lines / chanStats[event.server][event.channel]["total_lines"])*100).numberFormat(2);
            });

            event.reply(dbot.t("loudest_users", {
                "chan": event.channel,
                "start": formatDate(chanStats[event.server][event.channel]["startstamp"]),
                "list": leaderboarder(user_sort, 5, "%")}
            ));
        },

        '~verbose': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;

            var wpl_sort = Object.prototype.sort(userStats[event.server], function(key, obj) {
                if(obj[key].hasOwnProperty(event.channel)){
                    return (userStats[event.server][key][event.channel]["total_words"] 
                        / userStats[event.server][key][event.channel]["total_lines"]).numberFormat(2);
                }
                else{ return -1; }
            });

            event.reply(dbot.t("verbose", {
                "chan": event.channel,
                "start": formatDate(chanStats[event.server][event.channel]["startstamp"]),
                "list": leaderboarder(wpl_sort)}
            ));
        },

        '~popular': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;

            var mentions_sort = Object.prototype.sort(userStats[event.server], function(key, obj) {
                if(obj[key].hasOwnProperty(event.channel)){
                    return obj[key][event.channel]["in_mentions"];
                }
                else{ return -1; }
            });

            event.reply(dbot.t("popular", {
                "chan": event.channel,
                "start": formatDate(chanStats[event.server][event.channel]["startstamp"]),
                "list": leaderboarder(mentions_sort)}
            ));
        },

        '~inmentions': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;
            if(event.params[1]){
                var user = linkUser(event.server, event.params[1]);
                if(userStats[event.server].hasOwnProperty(user)){
                    var mentions_sort = Object.prototype.sort(userStats[event.server], function(key, obj) {
                        if(obj[key].hasOwnProperty(event.channel) && obj[key][event.channel]["out_mentions"].hasOwnProperty(user)){
                            return obj[key][event.channel]["out_mentions"][user];
                        }
                        else{ return -1; }
                    });
                    var leaderboard_str = leaderboarder(mentions_sort);

                    if(leaderboard_str.length > 0){
                        event.reply(dbot.t("in_mentions", {
                            "user": user,
                            "chan": event.channel,
                            "start": formatDate(userStats[event.server][user][event.channel]["startstamp"]),
                            "list": leaderboard_str}
                        ));
                    }
                    else{
                        event.reply(dbot.t("no_in_mentions", {
                            "user": user}
                        ));
                    }
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": user}
                    ));
                }
            }
            else{
                event.message = '~inmentions ' + linkUser(event.server, event.user);
                event.action = 'PRIVMSG';
                event.params = event.message.split(' ');
                dbot.instance.emit(event);
            }
        },

        '~outmentions': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;
            if(event.params[1]){
                var user = linkUser(event.server, event.params[1]);
                if(userStats[event.server].hasOwnProperty(user) && userStats[event.server][user][event.channel]){
                    var mentions = userStats[event.server][user][event.channel]["out_mentions"];
                    var mentions_sort = Object.prototype.sort(mentions, function(key, obj) {
                        return obj[key];
                    });
                    var leaderboard_str = leaderboarder(mentions_sort);

                    if(leaderboard_str.length > 0){
                        event.reply(dbot.t("out_mentions", {
                            "user": user,
                            "chan": event.channel,
                            "start": formatDate(userStats[event.server][user][event.channel]["startstamp"]),
                            "list": leaderboard_str}
                        ));
                    }
                    else{
                        event.reply(dbot.t("no_out_mentions", {
                            "user": user}
                        ));
                    }
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": user}
                    ));
                }
            }
            else{
                event.message = '~outmentions ' + linkUser(event.server, event.user);
                event.action = 'PRIVMSG';
                event.params = event.message.split(' ');
                dbot.instance.emit(event);
            }
        }
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

            //var user = event.user.trim().toLowerCase();
            var user = linkUser(event.server, event.user);

            // User-centric Stats
            if(!userStats[event.server].hasOwnProperty(user)){
                userStats[event.server][user] = {}
            }
            if(!userStats[event.server][user].hasOwnProperty(event.channel)){
                userStats[event.server][user][event.channel] = {
                    "total_lines": 0,
                    "total_words": 0,
                    "freq_hours": {},
                    "in_mentions": 0,
                    "out_mentions": {},
                    "startstamp": Date.now(),
                };
                
                // Initialize hour frequency counters
                for(var i=0; i<=23; i++){
                    userStats[event.server][user][event.channel]["freq_hours"][i] = 0;
                }
            }
            userStats[event.server][user][event.channel]["freq_hours"][event.time.getHours()] += 1;
            userStats[event.server][user][event.channel]["total_lines"] += 1;
            userStats[event.server][user][event.channel]["total_words"] += event.message.split(" ").filter(function(w, i, array) { return w.length > 0; }).length;
            
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
            if(!chanStats[event.server][event.channel]["users"].hasOwnProperty(user)){
                chanStats[event.server][event.channel]["users"][user] = {
                    "lines": 0};
            }
            chanStats[event.server][event.channel]["users"][user]["lines"] += 1;
            chanStats[event.server][event.channel]["freq_hours"][event.time.getHours()] += 1;
            chanStats[event.server][event.channel]["total_lines"] += 1;
            chanStats[event.server][event.channel]["total_words"] += event.message.split(" ").length;

            // Check whether the line includes any mentions
            if(dbot.db.hasOwnProperty("knownUsers")){
                var cat = dbot.db.knownUsers[event.server].users.concat(
                        Object.keys(dbot.db.knownUsers[event.server].aliases));
                for (var i = 0; i < cat.length; i++){
                    var name = cat[i];
                    var mentioned = linkUser(event.server, name);
                    if(userStats[event.server].hasOwnProperty(mentioned) && userStats[event.server][mentioned][event.channel]){
                        var toMatch = "( |^)"+name.escape().toLowerCase()+":?(?=\\s|$)";
                        if(event.message.toLowerCase().search(toMatch) > -1){
                            if(!userStats[event.server][user][event.channel]["out_mentions"].hasOwnProperty(mentioned)){
                                userStats[event.server][user][event.channel]["out_mentions"][mentioned] = 0;
                            }
                            userStats[event.server][user][event.channel]["out_mentions"][mentioned] += 1;
                            userStats[event.server][mentioned][event.channel]["in_mentions"] += 1;
                        }
                    }
                }
            }
        },
        'fixStats': function(server, name){
            var newAlias = name;
            name = name.trim().toLowerCase();

            if(dbot.db.userStats[server].hasOwnProperty(name)){
                var newName = dbot.db.knownUsers[server]["aliases"][newAlias].trim().toLowerCase();
                var userStats = dbot.db.userStats[server];
                var chanStats = dbot.db.chanStats[server];

                // Rename userStats key
                userStats[newName] = userStats[name];
                delete userStats[name];

                // Rename keys in all out_mentions on this server
                for(var curr_user in userStats){
                    if(userStats.hasOwnProperty(curr_user)){
                        for(var curr_channel in userStats[curr_user]){
                            if(!userStats[curr_user].hasOwnProperty(curr_channel)) continue;
                            if(userStats[curr_user][curr_channel]["out_mentions"].hasOwnProperty(name)){
                                userStats[curr_user][curr_channel]["out_mentions"][newName] = userStats[curr_user][curr_channel]["out_mentions"][name];
                                delete userStats[curr_user][curr_channel]["out_mentions"][name];
                            }
                        }
                    }
                }

                // Rename user in all chanStats keys for this server
                for(var curr_chan in chanStats){
                    if(chanStats.hasOwnProperty(curr_chan)){
                        if(chanStats[curr_chan]["users"].hasOwnProperty(name)){
                            chanStats[curr_chan]["users"][newName] = chanStats[curr_chan]["users"][name];
                            delete chanStats[curr_chan]["users"][name];
                        }
                    }
                }
                dbot.save();
            }
        },
        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot){
    return stats(dbot);
};
