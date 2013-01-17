var _ = require('underscore')._;

var api = function(dbot) {
    return {

        /**
         * Given a server and alias, resolve the alias to the user's primary
         * nick and transfer statistics dbKeys pertaining to the alias to the
         * new primary name.
         */
        'renameStats': function(server, alias){
            if(!_.has(dbot.db.userStats, server)
                    || !_.has(dbot.db.chanStats, server)) return;

            var userStats = dbot.db.userStats[server];
            var chanStats = dbot.db.chanStats[server];

            if(_.has(userStats, alias)){
                var primary = dbot.api.users.resolveUser(server, alias, true);
                primary = primary.toLowerCase();
                alias = alias.trim().toLowerCase();

                // Rename userStats key
                userStats[primary] = userStats[alias];
                delete userStats[alias];

                // Rename keys in all out_mentions on this server
                _.each(userStats, function(user, userName){
                    _.each(user, function(chan, chanName){
                        if(_.has(chan["out_mentions"], alias)){
                            chan.out_mentions.data[primary] = chan.out_mentions.data[alias];
                            delete chan.out_mentions.data[alias];
                        }
                    });
                });
                dbot.save();
            }
        },

        /**
         * Merge the statistics keys of one user into another.
         */
        'mergeStats': function(server, mergeTo, mergeFrom){
            if(!_.has(dbot.db.userStats, server)
                    || !_.has(dbot.db.chanStats, server)) return;

            var userStats = dbot.db.userStats[server];
            var chanStats = dbot.db.chanStats[server];

            var mergeToPrimary = dbot.api.users.resolveUser(server, mergeTo, true).toLowerCase();
            var mergeFromPrimary = dbot.api.users.resolveUser(server, mergeFrom, true).toLowerCase();
            if(!_.has(userStats, mergeToPrimary)
                    || !_.has(userStats, mergeFromPrimary)) return;

            // Call merge on each of mergeTo's fields, passing the equivalent 
            // field itself from mergeFrom
            _.each(userStats[mergeToPrimary], function(chan, chanName){
                _.each(chan, function(field, fieldName){
                    if(_.has(userStats[mergeFromPrimary][chanName], fieldName)){
                        field.merge(userStats[mergeFromPrimary][chanName][fieldName]);
                    }
                });
            });

            // Copy channels from mergeFrom that do not already exist in mergeTo
            // There should be no need to check for the existence of all fields
            // as this will have been done by the onLoad integrity check.
            _.defaults(userStats[mergeToPrimary], userStats[mergeFromPrimary]);

            // Erase mergeFrom's data from userStats
            delete userStats[mergeFromPrimary];

            // Reassign_all mentions of mergeFrom on this server to mergeTo
            _.each(userStats, function(user, userName){
                _.each(user, function(chan, chanName){
                    if(_.has(chan.out_mentions.data, mergeFromPrimary)){
                        chan.out_mentions.add({
                            "mentioned": mergeToPrimary,
                            "inc": chan.out_mentions.getRaw({"mentioned": mergeFromPrimary})
                        });
                        delete chan.out_mentions.data[mergeFromPrimary];
                    }
                });
            });

            // Remove any self mentions that may have resulted
            _.each(userStats[mergeToPrimary], function(chan, chanName){
                if(_.has(chan.out_mentions.data, mergeToPrimary)){
                    chan.in_mentions.data -= chan.out_mentions.data[mergeToPrimary];
                    delete chan.out_mentions.data[mergeToPrimary];
                };
            });
        },

        /**
         * Determine whether for a given number of minutes; a user has been 
         * active in any channel on a server, in a particular channel or if a 
         * channel itself on a given server has had any activity recorded in
         * that period of time.
         */
        'isActive': function(request){
            // If inLast is not defined, default to ten minutes
            var inLast = typeof request.inLast !== "undefined" ? inLast : 10;
            var dateActive = function(last, interval){
                return((Date.now() - last) < interval*60000);
            };

            if(request.server){
                if(!_.has(dbot.db.userStats, request.server)
                        || !_.has(dbot.db.chanStats, request.server)) return false;

                var userStats = dbot.db.userStats[request.server];
                var chanStats = dbot.db.chanStats[request.server];

                //TODO(samstudio8) Use the API
                if(request.user && request.channel){
                    var primary = dbot.api.users.resolveUser(request.server, request.user, true);
                    primary = primary.toLowerCase();
                    if(_.has(userStats, primary)
                            && _.has(userStats[primary], request.channel)){
                        return dateActive(userStats[primary][request.channel].lines.time.last.stamp, inLast);
                    }
                }
                else if(request.user){
                    var primary = dbot.api.users.resolveUser(request.server, request.user, true);
                    primary = primary.toLowerCase();
                    if(!_.has(!userStats, primary)) return false;
                    _.each(userStats[primary], function(chan, chanName){
                        if(dateActive(userStats[primary][curr_chan].lines.time.last.stamp, inLast)) return true;
                    });
                }
                else if(request.channel){
                    if(!_.has(chanStats, request.channel)) return false;
                    return dateActive(chanStats[request.channel].lines.time.last.stamp, inLast);
                }
            }
            // Request was missing a component or dbKey does not exist
            return false;
        },

        /**
         * Return all users of a given server who have activity recorded for
         * a particular channel on that server, in the form of an object.
         * The object keys are the primary names of those users with the value
         * being reference to the userStats.server.user.channel dbKey for that
         * particular user.
         */
        '__getChanUsers': function(server, channel){
            if(!server || !channel) return [];
            if(!_.has(dbot.db.userStats, server) 
                    || !_.has(dbot.db.chanStats, server)
                    || !_.has(dbot.db.chanStats[server], channel)) return [];

              var userStats = dbot.db.userStats[server];
              var users = {};
              _.each(userStats, function(user, userName){
                  if(_.has(userStats[userName], channel)){
                      users[userName] = userStats[userName][channel];
                  }
              });
              return users;
        },
        
        /**
         * Search and sort through the data structure for the purpose of 
         * building a 'leaderboard' string detailing the top or bottom scorers
         * for a given statistic.
         */
        'leaderboarder': function(server, user, channel, field, places, reverse){
            //TODO(samstudio8) Implement reverse parameter
            
            if(!server || !field) return false;
            if(!_.has(dbot.db.userStats, server) 
                    || !_.has(dbot.db.chanStats, server)) return false;

            var userStats = dbot.db.userStats[server];
            var chanStats = dbot.db.chanStats[server];

            // Resolve leaderboading methods to the user field that should 
            // first be sorted to construct a leaderboard.
            var chan_leaderboards = {
                "loudest": "lincent",
                "verbose": "wpl",
                "popular": "in_mentions",
            };

            //TODO(samstudio8)
            // There should be a nicer way to do this, I'm just too tired to
            // think of it right now...
            //
            // Each API method that uses both a user and channel parameter
            // is attached to an object that will define how the data that is 
            // to be sorted should be discovered and collected;
            //
            //    Search
            //      Dictate whether to iterate over users in the channel
            //
            //        true  -   Iterate over all users with activity in the 
            //                  given channel and collect the required field
            //        false -   The field to be sorted belongs to the user
            //                  object itself
            //
            //    Match 
            //      Only required if Search is true
            //      Defines whether the data collected by search must be matched
            //      for a particular key before data can be collected
            //
            //        true  -   The data found by the initial search is an 
            //                  object which must be checked for the appropriate 
            //                  key (which may or may not exist) such as a 
            //                  particular user
            //        false -   The data found by the initial search is a simple
            //                  counter or other such field that does not
            //                  need to be checked for a certain key
            //                  
            var user_chan_boards = {
                "out_mentions": {
                    "field": "out_mentions",
                    "search": false,
                },
                "in_mentions": {
                    "field": "out_mentions",
                    "search": true,
                    "search_field": "mentioned",
                    "match": true
                }
            };
            
            if(user && channel){
                var primary = dbot.api.users.resolveUser(server, user, true);
                primary = primary.toLowerCase();
                if(!_.has(chanStats, channel)
                        || !_.has(userStats, primary)
                        || !_.has(userStats[primary], channel)) return false;
                
                var sorted;
                if(user_chan_boards[field].search == true){
                    if(user_chan_boards[field].match == true){
                        //TODO(samstudio8) Update to underscore.js when you are
                        //less angry at it...
                        sorted = Object.prototype.sort(dbot.api.stats.__getChanUsers(server, channel), function(key, obj) {
                                //TODO(samstudio8) 
                                // Assuming search is for primary...
                                // Although at the moment this is pretty much 
                                // the only thing that requires searching for.
                                var reqobj = {"server": server, "user": primary, "channel": channel};
                                reqobj[user_chan_boards[field].search_field] = primary;
                                return obj[key][user_chan_boards[field].field].getRaw(reqobj);
                            }
                        );
                    }
                    else{
                        // Currently no commands require this functionality
                        return false;
                    }
                }
                else{
                    // Sort a particular users data
                    sorted = Object.prototype.sort(
                        userStats[primary][channel][user_chan_boards[field].field].data, 
                        function(key, obj) {
                            return obj[key];
                        }
                    );
                }
                
                // Build the leaderboard string
                var leaderboard_str = "";
                sorted = sorted.filter(function(w, i, array) { return w[1] > 0; }).reverse().slice(0, places);
                for(var i=0; i < sorted.length; i++) {
                    leaderboard_str += sorted[i][0] + " (" + sorted[i][1] + "), ";
                }
                leaderboard_str = leaderboard_str.slice(0, -2);

                //Euch
                var init = userStats[primary][channel].init;
            }
            else if(user){
                //TODO(samstudio8)[FUTURE] Summary server stats across all channels?
                return false;
            }
            else if(channel){
                if(!_.has(chanStats, channel)) return false;
                var users = dbot.api.stats.__getChanUsers(server, channel);
                var sorted = _.chain(users)
                    .pairs()
                    .sortBy(function(item) { 
                        var reqobj = {"server": server, "user": item[0], "channel": channel};
                        return item[1][chan_leaderboards[field]].getRaw(reqobj);
                    })
                    .reverse()
                    .first(places)
                    .value();

                var leaderboard_str = "";
                _.each(sorted, function(item){
                    var reqobj = {"server": server, "user": item[0], "channel": channel};
                    leaderboard_str += item[0] + " (" + item[1][chan_leaderboards[field]].get(reqobj) + "), ";
                });
                leaderboard_str = leaderboard_str.slice(0, -2);

                //Euch
                var init = chanStats[channel].init;
            }
            else{ return false; }

            return {
                "leaderboard": leaderboard_str,
                "places": sorted.length,
                "init": init,
            };
        },

        /**
         * Handle the various operations that can be performed on user and
         * channel frequency arrays.
         */
        'frequencher': function(server, nick, channel, func){
            if(!_.has(dbot.db.userStats, server) 
                    || !_.has(dbot.db.chanStats, server)) return false;

            var userStats = dbot.db.userStats[server];
            var chanStats = dbot.db.chanStats[server];

            // Define a set of functions to be applied to frequency arrays in
            // order to return the desired field.
            var freq_funcs = {

                // Return the most active day-hour interval for a given array.
                "active": function(freq){
                    var days = {'1':"Monday",
                                '2':"Tueday",
                                '3':"Wednesday",
                                '4':"Thursday",
                                '5':"Friday",
                                '6':"Saturday",
                                '0':"Sunday"};

                    var max = -1;
                    var max_day = -1;
                    var max_hour = -1;

                    for(var i=0; i<=6; i++) {
                        for(var j=0; j<=23; j++){
                            if(freq[i][j] > max){
                                max = freq[i][j];
                                max_day = i;
                                max_hour = j;
                            }
                        }
                    }

                    var start = max_hour;
                    var end = max_hour + 1;
                    if(start == 23) end = "00";

                    if(max == -1 || max_day == -1 || max_hour == -1) return false;
                    return {
                        "name": "active",
                        "day": days[max_day],
                        "start": start,
                        "end": end
                    }
                }
            };
            if(!_.has(freq_funcs, func)) return false;

            // Auxillary method to pluck a timezone from a Date string
            var getTimezone = function(d){
                var date = new Date(d);
                var d = date.toString().match("^(\\w{3} \\w{3} \\d{1,2} \\d{4}) ((\\d{2}:){2}\\d{2}).*\\((.*)\\)$");
                return d[4];
            };

            var result;
            var freq;
            var init;

            if(nick && channel){
                var primary = dbot.api.users.resolveUser(server, nick, true).toLowerCase();
                var reqobj = {"server": server, "user": primary, "channel": channel};

                if(!_.has(userStats, primary)
                        || !_.has(userStats[primary], channel)
                        || !_.has(chanStats, channel)) return false;

                freq = userStats[primary][channel].freq.getRaw(reqobj);
                init = userStats[primary][channel].freq.time.init;
            }
            else if(nick){
                // Currently do not support server-wide statistics.
                return false;
            }
            else if(channel){
                var reqobj = {"server": server, "channel": channel};
                if(!_.has(chanStats, channel)) return false;

                freq = chanStats[channel].freq.getRaw(reqobj);
                init = chanStats[channel].freq.time.init;
            }
            else{ return false; }

            result = freq_funcs[func](freq);
            if(!result) return false;
            return {
                "field": result,
                "init": init,
                "tz": getTimezone(init.stamp)
            }
        },

        /**
         * Query the data store for a particular statistic pertaining to a
         * channel on a given server.
         */
        'getChanStats': function(server, channel, fields){
            if(!_.has(dbot.db.userStats, server) 
                    || !_.has(dbot.db.chanStats, server)) return false;

            var userStats = dbot.db.userStats[server];
            var chanStats = dbot.db.chanStats[server];
            var reqobj = {"server": server, "channel": channel};

            if(!_.has(chanStats, channel)) return false;

            var fieldResults = {};
            _.each(fields, function(field){
                field = field.toLowerCase();
                fieldResults[field] = {};
                if(_.has(chanStats[channel], field)){
                    fieldResults[field]["name"] = field;
                    fieldResults[field]["data"] = chanStats[channel][field].get(reqobj);
                    fieldResults[field]["raw"] = chanStats[channel][field].getRaw(reqobj);
                    fieldResults[field]["init"] = chanStats[channel][field].time.init;
                    fieldResults[field]["last"] =  chanStats[channel][field].time.last;
                }
            });

            var reply = {
                "fields": fieldResults,
            };
            return reply;
        },

        /**
         * Query the data store with a list of statistics pertaining to a
         * particular user on a given channel and server.
         */
        'getUserStats': function(server, nick, channel, fields){
            //TODO(samstudio8) If no fields, return all keys
            if(!server || !nick || !channel) return false;
            if(!_.has(dbot.db.userStats, server) 
                    || !_.has(dbot.db.chanStats, server)) return false;

            var userStats = dbot.db.userStats[server];
            var chanStats = dbot.db.chanStats[server];

            var primary = dbot.api.users.resolveUser(server, nick, true);
            primary = primary.toLowerCase();
            var reqobj = {"server": server, "user": primary, "channel": channel};

            if(!_.has(userStats, primary)
                    || !_.has(userStats[primary], channel)
                    || !_.has(chanStats, channel)) return false;

            var display = primary;
            if(primary != nick.toLowerCase()){
                display = nick.toLowerCase()+" ("+primary+")";
            }

            var fieldResults = {};
            _.each(fields, function(field){
                field = field.toLowerCase();
                fieldResults[field] = {};
                if(_.has(userStats[primary][channel], field)){
                    fieldResults[field]["name"] = field;
                    fieldResults[field]["data"] = userStats[primary][channel][field].get(reqobj);
                    fieldResults[field]["raw"] = userStats[primary][channel][field].getRaw(reqobj);
                    fieldResults[field]["init"] = userStats[primary][channel][field].time.init;
                    fieldResults[field]["last"] =  userStats[primary][channel][field].time.last;
                }
            });

            var reply = {
                "display": display,
                "primary": primary,
                "fields": fieldResults,
            };
            return reply;
        },

        'getChanUsersStats': function(server, channel, fields){
            //TODO(samstudio8) If no fields, return all keys
            if(!server || !channel) return false;
            if(!_.has(dbot.db.userStats, server) 
                    || !_.has(dbot.db.chanStats, server)) return false;

            var reply = {
                "users": {}
            };

            var users = dbot.api.stats.__getChanUsers(server, channel);
            _.each(users, function(user, userName){
                var userReply = dbot.api.stats.getUserStats(server, userName, channel, fields);
                if(userReply){
                    reply.users[userReply.primary] = userReply;
                    reply.users[userReply.primary].online = dbot.api.users.isOnline(
                                                        server,
                                                        userReply.primary,
                                                        channel,
                                                        true);
                    reply.users[userReply.primary].active = dbot.api.stats.isActive({
                                                        'server': server,
                                                        'user': userReply.primary,
                                                        'channel': channel});
                }
            });
            return reply;
        },
    };
};

exports.fetch = function(dbot){
    return api(dbot);
};
