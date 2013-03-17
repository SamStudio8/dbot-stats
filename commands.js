var _ = require('underscore')._;

var commands = function(dbot){
    return {
        '~lines': function(event){
            if(event.params[1]){
                var result = this.api.getUserStats(event.server, event.params[1], event.channel, ["lines"]);
                if(result){
                    event.reply(dbot.t("user_lines", {
                        "user": result.primary,
                        "chan": result.request.channel,
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
                var result = this.api.getChanStats(event.server, event.channel, ["lines"]);
                if(result){
                    event.reply(dbot.t("chan_lines", {
                        "chan": result.request.channel,
                        "lines": result.fields.lines.data,
                        "start": result.fields.lines.init
                    }));
                }
            }
        },

        '~words': function(event){
            if(event.params[1]){
                var result = this.api.getUserStats(event.server, event.params[1], event.channel, ["words", "wpl"]);
                if(result){
                    event.reply(dbot.t("user_words", {
                        "user": result.primary,
                        "chan": result.request.channel,
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
                var result = this.api.getChanStats(event.server, event.channel, ["words", "wpl"]);
                if(result){
                    event.reply(dbot.t("chan_words", {
                        "chan": result.request.channel,
                        "words": result.fields.words.data,
                        "avg": result.fields.wpl.data,
                        "start": result.fields.words.init
                    }));
                }
            }
        },

        '~lincent': function(event){
            if(event.params[1]){
                var result = this.api.getUserStats(event.server, event.params[1], event.channel, ["lincent", "lines"]);
                if(result){
                    event.reply(dbot.t("lines_percent", {
                        "user": result.primary,
                        "chan": result.request.channel,
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

        '~active': function(event){
            if(event.params[1]){
                var result = this.api.frequencher(event.server, event.params[1], event.channel, "active");
                if(result){
                    event.reply(dbot.t("hours_active", {
                        "name": result.request.user.toLowerCase(),
                        "day": result.field.day,
                        "start_hour": result.field.start,
                        "end_hour": result.field.end,
                        "start": result.init,
                        "tz": result.tz
                    }));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": event.params[1].toLowerCase()
                    }));
                }
            }
            else{
                var result = this.api.frequencher(event.server, null, event.channel, "active");
                if(result){
                    event.reply(dbot.t("hours_active", {
                        "name": result.request.channel,
                        "day": result.field.day,
                        "start_hour": result.field.start,
                        "end_hour": result.field.end,
                        "start": result.init,
                        "tz": result.tz
                    }));
                }
            }
        },

        '~loudest': function(event){
            if(!event.params[1]){
                var result = this.api.leaderboarder(event.server, null, event.channel, "loudest", 5, false);
                if(result){
                    event.reply(dbot.t("loudest", {
                        "chan": result.request.channel,
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
                        "chan": result.request.channel,
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

        '~wordiest': function(event){
            if(!event.params[1]){
                var result = this.api.leaderboarder(event.server, null, event.channel, "wordiest", 5, false);
                if(result){
                    event.reply(dbot.t("wordiest", {
                        "chan": result.request.channel,
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
                        "chan": result.request.channel,
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
                            "user": result.request.user.toLowerCase(),
                            "chan": result.request.channel,
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
                            "user": result.request.user.toLowerCase(),
                            "chan": result.request.channel,
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
                var result = this.api.getUserStats(event.server, event.params[1], event.channel, ["lines"]);
                if(result){
                    event.reply(dbot.t("user_last", {
                        "user": result.primary,
                        "chan": result.request.channel,
                        "last": result.fields.lines.last.ago()
                    }));
                }
                else{
                    event.reply(dbot.t("no_data", {
                        "user": event.params[1].toLowerCase()
                    }));
                }
            }
            else{
                var result = this.api.getChanStats(event.server, event.channel, ["lines"]);
                if(result){
                    event.reply(dbot.t("chan_last", {
                        "chan": result.request.channel,
                        "last": result.fields.lines.last.ago()
                    }));
                }
            }
        }
    };
};

exports.fetch = function(dbot){
    return commands(dbot);
};
