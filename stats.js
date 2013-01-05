var stats = function(dbot){
    var userStats = dbot.db.userStats;
    var chanStats = dbot.db.chanStats;

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

    //TODO(samstudio8): There must be a less terrible way to resolve the weekday
    var days = {'1':"Monday", '2':"Tueday", '3':"Wednesday", '4':"Thursday", '5':"Friday", '6':"Saturday", '0':"Sunday"};

    var api = {
        'fixStats': function(server, name){
            if(!dbot.db.userStats.hasOwnProperty(server) || !dbot.db.chanStats.hasOwnProperty(server)) return;
                
            var userStats = dbot.db.userStats[server];
            var chanStats = dbot.db.chanStats[server];
            var newAlias = name;
            name = name.trim().toLowerCase();

            if(userStats.hasOwnProperty(name)){
                var newName = dbot.api.users.resolveUser(server, newAlias, true);

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
                dbot.save();
            }
        }
    };

    var commands = {
        '~lines': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;
            if(event.params[1]){
                var input = dbot.api.users.resolveUser(event.server, event.params[1], true);
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
                var input = dbot.api.users.resolveUser(event.server, event.params[1], true);
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
                var input = dbot.api.users.resolveUser(event.server, event.params[1], true);
                if(userStats[event.server].hasOwnProperty(input) && userStats[event.server][input].hasOwnProperty(event.channel)){
                    var percent = ((userStats[event.server][input][event.channel]["total_lines"]
                        / chanStats[event.server][event.channel]["total_lines"])*100);
                    event.reply(dbot.t("lines_percent", {
                        "user": input,
                        "chan": event.channel,
                        "percent": percent.numberFormat(2),
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
                event.message = '~lincent ' + dbot.api.users.resolveUser(event.server, event.user, true);
                event.action = 'PRIVMSG';
                event.params = event.message.split(' ');
                dbot.instance.emit(event);
            }
        },

        '~active': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;

            if(event.params[1]){
                var input = dbot.api.users.resolveUser(event.server, event.params[1], true);
                if(userStats[event.server].hasOwnProperty(input) && userStats[event.server][input].hasOwnProperty(event.channel)){
                    var max = -1;
                    var max_day = -1;
                    var max_hour = -1;
                    for(var i=0; i<=6; i++) {
                        for(var j=0; j<=23; j++){
                            if(userStats[event.server][input][event.channel]["freq"][i][j] > max){
                                max = userStats[event.server][input][event.channel]["freq"][i][j];
                                max_day = i;
                                max_hour = j;
                            }
                        }
                    }
                    var start = max_hour;
                    var end = max_hour + 1;
                    if(start == 23){
                        end = "00";
                    }

                    if(max > 0){
                        event.reply(dbot.t("hours_active", {
                            "name": input,
                            "day": days[max_day],
                            "start_hour": start,
                            "end_hour": end,
                            "start": formatDate(userStats[event.server][input][event.channel]["startstamp"]),
                            "tz": getTimezone(userStats[event.server][input][event.channel]["startstamp"])}
                        ));
                    }
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
                var max_day = -1;
                var max_hour = -1;
                for(var i=0; i<=6; i++) {
                    for(var j=0; j<=23; j++){
                        if(chanStats[event.server][event.channel]["freq"][i][j] > max){
                            max = chanStats[event.server][event.channel]["freq"][i][j];
                            max_day = i;
                            max_hour = j;
                        }
                    }
                }
                var start = max_hour;
                var end = max_hour + 1;
                if(start == 23){
                    end = "00";
                }

                if(max > 0){
                    event.reply(dbot.t("hours_active", {
                        "name": event.channel,
                        "day": days[max_day],
                        "start_hour": start,
                        "end_hour": end,
                        "start": formatDate(chanStats[event.server][event.channel]["startstamp"]),
                        "tz": getTimezone(chanStats[event.server][event.channel]["startstamp"])}
                    ));
                }
            }
        },

        '~loudest': function(event){
            if(!chanStats.hasOwnProperty(event.server) || !chanStats[event.server].hasOwnProperty(event.channel)) return;

            if(!event.params[1]){
                var user_sort = Object.prototype.sort(userStats[event.server], function(key, obj) {
                    if(obj[key].hasOwnProperty(event.channel)){
                        return ((obj[key][event.channel].total_lines 
                            / chanStats[event.server][event.channel]["total_lines"])*100).numberFormat(2);
                    }
                    else{ return -1; }
                });
                var leaderboard_str = leaderboarder(user_sort, 5, "%");

                if(leaderboard_str.length > 0){
                    event.reply(dbot.t("loudest", {
                        "chan": event.channel,
                        "start": formatDate(chanStats[event.server][event.channel]["startstamp"]),
                        "list": leaderboard_str}
                    ));
                }
            }
            else{
                event.message = '~lincent ' + dbot.api.users.resolveUser(event.server, event.params[1], true);
                event.action = 'PRIVMSG';
                event.params = event.message.split(' ');
                dbot.instance.emit(event);
            }
        },

        '~verbose': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;

            if(!event.params[1]){
                var wpl_sort = Object.prototype.sort(userStats[event.server], function(key, obj) {
                    if(obj[key].hasOwnProperty(event.channel)){
                        return (userStats[event.server][key][event.channel]["total_words"] 
                            / userStats[event.server][key][event.channel]["total_lines"]).numberFormat(2);
                    }
                    else{ return -1; }
                });
                var leaderboard_str = leaderboarder(wpl_sort, 5, "wpl");

                if(leaderboard_str.length > 0){
                    event.reply(dbot.t("verbose", {
                        "chan": event.channel,
                        "start": formatDate(chanStats[event.server][event.channel]["startstamp"]),
                        "list": leaderboard_str}
                    ));
                }
            }
            else{
                event.message = '~words ' + dbot.api.users.resolveUser(event.server, event.params[1], true);
                event.action = 'PRIVMSG';
                event.params = event.message.split(' ');
                dbot.instance.emit(event);
            }
        },

        '~popular': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;

            if(!event.params[1]){
                var mentions_sort = Object.prototype.sort(userStats[event.server], function(key, obj) {
                    if(obj[key].hasOwnProperty(event.channel)){
                        return obj[key][event.channel]["in_mentions"];
                    }
                    else{ return -1; }
                });
                var leaderboard_str = leaderboarder(mentions_sort);

                if(leaderboard_str.length > 0){
                    event.reply(dbot.t("popular", {
                        "chan": event.channel,
                        "start": formatDate(chanStats[event.server][event.channel]["startstamp"]),
                        "list": leaderboard_str}
                    ));
                }
            }
            else{
                event.message = '~inmentions ' + dbot.api.users.resolveUser(event.server, event.params[1], true);
                event.action = 'PRIVMSG';
                event.params = event.message.split(' ');
                dbot.instance.emit(event);
            }
        },

        '~inmentions': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;
            if(event.params[1]){
                var user = dbot.api.users.resolveUser(event.server, event.params[1], true);
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
                event.message = '~inmentions ' + dbot.api.users.resolveUser(event.server, event.user, true);
                event.action = 'PRIVMSG';
                event.params = event.message.split(' ');
                dbot.instance.emit(event);
            }
        },

        '~outmentions': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;
            if(event.params[1]){
                var user = dbot.api.users.resolveUser(event.server, event.params[1], true);
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
                event.message = '~outmentions ' + dbot.api.users.resolveUser(event.server, event.user, true);
                event.action = 'PRIVMSG';
                event.params = event.message.split(' ');
                dbot.instance.emit(event);
            }
        }
    };

    var integrityCheck = function(){
        //TODO(samstudio8): Also delete no longer required fields
        
        var user_structure = {
            "total_lines": 0,
            "total_words": 0,
            "freq": function(){
                var freq = {};
                for(var i=0; i<=6; i++){
                    freq[i] = {};
                    for(var j=0; j<=23; j++){
                        freq[i][j] = 0;
                    }
                }
                return freq;
            },
            "in_mentions": 0,
            "out_mentions": {},
            "startstamp": function(){
                return Date.now() 
            },
        };

        var chan_structure = {
            "total_lines": 0,
            "total_words": 0,
            "freq": function(){
                var freq = {};
                for(var i=0; i<=6; i++){
                    freq[i] = {};
                    for(var j=0; j<=23; j++){
                        freq[i][j] = 0;
                    }
                }
                return freq;
            },
            "startstamp": function(){
                return Date.now() 
            }
        };

        var userStats = dbot.db.userStats;
        for(var curr_server in userStats){
            if(!userStats.hasOwnProperty(curr_server)) continue;
            for(var curr_user in userStats[curr_server]){
                if(!userStats[curr_server].hasOwnProperty(curr_user)) continue;
                for(var curr_chan in userStats[curr_server][curr_user]){
                    if(!userStats[curr_server][curr_user].hasOwnProperty(curr_chan)) continue;
                    for(var field in user_structure){
                        if(!user_structure.hasOwnProperty(field)) continue;
                        if(!userStats[curr_server][curr_user][curr_chan].hasOwnProperty(field)){
                            if(typeof(user_structure[field]) == "function"){
                                userStats[curr_server][curr_user][curr_chan][field] = user_structure[field].apply();
                            }
                            else{
                                userStats[curr_server][curr_user][curr_chan][field] = user_structure[field];
                            }
                        }
                    }
                }
            }
        }

        var chanStats = dbot.db.chanStats;
        for(var curr_server in chanStats){
            if(!chanStats.hasOwnProperty(curr_server)) continue;
            for(var curr_chan in chanStats[curr_server]){
                if(!chanStats[curr_server].hasOwnProperty(curr_chan)) continue;
                for(var field in chan_structure){
                    if(!chan_structure.hasOwnProperty(field)) continue;
                    if(!chanStats[curr_server][curr_chan].hasOwnProperty(field)){
                        if(typeof(chan_structure[field]) == "function"){
                            chanStats[curr_server][curr_chan][field] = chan_structure[field].apply();
                        }
                        else{
                            chanStats[curr_server][curr_chan][field] = chan_structure[field];
                        }
                    }
                }
            }
        }
        dbot.save();
    };

    return {
        'name': 'stats',
        'version': '0.1',
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
            var user = dbot.api.users.resolveUser(event.server, event.user, true);

            // User-centric Stats
            if(!userStats[event.server].hasOwnProperty(user)){
                userStats[event.server][user] = {}
            }
            if(!userStats[event.server][user].hasOwnProperty(event.channel)){
                //TODO(samstudio8): populateUser function
                userStats[event.server][user][event.channel] = {
                    "total_lines": 0,
                    "total_words": 0,
                    "freq": {},
                    "in_mentions": 0,
                    "out_mentions": {},
                    "startstamp": Date.now(),
                };
                
                // Initialize frequency counters
                for(var i=0; i<=6; i++){
                    userStats[event.server][user][event.channel]["freq"][i] = {};
                    for(var j=0; j<=23; j++){
                        userStats[event.server][user][event.channel]["freq"][i][j] = 0;
                    }
                }
            }
            userStats[event.server][user][event.channel]["freq"][event.time.getDay()][event.time.getHours()] += 1;
            userStats[event.server][user][event.channel]["total_lines"] += 1;
            userStats[event.server][user][event.channel]["total_words"] += event.message.split(" ").filter(function(w, i, array) { return w.length > 0; }).length;
            
            // Channel-centric Stats
            if(!chanStats[event.server].hasOwnProperty(event.channel)){
                //TODO(samstudio8): populateChannel function
                chanStats[event.server][event.channel] = {
                    "total_lines": 0,
                    "total_words": 0,
                    "freq": {},
                    "startstamp": Date.now(),
                };
                
                // Initialize frequency counters
                for(var i=0; i<=6; i++){
                    chanStats[event.server][event.channel]["freq"][i] = {};
                    for(var j=0; j<=23; j++){
                        chanStats[event.server][event.channel]["freq"][i][j] = 0;
                    }
                }
            }
            chanStats[event.server][event.channel]["freq"][event.time.getDay()][event.time.getHours()] += 1;
            chanStats[event.server][event.channel]["total_lines"] += 1;
            chanStats[event.server][event.channel]["total_words"] += event.message.split(" ").length;

            // Check whether the line includes any mentions
            if(dbot.db.hasOwnProperty("knownUsers")){
                var cat = dbot.db.knownUsers[event.server].users.concat(
                        Object.keys(dbot.db.knownUsers[event.server].aliases));
                for (var i = 0; i < cat.length; i++){
                    var name = cat[i];
                    var mentioned = dbot.api.users.resolveUser(event.server, name, true);
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
        'api': api,
        'onLoad': integrityCheck(),
        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot){
    return stats(dbot);
};
