var stats = function(dbot){
    var userStats = dbot.db.userStats;
    var chanStats = dbot.db.chanStats;

    //TODO(samstudio8) @reality is officially deprecating snippets.js,
    //cannot rely on filter or numberFormat
    var _ = require('underscore')._;
    var structure = require('./structures');

    this.listener = function(event){

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

        var user = dbot.api.users.resolveUser(event.server, event.user, true).toLowerCase();
        var num_words = event.message.split(" ").filter(function(w, i, array) { return w.length > 0; }).length

        // User-centric Stats
        if(!userStats[event.server].hasOwnProperty(user)){
            userStats[event.server][user] = {}
        }
        if(!userStats[event.server][user].hasOwnProperty(event.channel)){
            userStats[event.server][user][event.channel] = {}
            _.defaults(userStats[event.server][user][event.channel], structure.fieldFactoryOutlet("user", this.api));
        }
        userStats[event.server][user][event.channel]["freq"].add({"day": event.time.getDay(),
                                                                  "hour": event.time.getHours(),
                                                                  "inc": 1
        });
        userStats[event.server][user][event.channel]["lines"].add(1);
        userStats[event.server][user][event.channel]["words"].add(num_words);
        
        // Channel-centric Stats
        if(!chanStats[event.server].hasOwnProperty(event.channel)){
            chanStats[event.server][event.channel] = {}
            _.defaults(chanStats[event.server][event.channel], structure.fieldFactoryOutlet("chan", this.api));
        }
        chanStats[event.server][event.channel]["freq"].add({"day": event.time.getDay(),
                                                            "hour": event.time.getHours(),
                                                            "inc": 1
        });
        chanStats[event.server][event.channel]["lines"].add(1);
        chanStats[event.server][event.channel]["words"].add(num_words);

        // Check whether the line includes any mentions
        if(dbot.db.hasOwnProperty("knownUsers")){
            var cat = dbot.db.knownUsers[event.server].users.concat(
                    Object.keys(dbot.db.knownUsers[event.server].aliases));
            for (var i = 0; i < cat.length; i++){
                var name = cat[i];
                var mentioned = dbot.api.users.resolveUser(event.server, name, true).toLowerCase();
                if(user != mentioned
                        && userStats[event.server].hasOwnProperty(mentioned) 
                        && userStats[event.server][mentioned].hasOwnProperty(event.channel)){
                    var toMatch = "( |^)"+name.escape().toLowerCase()+":?(?=\\s|$)";
                    if(event.message.toLowerCase().search(toMatch) > -1){
                        userStats[event.server][user][event.channel]["out_mentions"].add({"mentioned": mentioned,
                                                                                          "inc": 1});
                        userStats[event.server][mentioned][event.channel]["in_mentions"].add(1);
                    }
                }
            }
        }
    }.bind(this);
    this.on = 'PRIVMSG';

    var getTimezone = function(d){
        var date = new Date(d);
        var d = date.toString().match("^(\\w{3} \\w{3} \\d{1,2} \\d{4}) ((\\d{2}:){2}\\d{2}).*\\((.*)\\)$");
        return d[4];
    };

    //TODO(samstudio8): There must be a less terrible way to resolve the weekday
    var days = {'1':"Monday", '2':"Tueday", '3':"Wednesday", '4':"Thursday", '5':"Friday", '6':"Saturday", '0':"Sunday"};

    this.onLoad = function(){
        var api = this.api;

        //TODO(samstudio8): Also delete no longer required fields
        _.each(userStats, function(server, serverName){
            _.each(userStats[serverName], function(user, userName){
                _.each(userStats[serverName][userName], function(chan, chanName){
                    var fieldFactoryUserProduct = structure.fieldFactoryOutlet("user", api);
                    _.defaults(userStats[serverName][userName][chanName], fieldFactoryUserProduct);
                    //TODO(samstudio8) Doom, it was going so well.
                    _.each(userStats[serverName][userName][chanName], function(field, fieldName){
                        _.defaults(field, fieldFactoryUserProduct[fieldName]);
                        field.toString = fieldFactoryUserProduct[fieldName].toString;
                        if(_.has(fieldFactoryUserProduct[fieldName], "time")){
                            _.defaults(field.time.init, fieldFactoryUserProduct[fieldName].time.init);
                            _.defaults(field.time.last, fieldFactoryUserProduct[fieldName].time.last);
                            field.time.init.toString = fieldFactoryUserProduct[fieldName].time.init.toString;
                            field.time.last.toString = fieldFactoryUserProduct[fieldName].time.last.toString;
                        }
                    });
                });
            });
        });

        _.each(chanStats, function(server, serverName){
            _.each(chanStats[serverName], function(chan, chanName){
                var fieldFactoryChanProduct = structure.fieldFactoryOutlet("chan", api);
                _.defaults(chanStats[serverName][chanName], fieldFactoryChanProduct);
                //TODO(samstudio8) Doom, not chan stats too!
                _.each(chanStats[serverName][chanName], function(field, fieldName){
                    _.defaults(chanStats[serverName][chanName][fieldName], fieldFactoryChanProduct[fieldName]);
                    chanStats[serverName][chanName][fieldName].toString = fieldFactoryChanProduct[fieldName].toString;
                    if(_.has(fieldFactoryChanProduct[fieldName], "time")){
                        _.defaults(chanStats[serverName][chanName][fieldName].time.init, fieldFactoryChanProduct[fieldName].time.init);
                        _.defaults(chanStats[serverName][chanName][fieldName].time.last, fieldFactoryChanProduct[fieldName].time.last);
                        field.time.init.toString = fieldFactoryChanProduct[fieldName].time.init.toString;
                        field.time.last.toString = fieldFactoryChanProduct[fieldName].time.last.toString;
                    }
                });
            });
        });
        dbot.save();

        // Add API Hooks
        dbot.api.command.addHook('~setaliasparent', this.api.fixStats);
        dbot.api.command.addHook('~mergeusers', this.api.fixStats);

    }.bind(this);
    
    this.onDestroy = function() {
        // Destroy structures cache so it can be reloaded with changes applied
        var cacheKey = require.resolve('./structures');                                                                                                                   
        delete require.cache[cacheKey];
    }.bind(this);
};

exports.fetch = function(dbot){
    return new stats(dbot);
};
