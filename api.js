var _ = require('underscore')._;

var api = function(dbot) {
    return {

        /**
         * Given a server and alias, resolve the alias to the user's primary
         * nick and transfer statistics dbKeys pertaining to the alias to the
         * new primary name.
         */
        'fixStats': function(server, alias){
            if(!_.has(dbot.db.userStats, server)
                    || !_.has(dbot.db.chanStats, server)) return;

            var userStats = dbot.db.userStats[server];
            var chanStats = dbot.db.chanStats[server];

            if(_.has(userStats, name)){
                var primary = dbot.api.users.resolveUser(server, alias, true);
                alias = alias.trim().toLowerCase;

                // Rename userStats key
                userStats[primary] = userStats[alias];
                delete userStats[alias];

                // Rename keys in all out_mentions on this server
                _.each(userStats, function(user, userName){
                    _.each(userStats[userName], function(chan, chanName){
                        if(_.has(userStats[curr_user][curr_channel]["out_mentions"], alias)){
                            //TODO(samstudio8) Can I do chan["out_mentions"][primary] here?
                            userStats[curr_user][curr_channel]["out_mentions"][primary] = userStats[curr_user][curr_channel]["out_mentions"][alias];
                            delete userStats[curr_user][curr_channel]["out_mentions"][alias];
                        }
                    });
                });
                dbot.save();
            }
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

                if(request.user && request.channel){
                    var primary = dbot.api.users.resolveUser(request.server, request.user, true);
                    if(_.has(userStats[request.server], primary)
                            && _.has(userStats[request.server][primary], request.channel)){
                        //TODO(samstudio8) Use the API
                        return dateActive(userStats[request.server][primary][request.channel].lines.last.stamp, inLast);
                    }
                }
                else if(request.user){
                    var primary = dbot.api.users.resolveUser(request.server, request.user, true);
                    if(!_.has(!userStats[request.server], primary)) return false;
                    _.each(userStats[request.server][primary], function(chan, chanName){
                        if(dateActive(userStats[request.server][primary][curr_chan].lines.last.stamp, inLast)) return true;
                    });
                }
                else if(request.channel){
                    if(!_.has(chanStats[request.server], request.channel)) return false;
                    return dateActive(chanStats[request.server][request.channel].lines.last.stamp, inLast);
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
        'getChannelUserStats': function(server, channel){
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
            
            if(!server || !field) return null;
            if(!_.has(dbot.db.userStats, server) 
                    || !_.has(dbot.db.chanStats, server)) return null;

            var userStats = dbot.db.userStats[server];
            var chanStats = dbot.db.chanStats[server];

            // Resolve leaderboading methods to the user field that should be 
            // first be sorted to construct a leaderboard.
            var user_leaderboards = {
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
                    "match": true
                }
            };
            
            if(user && channel){
                var primary = dbot.api.users.resolveUser(server, user, true);
                if(!_.has(chanStats, channel)
                        || !_.has(userStats, primary)
                        || !_.has(userStats[primary], channel)) return null;
                
                var reqobj = {"server": server, "user": primary, "channel": channel};

                var sorted;
                if(user_chan_boards[field].search == true){
                    if(user_chan_boards[field].match == true){
                        //TODO(samstudio8) Update to underscore.js when you are
                        //less angry at it...
                        sorted = Object.prototype.sort(dbot.api.stats.getChannelUserStats(server, channel), function(key, obj) {
                                return obj[key][user_chan_boards[field].field].get({"mentioned": primary});
                            }
                        );
                    }
                    else{
                        // Currently no commands require this functionality
                        return null;
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
                return null;
            }
            else if(channel){
                if(!_.has(chanStats, channel)) return null;
                var users = dbot.api.stats.getChannelUserStats(server, channel);
                var sorted = _.chain(users)
                    .pairs()
                    .sortBy(function(item) { 
                        var reqobj = {"server": server, "user": item[0], "channel": channel};
                        return item[1][user_leaderboards[field]].get(reqobj);
                    })
                    .reverse()
                    .first(places)
                    .value();

                var leaderboard_str = "";
                _.each(sorted, function(item){
                    var reqobj = {"server": server, "user": item[0], "channel": channel};
                    leaderboard_str += item[0] + " (" + item[1][user_leaderboards[field]].get(reqobj) + "), ";
                });
                leaderboard_str = leaderboard_str.slice(0, -2);

                //Euch
                var init = chanStats[channel].init;
            }
            else{ return null; }

            return {
                "leaderboard": leaderboard_str,
                "places": sorted.length,
                "init": init,
            };
        },

        /**
         * Query the data store for a particular statistic pertaining to a
         * channel on a given server.
         */
        'getChanStat': function(server, channel, fields){
            if(!_.has(dbot.db.userStats, server) 
                    || !_.has(dbot.db.chanStats, server)) return null;

            var userStats = dbot.db.userStats[server];
            var chanStats = dbot.db.chanStats[server];
            var reqobj = {"server": server, "channel": channel};

            if(!_.has(chanStats, channel)) return null;

            var fieldResults = {};
            _.each(fields, function(field){
                field = field.toLowerCase();
                fieldResults[field] = {};
                if(_.has(chanStats[channel], field)){
                    fieldResults[field]["name"] = field;
                    fieldResults[field]["data"] = chanStats[channel][field].get(reqobj);
                    fieldResults[field]["raw"] = chanStats[channel][field].data;
                    fieldResults[field]["init"] = chanStats[channel][field].time.init;
                    fieldResults[field]["last"] =  chanStats[channel][field].time.last;
                }
                else{
                    fieldResults[field]["code"] = -1;
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
        'getUserStat': function(server, nick, channel, fields){
            if(!server || !nick || !channel || !fields) return null;
            if(!_.has(dbot.db.userStats, server) 
                    || !_.has(dbot.db.chanStats, server)) return null;

            var userStats = dbot.db.userStats[server];
            var chanStats = dbot.db.chanStats[server];

            var primary = dbot.api.users.resolveUser(server, nick, true);
            var reqobj = {"server": server, "user": primary, "channel": channel};

            if(!_.has(userStats, primary)
                    || !_.has(userStats[primary], channel)
                    || !_.has(chanStats, channel)) return null;

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
                    fieldResults[field]["raw"] = userStats[primary][channel][field].data;
                    fieldResults[field]["init"] = userStats[primary][channel][field].time.init;
                    fieldResults[field]["last"] =  userStats[primary][channel][field].time.last;
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

        /**
         * //TODO(samstudio8): DEPRECATED @ v0.2
         * This API function will no longer be supported at stats/v0.2, the
         * web interface is to be updated accordingly to accept the new API
         * reply results object.
         *
         * Legacy API function allowing the users module to query for various
         * user statistics in a particular format for the web interface.
         */
        'getUserStats': function(server, nick, channel, fields){
            //TODO(samstudio8)
            //The input for this function should be an object, this will also make
            //handling calls to any required internalAPI functions below tidier
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
};

exports.fetch = function(dbot){
    return api(dbot);
};
