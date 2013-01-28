var _ = require('underscore')._;
var moment = require('moment');

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

    // If a field defines a format method, this will override the default
    // behaviour which returns data as a number with zero decimal places
    // and thousands separators
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
    // behaviour of incrementing the contents of the data attribute by the
    // parameter provided upon a call to add
    var __add;
    if(!toField.add){
        __add = function(inc){
            this.data += inc;
        };
    }
    else{
        __add = toField.add;
    }

    // If a field defines a getRaw method, this will override the default
    // behaviour of returning the data attribute directly
    var getRaw;
    if(!toField.getRaw){
        getRaw = function(getReq){
            return this.data;
        };
    }
    else{
        getRaw = toField.getRaw;
    }

    // If a field defines a get method, this will override the default
    // behaviour of returning the formatted data attribute
    var get;
    if(!toField.get){
        get = function(getreq){
            return this.format(this.getRaw(getreq));
        };
    }
    else{
        get = toField.get;
    }

    // If a field defines a merge method, this will override the default
    // behaviour of calling add on the data attribute
    var __merge;
    if(!toField.merge){
        __merge = function(mergeData){
            this.add(mergeData.data);
        }
    }
    else{
        __merge = toField.merge;
    }

    // If a field was manufactured before arriving at the factory, complete 
    // its data value and output it in the state in which it arrived.
    if(toField.prefab){
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
        "getRaw": getRaw,
        "get": get,
        "__add": __add,
        "add": function(input){
            this.__add(input);
            this.time.last.stamp = Date.now();
        },
        "merge": function(input){
            this.__merge(input);
            if(input.time.last.stamp > this.time.last.stamp){
                this.time.last.stamp = input.time.last.stamp;
            }
            if(input.time.init.stamp < this.time.init.stamp){
                this.time.init.stamp = input.time.init.stamp;
            }
        },
        "__merge": __merge,
        "time": {
            "init": {
                "stamp": Date.now(),
                "toString": function(){ 
                    return moment(this.stamp).format("ddd, Do MMMM YYYY");
                },
                "format": function(format){
                    if(!format){
                        var format = "ddd, Do MMMM YYYY";
                    }
                    return moment(this.stamp).format(format);
                },
                "ago": function(){
                    return moment(this.stamp).fromNow();
                }
            },
            "last": {
                "stamp": Date.now(),
                "toString": function(){ 
                    return new Date(this.stamp).toDateString(); 
                },
                "format": function(format){
                    if(!format){
                        var format = "ddd, Do MMMM YYYY";
                    }
                    return moment(this.stamp).format(format);
                },
                "ago": function(){
                    return moment(this.stamp).fromNow();
                }
            }
        }
    }
};

