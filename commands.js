var _ = require('underscore')._;

var commands = function(dbot){
    return {
        '~lines': function(event){
            if(event.params[1]){
                var result = this.api.getUserStat(event.server, event.params[1], event.channel, ["lines"]);
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
                var result = this.api.getChanStat(event.server, event.channel, ["lines"]);
                if(result){
                    event.reply(dbot.t("chan_lines", {
                        "chan": event.channel,
                        "lines": result.fields.lines.data,
                        "start": result.fields.lines.init
                    }));
                }
            }
        },

        '~words': function(event){
            if(event.params[1]){
                var result = this.api.getUserStat(event.server, event.params[1], event.channel, ["words", "wpl"]);
                if(result){
                    event.reply(dbot.t("user_words", {
                        "user": result.primary,
                        "chan": event.channel,
                        "words": result.fields.words.data,
                        "avg": result.fields.wpl.data,
                        "start": result.fields.words.init
                    }));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": event.params[1].toLowerCase()
                    }));
                }
            }
            else{
                var result = this.api.getChanStat(event.server, event.channel, ["words", "wpl"]);
                if(result){
                    event.reply(dbot.t("chan_words", {
                        "chan": event.channel,
                        "words": result.fields.words.data,
                        "avg": result.fields.wpl.data,
                        "start": result.fields.words.init
                    }));
                }
            }
        },

        '~lincent': function(event){
            if(event.params[1]){
                var result = this.api.getUserStat(event.server, event.params[1], event.channel, ["lincent", "lines"]);
                if(result){
                    event.reply(dbot.t("lines_percent", {
                        "user": result.primary,
                        "chan": event.channel,
                        "percent": result.fields.lincent.data,
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
                event.message = '~lincent ' + dbot.api.users.resolveUser(event.server, event.user, true);
                event.action = 'PRIVMSG';
                event.params = event.message.split(' ');
                dbot.instance.emit(event);
            }
        },

          //TODO(samstudio8) Sat 13 Jan
          // Removed access to ~active until I can decide how the API will support
          // calls to it as we head toward to end of Issue #43
 //       '~active': function(event){
 //           if(!userStats.hasOwnProperty(event.server)) return;
 //
 //           if(event.params[1]){
 //               var input = dbot.api.users.resolveUser(event.server, event.params[1], true);
 //               if(userStats[event.server].hasOwnProperty(input) && userStats[event.server][input].hasOwnProperty(event.channel)){
 //                   var max = -1;
 //                   var max_day = -1;
 //                   var max_hour = -1;
 //                   for(var i=0; i<=6; i++) {
 //                       for(var j=0; j<=23; j++){
 //                           if(userStats[event.server][input][event.channel]["freq"][i][j] > max){
 //                               max = userStats[event.server][input][event.channel]["freq"][i][j];
 //                               max_day = i;
 //                               max_hour = j;
 //                           }
 //                       }
 //                   }
 //                   var start = max_hour;
 //                   var end = max_hour + 1;
 //                   if(start == 23){
 //                       end = "00";
 //                   }
 //
 //                   if(max > 0){
 //                       event.reply(dbot.t("hours_active", {
 //                           "name": input,
 //                           "day": days[max_day],
 //                           "start_hour": start,
 //                           "end_hour": end,
 //                           "start": formatDate(userStats[event.server][input][event.channel]["startstamp"]),
 //                           "tz": getTimezone(userStats[event.server][input][event.channel]["startstamp"])}
 //                       ));
 //                   }
 //               }
 //               else{
 //                   event.reply(dbot.t("no_data", {
 //                       "user": input}
 //                   ));
 //               }
 //           }
 //           else{
 //               if(!chanStats.hasOwnProperty(event.server) || !chanStats[event.server].hasOwnProperty(event.channel)) return;
 //               var max = -1;
 //               var max_day = -1;
 //               var max_hour = -1;
 //               for(var i=0; i<=6; i++) {
 //                   for(var j=0; j<=23; j++){
 //                       if(chanStats[event.server][event.channel]["freq"][i][j] > max){
 //                           max = chanStats[event.server][event.channel]["freq"][i][j];
 //                           max_day = i;
 //                           max_hour = j;
 //                       }
 //                   }
 //               }
 //               var start = max_hour;
 //               var end = max_hour + 1;
 //               if(start == 23){
 //                   end = "00";
 //               }
 //
 //               if(max > 0){
 //                   event.reply(dbot.t("hours_active", {
 //                       "name": event.channel,
 //                       "day": days[max_day],
 //                       "start_hour": start,
 //                       "end_hour": end,
 //                       "start": formatDate(chanStats[event.server][event.channel]["startstamp"]),
 //                       "tz": getTimezone(chanStats[event.server][event.channel]["startstamp"])}
 //                   ));
 //               }
 //           }
 //       },

        '~loudest': function(event){
            if(!event.params[1]){
                var result = this.api.leaderboarder(event.server, null, event.channel, "loudest", 5, false);
                if(result){
                    event.reply(dbot.t("loudest", {
                        "chan": event.channel,
                        "start": result.init,
                        "list": result.leaderboard
                    }));
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
            if(!event.params[1]){
                var result = this.api.leaderboarder(event.server, null, event.channel, "verbose", 5, false);
                if(result){
                    event.reply(dbot.t("verbose", {
                        "chan": event.channel,
                        "start": result.init,
                        "list": result.leaderboard
                    }));
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
            if(!event.params[1]){
                var result = this.api.leaderboarder(event.server, null, event.channel, "popular", 5, false);
                if(result){
                    event.reply(dbot.t("popular", {
                        "chan": event.channel,
                        "start": result.init,
                        "list": result.leaderboard
                    }));
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
            if(event.params[1]){
                var result = this.api.leaderboarder(event.server, event.params[1], event.channel, "in_mentions", 5, false);
                if(result){
                    if(result.places > 0){
                        event.reply(dbot.t("in_mentions", {
                            "user": event.params[1],
                            "chan": event.channel,
                            "start": result.init,
                            "list": result.leaderboard
                        }));
                    }
                    else{
                        event.reply(dbot.t("no_in_mentions", {
                            "user": event.params[1].toLowerCase()
                        }));
                    }
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": event.params[1].toLowerCase()
                    }));
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
            if(event.params[1]){
                var result = this.api.leaderboarder(event.server, event.params[1], event.channel, "out_mentions", 5, false);
                if(result){
                    if(result.places > 0){
                        event.reply(dbot.t("out_mentions", {
                            "user": event.params[1],
                            "chan": event.channel,
                            "start": result.init,
                            "list": result.leaderboard
                        }));
                    }
                    else{
                        event.reply(dbot.t("no_out_mentions", {
                            "user": event.params[1].toLowerCase()
                        }));
                    }
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": event.params[1].toLowerCase()
                    }));
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
            if(event.params[1]){
                var result = this.api.getUserStat(event.server, event.params[1], event.channel, ["lines"]);
                if(result){
                    event.reply(dbot.t("user_last", {
                        "user": result.primary,
                        "chan": event.channel,
                        "last": result.fields.lines.last.full()
                    }));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": event.params[1].toLowerCase()
                    }));
                }
            }
            else{
                var result = this.api.getChanStat(event.server, event.channel, ["lines"]);
                if(result){
                    event.reply(dbot.t("chan_last", {
                        "chan": event.channel,
                        "last": result.fields.lines.last.full()
                    }));
                }
            }
        }
    };
};

exports.fetch = function(dbot){
    return commands(dbot);
};
