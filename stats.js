var stats = function(dbot){
    var userStats = dbot.db.userStats;
    var chanStats = dbot.db.chanStats;

    var _ = require('underscore')._

    var user_structure = {
        "lines": {
            "name": "lines",
            "format": function(data){
                return data.numberFormat(0);
            }
        },
        "words": {
            "name": "words",
            "format": function(data){
                return data.numberFormat(0);
            }
        },
        "freq": {
            "name": "freq",
            "def": function(){ 
                var freq = {};
                for(var i=0; i<=6; i++){
                    freq[i] = {};
                    for(var j=0; j<=23; j++){
                        freq[i][j] = 0;
                    }
                }
                return freq;
            },
            "format": function(data, day, hour){
                if(!day || !hour) return -1;
                if(day >= 0 && day <= 6 && hour >= 0 && hour <= 23){
                    return data[day][hour].numberFormat(0);
                }
                else{
                    return -1;
                }
            }
        },
        "in_mentions": {
            "name": "in_mentions",
            "format": function(data){
                return data.numberFormat(0);
            }
        },
        "out_mentions": {
            "name": "out_mentions",
            "def": {},
            "format": function(data, user){
                if(!user || !_has(data, user)) return -1;
                return data[user].numberFormat(0);
            }
        },
        "init": {
            "name": "init",
            "def": function(){
                return Date.now();
            },
            "toString": function(){ 
                return formatDate(this.stamp);
            }
        }
    };

    var chan_structure = {
        "lines": {
            "name": "lines",
            "format": function(data){
                return data.numberFormat(0);
            }
        },
        "words": {
            "name": "words",
            "format": function(data){
                return data.numberFormat(0);
            }
        },
        "freq": {
            "name": "freq",
            "def": function(){ 
                var freq = {};
                for(var i=0; i<=6; i++){
                    freq[i] = {};
                    for(var j=0; j<=23; j++){
                        freq[i][j] = 0;
                    }
                }
                return freq;
            },
            "format": function(data, day, hour){
                if(!day || !hour) return -1;
                if(day >= 0 && day <= 6 && hour >= 0 && hour <= 23){
                    return data[day][hour].numberFormat(0);
                }
                else{
                    return -1;
                }
            }
        },
        "init": {
            "name": "init",
            "def": function(){
                return Date.now();
            },
            "toString": function(){ 
                return formatDate(this.stamp);
            }
        }
    };

    var prefabFields = ["init"];
    var fieldFactory = function(key, toField){

        // Handle the default value for the field
        var def = 0;
        if(toField.def){
            if(_.isFunction(toField.def)){
                def = toField.def.apply();
            }
            else{
                def = toField.def;
            }
        }

        // If a field was manufactured before arriving at the factory, complete 
        // its data value and output it in the state in which it arrived.
        if(_.contains(prefabFields, key)){
            toField["data"] = def;
            return toField;
        }

        return {
            "name": toField.name,
            "data": def,
            "format": toField.format,
            "toString": function(){
                return this.format(this.data);
            },
            "inc": function(){
                // Increment the data field if it is a number
                if(!isNaN(parseFloat(this.data)) && isFinite(this.data)){
                    this.data += 1;
                }
                else{
                    console.log("[STAT][WARN] Attempt to increment a non-numeric field: "+this.name);
                }
            },
            "time": {
                "init": {
                    "stamp": Date.now(),
                    "toString": function(){ return formatDate(this.stamp); }
                },
                "last": {
                    "stamp": Date.now(),
                    "toString": function(){ return formatDate(this.stamp); }
                }
            }
        }
    };

    var fieldFactoryUserProduct = {};
    _.each(user_structure, function(value, key, obj){
        return fieldFactoryUserProduct[key] = fieldFactory(key, value);
    });

    var fieldFactoryChanProduct = {};
    _.each(chan_structure, function(value, key, obj){
        return fieldFactoryChanProduct[key] = fieldFactory(key, value);
    });

    var formatDate = function(d, fullForm){
        if(!fullForm){
            return new Date(d).toDateString();
        }
        else{
            return new Date(d).toString();
        }
    };

    var dateActive = function(last, interval){
        return((Date.now() - last) < interval*60000);
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

    //TODO(samstudio8):
    //I am not proud of this!
    //Create an internal API to perform calculations such as wpl/lincent
    //that can be used by the commands as well as the API
    var internalAPI = {
        //Note that the existence of relevant stats dbKeys will have 
        //already been determined outside of the call to a validField
        //function and there is no need to check their existence here
        "total_lines": function(req){
            return userStats[req.server][req.primary][req.channel]["total_lines"].numberFormat(0);
        },
        "total_words": function(req){
            return userStats[req.server][req.primary][req.channel]["total_words"].numberFormat(0);
        },
        "lincent": function(req){
            return (((userStats[req.server][req.primary][req.channel]["total_lines"]
                    / chanStats[req.server][req.channel]["total_lines"])*100).numberFormat(2))+"%";
        },
        "wpl": function(req){
            return ((userStats[req.server][req.primary][req.channel]["total_words"]
                    / userStats[req.server][req.primary][req.channel]["total_lines"]).numberFormat(2))+" wpl";
        },
        "in_mentions": function(req){
            return userStats[req.server][req.primary][req.channel]["in_mentions"].numberFormat(0);
        }
    };

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
        },

        'isActive': function(request){
            // If inLast is not defined, default to ten minutes
            var inLast = typeof request.inLast !== "undefined" ? inLast : 10;

            if(request.server){
                if(!dbot.db.userStats.hasOwnProperty(request.server) || !dbot.db.chanStats.hasOwnProperty(request.server)) return false;

                if(request.user && request.channel){
                    var user = dbot.api.users.resolveUser(request.server, request.user, true);
                    if(userStats[request.server].hasOwnProperty(user) && userStats[request.server][user].hasOwnProperty(request.channel)){
                        return dateActive(userStats[request.server][user][request.channel]["last"], inLast);
                    }
                }
                else if(request.user){
                    var user = dbot.api.users.resolveUser(request.server, request.user, true);
                    if(!userStats[request.server].hasOwnProperty(user)) return false;
                    for(var curr_chan in userStats[request.server][user]){
                        if(userStats[request.server][user].hasOwnProperty(curr_chan)){
                            if(dateActive(userStats[request.server][user][curr_chan]["last"], inLast)) return true;
                        }
                    }
                }
                else if(request.channel){
                    if(!chanStats[request.server].hasOwnProperty(request.channel)) return false;
                    return dateActive(chanStats[request.server][request.channel]["last"], inLast);
                }
            }
            // Request was missing a component or dbKey does not exist
            return false;
        },

        //TODO(samstudio8)
        //The input for this function should be an object, this will also make
        //handling calls to any required internalAPI functions below tidier
        'getUserStats': function(server, nick, channel, fields){
            var primary = dbot.api.users.resolveUser(server, nick, true);
            var user = {
                'display': primary,
                'primary': primary
            } 
            if(primary != nick.toLowerCase()){
                user.display = nick.toLowerCase()+" ("+primary+")";
            }
            if(!chanStats.hasOwnProperty(server) || !userStats.hasOwnProperty(server)) return user;

            if(!fields){
                //Use all available fields if a specific list was not defined
                var fields = Object.keys(internalAPI);
            }
            if(!userStats[server].hasOwnProperty(primary)
                    || !userStats[server][primary].hasOwnProperty(channel)
                    || !chanStats[server].hasOwnProperty(channel)) return user;
            for(var i=0; i<fields.length; i++){
                var curr_field = fields[i].toLowerCase();
                if(internalAPI.hasOwnProperty(curr_field)){
                    if(typeof(internalAPI[curr_field]) == "function"){
                        var request = {
                            "server": server,
                            "primary": primary,
                            "channel": channel};
                        user[curr_field] = internalAPI[curr_field](request);
                    }
                    else{
                        user[curr_field] = userStats[server][primary][channel][curr_field];
                    }
                }
            }
            return user;
        }
    };

    var commands = {
        '~test': function(event){

            event.reply(dbot.t("user_lines", {
                "user": "test",
                "chan": event.channel,
                "lines": user_test.lines, //Use API!
                "start": user_test.lines.time.init}
            ));
        },

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
        },

        '~last': function(event){
            if(!userStats.hasOwnProperty(event.server)) return;
            if(event.params[1]){
                var user = dbot.api.users.resolveUser(event.server, event.params[1], true);
                if(userStats[event.server].hasOwnProperty(user) && userStats[event.server][user][event.channel]){
                    event.reply(user+" last seen: "+formatDate(userStats[event.server][user][event.channel]["last"], 1));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": user}
                    ));
                }
            }
            else{
                if(!chanStats.hasOwnProperty(event.server) || !chanStats[event.server].hasOwnProperty(event.channel)) return;
                event.reply(event.channel+" last activity: "+formatDate(chanStats[event.server][event.channel]["last"], 1));
            }
            
        }
    };

    var integrityCheck = function(){
        //TODO(samstudio8): Also delete no longer required fields
        _.each(userStats, function(server, serverName){
            _.each(userStats[serverName], function(user, userName){
                _.each(userStats[serverName][userName], function(chan, chanName){
                    _.defaults(userStats[serverName][userName][chanName], fieldFactoryUserProduct);
                });
            });
        });

        _.each(chanStats, function(server, serverName){
            _.each(chanStats[serverName], function(chan, chanName){
                _.defaults(chanStats[serverName][chanName], fieldFactoryChanProduct);
            });
        });
        dbot.save();
    };

    return {
        'name': 'stats',
        'ignorable': true,
        'commands': commands,
        'listener': function(event){
            
            // Ignore command messages
            if(event.message[0] == "~"){
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
//                _.defaults(userStats[event.server][user][event.channel], fieldFactoryUserProduct);

                userStats[event.server][user][event.channel] = {
                    "total_lines": 0,
                    "total_words": 0,
                    "freq": {},
                    "in_mentions": 0,
                    "out_mentions": {},
                    "startstamp": Date.now(),
                    "last": Date.now()
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
            userStats[event.server][user][event.channel]["last"] = event.time.getTime();
            
            // Channel-centric Stats
            if(!chanStats[event.server].hasOwnProperty(event.channel)){
//                _.defaults(userStats[serverName][chanName], fieldFactoryChanProduct);

                chanStats[event.server][event.channel] = {
                    "total_lines": 0,
                    "total_words": 0,
                    "freq": {},
                    "startstamp": Date.now(),
                    "last": Date.now()
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
            chanStats[event.server][event.channel]["last"] = event.time.getTime();

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