var fieldFactoryOutlet = function(request, api){
    // Detail the structure of userStats.server.user.channel dbKeys
    var user_structure = {
        "lines": {},
        "words": {},
        "lincent": {
            "format": function(data){
                return data.numberFormat(2)+"%";
            },
            "getRaw": function(getreq){
                if(!getreq) return -1;
                if(!getreq.server || !getreq.user || !getreq.channel) return -1;
                var user_lines = api.getUserStats(getreq.server, getreq.user, getreq.channel, ["lines"]);
                var chan_lines = api.getChanStats(getreq.server, getreq.channel, ["lines"]);
                if(!user_lines || !chan_lines) return -1;
                return (user_lines.fields.lines.raw / chan_lines.fields.lines.raw)*100;
            },
        },
        "wpl": {
            "format": function(data){
                return data.numberFormat(2)+" wpl";
            },
            "getRaw": function(getreq){
                if(!getreq) return -1;
                if(!getreq.server || !getreq.user || !getreq.channel) return -1;
                var user_words = api.getUserStats(getreq.server, getreq.user, getreq.channel, ["words"]);
                var user_lines = api.getUserStats(getreq.server, getreq.user, getreq.channel, ["lines"]);
                if(!user_words || !user_lines) return -1;
                return (user_words.fields.words.raw / user_lines.fields.lines.raw);
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
            "get": function(getreq){
                if(!_.has(getreq, "day") || !_.has(getreq, "hour")) return;
                if(addreq.day < 0 || addreq.day > 6 || addreq.hour < 0 || addreq.hour > 23) return;
                return this.format(this.data[getreq.day][getreq.hour]);
            },
            "add": function(addreq){
                if(!_.has(addreq, "day") || !_.has(addreq, "hour") || !_.has(addreq, "inc")) return;
                if(addreq.day < 0 || addreq.day > 6 || addreq.hour < 0 || addreq.hour > 23) return;
                this.data[addreq.day][addreq.hour] += addreq.inc;
            },
            "merge": function(merge){
                for(var i=0; i<=6; i++){
                    for(var j=0; j<=23; j++){
                        this.data[i][j] += merge.data[i][j];
                    }
                }
            }
        },
        "in_mentions": {},
        "out_mentions": {
            "def": function(){
                return {};   
            },
            "add": function(addreq){
                if(!_.has(addreq, "mentioned") || !_.has(addreq, "inc")) return;
                if(!_.has(this.data, addreq.mentioned)){
                    this.data[addreq.mentioned] = 0;
                }
                this.data[addreq.mentioned] += addreq.inc;
            },
            "getRaw": function(getreq){
                if(!getreq) return {};
                if(!_.has(getreq, "mentioned")) return -1
                if(!_.has(this.data, getreq.mentioned)) return 0;
                return this.data[getreq.mentioned];
            },
            "merge": function(merge){
                if(!merge) return;
                _.each(this.data, function(user, userName){
                    if(_.has(merge.data, userName)){
                        user += merge.data[userName];
                    }
                });
                _.defaults(this.data, merge.data);
            }
        },
        "init": {
            "prefab": true,
            "def": function(){
                return Date.now();
            },
            "toString": function(){ 
                return moment(this.data).format("ddd, Do MMMM YYYY");
            },
            "ago": function(){
                return moment(this.data).fromNow();
            },
            "merge": function(merge){
                if(merge.data < this.data){
                    this.data = merge.data;
                }
            }
        }
    };

    // Detail the structure of chanStats.server.channel dbKeys
    var chan_structure = {
        "lines": {},
        "words": {},
        "wpl": {
            "format": function(data){
                return data.numberFormat(2)+" wpl";
            },
            "getRaw": function(getreq){
                if(!getreq) return -1;
                if(!getreq.server || !getreq.channel) return -1;
                var chan_words = api.getChanStats(getreq.server, getreq.channel, ["words"]);
                var chan_lines = api.getChanStats(getreq.server, getreq.channel, ["lines"]);
                if(!chan_words || !chan_lines) return -1;
                return (chan_words.fields.words.raw / chan_lines.fields.lines.raw);
            },
            "get": function(getreq){
                if(!getreq) return;
                return this.format(this.getRaw(getreq));
            },
        },
        "week": {
            "def": function(){ 
                var freq = {};

                var modAns;
                for(var i=0; i<=6; i++){
                    freq[i] = {};
                    for(var j=0; j<=23; j++){
                        freq[i][j] = 0;
                    }
                    
                    // Attempt to initialise each day of the 7-day rolling data
                    // object with a name property that defines the day of the 
                    // week and day of the month, starting backwards from today.
                    // Element 0 will hold "today".
                    if(i == 0){
                        modAns = 0;
                    }
                    else{
                        modAns = (i % 7)-7;
                    }
                    freq[i]["name"] = moment(Date.now()).add("days", modAns).format("dddd Do");
                }
                freq["ptr"] = 0;
                return freq;
            },
            "get": function(getreq){
                if(!_.has(getreq, "day") || !_.has(getreq, "hour")) return;
                if(addreq.day < 0 || addreq.day > 6 || addreq.hour < 0 || addreq.hour > 23) return;
                return this.format(this.data[getreq.day][getreq.hour]);
            },
            "add": function(addreq){
                if(!_.has(addreq, "day") || !_.has(addreq, "hour") || !_.has(addreq, "inc")) return;
                if(addreq.day < 0 || addreq.day > 6 || addreq.hour < 0 || addreq.hour > 23) return;
                this.data[addreq.day][addreq.hour] += addreq.inc;
            },
            "merge": function(merge){
                //TODO(samstudio8) In theory merge handling for week.ptr and 
                // week.day.name should not be necessary.
                for(var i=0; i<=6; i++){
                    for(var j=0; j<=23; j++){
                        this.data[i][j] += merge.data[i][j];
                    }
                }
            }
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
            "get": function(getreq){
                if(!_.has(getreq, "day") || !_.has(getreq, "hour")) return;
                if(addreq.day < 0 || addreq.day > 6 || addreq.hour < 0 || addreq.hour > 23) return;
                return this.format(this.data[getreq.day][getreq.hour]);
            },
            "add": function(addreq){
                if(!_.has(addreq, "day") || !_.has(addreq, "hour") || !_.has(addreq, "inc")) return;
                if(addreq.day < 0 || addreq.day > 6 || addreq.hour < 0 || addreq.hour > 23) return;
                this.data[addreq.day][addreq.hour] += addreq.inc;
            },
            "merge": function(merge){
                for(var i=0; i<=6; i++){
                    for(var j=0; j<=23; j++){
                        this.data[i][j] += merge.data[i][j];
                    }
                }
            }
        },
        "init": {
            "prefab": true,
            "def": function(){
                return Date.now();
            },
            "toString": function(){ 
                return moment(this.data).format("ddd, Do MMMM YYYY");
            },
            "ago": function(){
                return moment(this.data).fromNow();
            },
            "merge": function(merge){
                if(merge.data < this.data){
                    this.data = merge.data;
                }
            }
        }
    };
    var fieldFactoryProduct = {};
    if(request == "user"){
        _.each(user_structure, function(value, key, obj){
            fieldFactoryProduct[key] = fieldFactory(key, value);
        });
    }
    else if(request == "chan"){
        _.each(chan_structure, function(value, key, obj){
            fieldFactoryProduct[key] = fieldFactory(key, value);
        });

    }
    else{ return {}; }
    return fieldFactoryProduct;
};

exports.fieldFactoryOutlet = function(request, api){
    return fieldFactoryOutlet(request, api); 
}
