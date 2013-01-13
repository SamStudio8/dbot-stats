var stats = function(dbot){
    var userStats = dbot.db.userStats;
    var chanStats = dbot.db.chanStats;

    var _ = require('underscore')._

    var user_structure = {
        "lines": {},
        "words": {},
        "lincent": {
            "format": function(data){
                return data.numberFormat(2)+"%";
            },
            "get": function(getreq){
                if(!getreq) return;
                if(!getreq.server || !getreq.user || !getreq.channel) return -1;
                var user_lines = api.getUserStat(getreq.server, getreq.user, getreq.channel, ["lines"]);
                var chan_lines = api.getChanStat(getreq.server, getreq.channel, ["lines"]);
                if(!user_lines || !chan_lines) return -1;
                return this.format((user_lines.raw / chan_lines.raw)*100);
            },
        },
        "wpl": {
            "format": function(data){
                return data.numberFormat(2)+" wpl";
            },
            "get": function(getreq){
                if(!getreq) return;
                if(!getreq.server || !getreq.user || !getreq.channel) return -1;
                var user_words = api.getUserStat(getreq.server, getreq.user, getreq.channel, ["words"]);
                var user_lines = api.getUserStat(getreq.server, getreq.user, getreq.channel, ["lines"]);
                if(!user_words || !user_lines) return -1;
                return this.format(user_words.raw / user_lines.raw);
            },
        },
        "freq": {
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
            //TODO Get field passes to format
            "format": function(data, day, hour){
                if(!day || !hour) return -1;
                if(day >= 0 && day <= 6 && hour >= 0 && hour <= 23){
                    return data[day][hour].numberFormat(0);
                }
                else{
                    return -1;
                }
            },
            "add": function(addreq){
                if(!addreq.day || !addreq.hour || !addreq.inc) return;
                if(addreq.day < 0 && addreq.day > 6 && addreq.hour < 0 && addreq.hour > 23) return;
                this.data[addreq.day][addreq.hour] += addreq.inc;
            },
        },
        "in_mentions": {},
        "out_mentions": {
            "def": {},
            "format": function(data){
                return data.numberFormat(0);
            },
            "add": function(addreq){
                if(!addreq.mentioned || !addreq.inc) return;
                if(!_.has(this.data, addreq.mentioned)){
                    this.data[addreq.mentioned] = 0;
                }
                this.data[addreq.mentioned] += addreq.inc;
            },
            "get": function(getreq){
                if(!getreq.mentioned || !_.has(this.data, getreq.mentioned)) return;
                return this.format(this.data[getreq.mentioned]);
            },
        },
        "init": {
            "def": function(){
                return Date.now();
            },
            "toString": function(){ 
                return formatDate(this.stamp);
            }
        }
    };

    var chan_structure = {
        "lines": {},
        "words": {},
        "freq": {
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
            },
            "add": function(addreq){
                if(!addreq.day || !addreq.hour || !addreq.inc) return;
                if(addreq.day < 0 && addreq.day > 6 && addreq.hour < 0 && addreq.hour > 23) return;
                this.data[addreq.day][addreq.hour] += addreq.inc;
            },
        },
        "init": {
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

        // If a field does not define a format method, the data is to be
        // returned as a number with thousands seperators
        var format;
        if(!toField.format){
            format = function(data){
                return data.numberFormat(0);
            };
        }
        else{
            format = toField.format;
        }

        // If a field defines an add method, this will override the default
        var __add;
        if(!toField.add){
            __add = function(inc){
                this.data += inc;
            };
        }
        else{
            __add = toField.add;
        }

        // If a field defines a get method, this will override the default
        var get;
        if(!toField.get){
            get = function(getreq){
                return this.data;
            };
        }
        else{
            get = toField.get;
        }

        // If a field was manufactured before arriving at the factory, complete 
        // its data value and output it in the state in which it arrived.
        if(_.contains(prefabFields, key)){
            toField["data"] = def;
            return toField;
        }

        return {
            "name": key,
            "data": def,
            "format": format,
            "toString": function(){
                return this.format(this.data);
            },
            "get": get,
            "__add": __add,
            "add": function(input){
                this.__add(input);
                this.time.last.stamp = Date.now();
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
        
        'getChanStat': function(server, channel, field){
            if(!_.has(userStats, server) || !_.has(chanStats, server)) return null;
            if(!_.has(chanStats[server], channel) || !_.has(chanStats[server][channel], field)) return null;

            field = field.toLowerCase();
            var reply = {
                "field": field,
                "data": dbot.db.chanStats[server][channel][field], 
                "raw": dbot.db.chanStats[server][channel][field].data, 
                "init": dbot.db.chanStats[server][channel][field].time.init, 
                "last": dbot.db.chanStats[server][channel][field].time.last,
            };
            return reply;
        },

        'getUserStat': function(server, nick, channel, fields){
            if(!server || !nick || !channel || !fields) return null;
            if(!_.has(userStats, server) || !_.has(chanStats, server)) return null;

            var primary = dbot.api.users.resolveUser(server, nick, true);
            var reqobj = {"server": server, "user": primary, "channel": channel};

            if(!_.has(userStats[server], primary)
                    || !_.has(userStats[server][primary], channel)
                    || !_.has(chanStats[server], channel)) return null;

            var display = primary;
            if(primary != nick.toLowerCase()){
                display = nick.toLowerCase()+" ("+primary+")";
            }

            var fieldResults = {};
            _.each(fields, function(field){
                field = field.toLowerCase();
                fieldResults[field] = {};
                if(_.has(userStats[server][primary][channel], field)){
                    fieldResults[field]["name"] = field;
                    fieldResults[field]["data"] = dbot.db.userStats[server][primary][channel][field].get(reqobj);
                    fieldResults[field]["raw"] = dbot.db.userStats[server][primary][channel][field].data;
                    fieldResults[field]["init"] = dbot.db.userStats[server][primary][channel][field].time.init;
                    fieldResults[field]["last"] =  dbot.db.userStats[server][primary][channel][field].time.last;
                }
                else{
                    fieldResults[field]["code"] = -1;
                }
            });

            var reply = {
                "display": display,
                "primary": primary,
                "fields": fieldResults,
            };
            return reply;
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
        '~lines': function(event){
            if(event.params[1]){
                var result = api.getUserStat(event.server, event.params[1], event.channel, ["lines"]);
                if(result){
                    event.reply(dbot.t("user_lines", {
                        "user": result.primary,
                        "chan": event.channel,
                        "lines": result.fields.lines.data,
                        "start": result.fields.lines.init
                    }));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": event.params[1].toLowerCase()
                    }));
                }
            }
            else{
                //TODO(samstudio8) Update chanStats
                var result = api.getChanStat(event.server, event.channel, "lines");
                if(result){
                    event.reply(dbot.t("chan_lines", {
                        "chan": event.channel,
                        "lines": result.data,
                        "start": result.init
                    }));
                }
            }
        },

        '~words': function(event){
            if(event.params[1]){
                var result = api.getUserStat(event.server, event.params[1], event.channel, ["words", "wpl"]);
                if(result){
                    event.reply(dbot.t("user_words", {
                        "user": result.primary,
                        "chan": event.channel,
                        "words": result.fields.words.data,
                        "avg": result.fields.wpl.data,
                        "start": result.init
                    }));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": event.params[1].toLowerCase()
                    }));
                }
            }
            else{
                var result = api.getChanStat(event.server, event.channel, "words");
                if(result){
                    event.reply(dbot.t("chan_words", {
                        "chan": event.channel,
                        "words": result.data,
                        "avg": (result.raw / chanStats[event.server][event.channel]["lines"].data).numberFormat(2),
                        "start": result.init
                    }));
                }
            }
        },

        '~lincent': function(event){
            if(event.params[1]){
                var result = api.getUserStat(event.server, event.params[1], event.channel, ["lincent", "lines"]);
                if(result){
                    event.reply(dbot.t("lines_percent", {
                        "user": result.primary,
                        "chan": event.channel,
                        "percent": results.fields.lincent.data,
                        "lines": results.fields.lines.data,
                        "start": result.init
                    }));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": event.params[1].toLowerCase()
                    }));
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
                    //TODO(samstudio8) Doom, it was going so well.
                    _.each(userStats[serverName][userName][chanName], function(field, fieldName){
                        _.defaults(userStats[serverName][userName][chanName][fieldName], fieldFactoryUserProduct[fieldName]);
                        userStats[serverName][userName][chanName][fieldName].toString = fieldFactoryUserProduct[fieldName].toString;
                        if(_.has(fieldFactoryUserProduct[fieldName], "time")){
                            userStats[serverName][userName][chanName][fieldName].time.init.toString = fieldFactoryUserProduct[fieldName].time.init.toString;
                            userStats[serverName][userName][chanName][fieldName].time.last.toString = fieldFactoryUserProduct[fieldName].time.last.toString;
                        }
                    });
                });
            });
        });

        _.each(chanStats, function(server, serverName){
            _.each(chanStats[serverName], function(chan, chanName){
                _.defaults(chanStats[serverName][chanName], fieldFactoryChanProduct);
                //TODO(samstudio8) Doom, not chan stats too!
                _.each(chanStats[serverName][chanName], function(field, fieldName){
                    _.defaults(chanStats[serverName][chanName][fieldName], fieldFactoryChanProduct[fieldName]);
                    chanStats[serverName][chanName][fieldName].toString = fieldFactoryChanProduct[fieldName].toString;
                    if(_.has(fieldFactoryChanProduct[fieldName], "time")){
                        chanStats[serverName][chanName][fieldName].time.init.toString = fieldFactoryChanProduct[fieldName].time.init.toString;
                        chanStats[serverName][chanName][fieldName].time.last.toString = fieldFactoryChanProduct[fieldName].time.last.toString;
                    }
                });
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

            var user = dbot.api.users.resolveUser(event.server, event.user, true);
            var num_words = event.message.split(" ").filter(function(w, i, array) { return w.length > 0; }).length

            // User-centric Stats
            if(!userStats[event.server].hasOwnProperty(user)){
                userStats[event.server][user] = {}
            }
            if(!userStats[event.server][user].hasOwnProperty(event.channel)){
                userStats[event.server][user][event.channel] = {}
                _.defaults(userStats[event.server][user][event.channel], fieldFactoryUserProduct);
            }
            userStats[event.server][user][event.channel]["freq"].add({"day": event.time.getDay(), "hour": event.time.getHours(), "inc": 1});
            userStats[event.server][user][event.channel]["lines"].add(1);
            userStats[event.server][user][event.channel]["words"].add(num_words);
            
            // Channel-centric Stats
            if(!chanStats[event.server].hasOwnProperty(event.channel)){
                chanStats[event.server][event.channel] = {}
                _.defaults(chanStats[event.server][event.channel], fieldFactoryChanProduct);
            }
            chanStats[event.server][event.channel]["freq"].add({"day": event.time.getDay(), "hour": event.time.getHours(), "inc": 1});
            chanStats[event.server][event.channel]["lines"].add(1);
            chanStats[event.server][event.channel]["words"].add(num_words);

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
                            userStats[event.server][user][event.channel]["out_mentions"].add({"mentioned": mentioned, "inc": 1});
                            userStats[event.server][mentioned][event.channel]["in_mentions"].add(1);
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
