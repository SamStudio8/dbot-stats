#dbot-stats
A statistics module for <a href="https://github.com/reality/depressionbot">depressionbot</a>.

##Requirements
###DepressionBot Core
Besides command, stats requires the following modules from depressionbot core to be enabled:
* <a href="https://github.com/reality/depressionbot/tree/master/modules/users">users</a>
* <a href="https://github.com/reality/depressionbot/tree/master/modules/event">event</a>
* <a href="https://github.com/reality/depressionbot/tree/master/modules/timers">timers</a>

###moment.js
<a href="http://momentjs.com/">http://momentjs.com</a>
```
npm install moment
```
To format stats timestamps with moment, see <a href="http://momentjs.com/docs/#/displaying/format/">Display Format</a>.

##Commands
###~lines [user]
Report the number of messages a particular user has spoken in the current channel.<br />
Without the user parameter, the bot will reply with the total number of lines spoken in the channel.

###~words [user]
Report the number of words a particular user has spoken in the current channel.
Note there is no fancy check on the validity or weight of particular words (for example "hello 123!" would count as two words).
It should be noted however that messages are filtered for "words" of length larger than zero to prevent abuse.
Without the user parameter, the bot will reply with the total number of words spoken in the current channel.

###~lincent [user]
Report the percentage of the current channel's total lines a particular user is responsible for.<br />
Without the user parameter, the bot will reply using your own nick as the user parameter.

###~active [user] 
Report the day and hour interval for which the user is most active in the current channel.<br />
Without the user parameter, the bot will reply with the current channel's most active interval.

###~loudest [user]
The bot will reply with a leaderboard of the top five users who have spoken the most lines in the current channel.<br />
Providing the optional user parameter will emit a call to ```~lincent [user]```.

###~verbose [user]
Orders all users in the current channel by their average words per line metric and reply with a leaderboard of the top five scorers.
Providing the optional user parameter will emit a call to ```~words [user]```.

###~inmentions [user]
Orders all users in the current channel by the number of times they have been mentioned ```user``` and reply with a leaderboard of the top five mentioners.
Without the user parameter, the bot will reply using your own nick as the user parameter.

###~outmentions [user]
Orders all users in the current channel by the number of times they have been mentioned by ```user``` and reply with a leaderboard of the top five most mentioned.
Without the user parameter, the bot will reply using your own nick as the user parameter.

###~popular [user]
Orders all users in the current channel by the number of times they have been mentioned and reply with a leaderboard of the top five most talked about users.
Providing the optional user parameter will emit a call to ```~inmentions [user]```.

###~last [user]
Display the timestamp of the last recorded message from a particular user.<br />
Without the optional user parameter the bot will display the timestamp of the last recorded message in the current channel.

##API
###getUserStats(\<server\>, \<user\>, \<channel\>, \<field(s)\>)
Query the API for stats ```fields``` pertaining to a user on a particular channel on a server.<br />
A successful reply will follow the following format;
```
{
  "display":    Either the alias and primary nick in the form 'alias (primary)' or if the name
                is not an alias, simply the primary nick itself.
  "primary":    The primary nick of the profile.
  "fields":     An object containing a response for each valid field of the request.
  {
    "<field>":  The name of the field requested is used as the key for each field response object.
    {
      "name":   The name of the field requested.
      "data":   Formatted data, the result of this.format(this.data) on the data field in question.
                For example, for wpl this result would be formatted to 2dp and appended with ' wpl'.
      "raw":    Raw data, the value of the data field before it was formatted.
                For example, for lines, this would be missing thousands separators.
                Required if you wish to use the result for further numerical calculation.
      "init":   The timestamp object for when the first record of this statistic was recorded.
                Typically you will want to use init (which calls toString) or init.format(<format>).
      "last":   The timestamp object for when this statistic was last updated by the listener.
                Typically you will want to use init (which calls toString) or init.format(<format>).
    }
  }
  "request":    An object containing some of the request parameters.
  {
    "server":   The server from the request.
    "user":     The username from the request (not lowercased or resolved).
    "channel":  The channel from the request.
  }
}
```
It is important to note that ```primary``` will be returned in lowercase due to the way in which stats handles usernames.
Also worth noting is that requested fields which do not match to a property of the user will not be in the fields sub-object.
Note that you should also validate the reply itself. If ```server```, ```channel``` or ```user``` pertain to invalid keys, the reply will be ```false```.

###getChanStats(\<server\>, \<channel\>, \<field(s)\>)
Query the API for stats ```fields```  pertaining to a particular channel on a server.<br />
A successful reply will follow the following format;

```
{
  "fields":     An object containing a response for each valid field of the request.
  {
    "<field>":  The name of the field requested is used as the key for each field response object.
    {
      "name":   The name of the field requested.
      "data":   Formatted data, the result of this.format(this.data) on the data field in question.
                For example, for wpl this result would be formatted to 2dp and appended with ' wpl'.
      "raw":    Raw data, the value of the data field before it was formatted.
                For example, for lines, this would be missing thousands separators.
                Required if you wish to use the result for further numerical calculation.
      "init":   The timestamp object for when the first record of this statistic was recorded.
                Typically you will want to use init (which calls toString) or init.format(<format>).
      "last":   The timestamp object for when this statistic was last updated by the listener.
                Typically you will want to use init (which calls toString) or init.format(<format>).
    }
  }
  "request":    An object containing some of the request parameters.
  {
    "server":   The server from the request.
    "channel":  The channel from the request.
  }
}
```
Note you should validate the reply itself. If ```server``` or ```channel``` pertain to invalid keys, the reply will be ```false```.
Also worth noting is that requested fields which do not match to a property of the channel will not be in the fields sub-object.

###getUserChansStats(\<server\>, \<user\>, \<field(s)\>)
Calls ```getUserStats``` with a given ```user``` on the ```server```, for each of the channels ```user``` has been recorded in.<br />
This function is typically used for the web interface when displaying a list of channels a user is associated with.
A successful reply will follow the following format;
```
{
  "channels":       An object containing a response for each channel with data for the selected user.
  {
    "<channel>":    The name of the channel.
    {
      "display":    Either the alias and primary nick in the form 'alias (primary)' or if the name
                    is not an alias, simply the primary nick itself.
      "primary":    The primary nick of the profile.
      "online":     A boolean to indicate whether the user is currently in the channel.
      "active":     A boolean to indicate whether this user has been active in the channel.
      "fields":     An object containing a response for each valid field of the request.
      {
        "<field>":  The name of the field requested is used as the key for each field response object.
        {
          "name":   The name of the field requested.
          "data":   Formatted data, the result of this.format(this.data) on the data field in question.
                    For example, for wpl this result would be formatted to 2dp and appended with ' wpl'.
          "raw":    Raw data, the value of the data field before it was formatted.
                    For example, for lines, this would be missing thousands separators.
                    Required if you wish to use the result for further numerical calculation.
          "init":   The timestamp object for when the first record of this statistic was recorded.
                    Typically you will want to use init (which calls toString) or init.format(<format>).
          "last":   The timestamp object for when this statistic was last updated by the listener.
                    Typically you will want to use init (which calls toString) or init.format(<format>).
        }
      }
    }
  }
  "request":        An object containing some of the request parameters.
  {
    "server":       The server from the request.
    "user":         The username from the request (not lowercased or resolved).
  }
}
```
Note to validate the reply itself. If ```server``` or ```user``` pertain to invalid keys, the reply will be ```false```.
Also worth noting is that requested fields which do not match to a property of the user will not be in the fields sub-object.

###getChanUsersStats(\<server\>, \<channel\>, \<field(s)\>)
Calls ```getUserStats``` for each user on the ```server``` with a key for the specified ```channel```.<br />
These users are discovered with a call to ```__getChanUsers```.
This function is typically used for the web interface when displaying lists of users in a channel with associated stats data.
A successful reply will follow the following format;
```
{
  "users":          An object containing a response for each user with data for the selected channel.
  {
    "<user>":       The primary name of the user for which the object pertains to.
    {
      "display":    Either the alias and primary nick in the form 'alias (primary)' or if the name
                    is not an alias, simply the primary nick itself.
      "primary":    The primary nick of the profile.
      "online":     A boolean to indicate whether the user is currently in the channel.
      "active":     A boolean to indicate whether this user has been active in the channel.
      "fields":     An object containing a response for each valid field of the request.
      {
        "<field>":  The name of the field requested is used as the key for each field response object.
        {
          "name":   The name of the field requested.
          "data":   Formatted data, the result of this.format(this.data) on the data field in question.
                    For example, for wpl this result would be formatted to 2dp and appended with ' wpl'.
          "raw":    Raw data, the value of the data field before it was formatted.
                    For example, for lines, this would be missing thousands separators.
                    Required if you wish to use the result for further numerical calculation.
          "init":   The timestamp object for when the first record of this statistic was recorded.
                    Typically you will want to use init (which calls toString) or init.format(<format>).
          "last":   The timestamp object for when this statistic was last updated by the listener.
                    Typically you will want to use init (which calls toString) or init.format(<format>).
        }
      }
    }
  }
  "request":        An object containing some of the request parameters.
  {
    "server":       The server from the request.
    "channel":      The channel from the request.
  }
}
```
Note to validate the reply itself. If ```server``` or ```channel``` pertain to invalid keys, the reply will be ```false```.
Also worth noting is that requested fields which do not match to a property of the user will not be in the fields sub-object.

###leaderboarder(\<server\>,  \<user\> | null, \<channel\>, \<field\>, \<places\>, \<reverse\>)
Search and sort through the data structure for the purpose of building a "leaderboard" string detailing the top or bottom scorers for a given statistic.
The type of leaderboard is chosen via the the combination of ```user``` and ```channel``` parameters and the actual statistic to sort is selected by ```field```.
<br />Currently the leaderboarder supports the following leaderboards (each sorts descending unless otherwise specified with ```reverse```);

* Channel leaderboards (Channel parameter only, user parameter ```null```)
    * loudest: Order users by % of total channel lines
    * verbose: Order users by average words per line
    * popular: Order users by number of in mentions
* Channel-User leaderboards (Channel and user parameter both provided)
    * in_mentions: Order top mentioners of ```user```
    * out_mentions: Order channel users most mentioned by ```user``` 

Unsurprisingly ```places``` defines the number of positions to show on the leaderboard.
A successful leaderboarder reply returns the format;

```
{
  "leaderboard":  The leaderboard as a string, of the form;
                  "user1 (value1), user2 (value2), ..., usern (valuen)"
  "places":       The number of positions in the return leaderboard, this can sometimes be less than the 
                  places parameter due to insufficient data. You should ensure this is larger than
                  zero when validating the reply.
  "init":         The timestamp object for when the first record of this statistic was recorded.
                  Typically you will want to use init (which calls toString) or init.format(<format>).
  "request":      An object containing some of the request parameters.
  {
    "server":     The server from the request.
    "user":       The username from the request (not lowercased or resolved).
    "channel":    The channel from the request.
  }
}
```
Note that you should also validate the reply itself. If ```server```, ```channel``` or ```user``` pertain to invalid keys, the reply will be ```false```.

###frequencher(\<server\>, \<user\> | null, \<channel\>, \<field\>)
Perform an analysis on the frequency array for a particular user in a channel, or a channel itself.
Currently the frequencher supports the following options to analyze frequency array objects;

* Channel frequenching (Channel parameter only, user parameter ```null```)[C]
    * active: Identify the channel's busiest day-hour interval
* Channel-user frequenching (Channel and user parameters both defined)[CU]
    * active: Identify the busiest day-hour interval for a particular user in a given channel

A successful reply will be of the form;
```
{
  "field":      Container for data returned from the particular function applied to the array.
                Note that field.name is the only property (as below) that can be expected as each
                frequency analysis function will return different properties.
                Be aware that on this occasion "field" does not refer to the name of the
                chosen function or any other type of reference, it is merely the string 'field'.
  {
    "name":     The name of the function that was applied, usually equals the requested field.

    "day":      [active(C/CU)] Day of the week for which the array is most active.
                Note this is the actual name of the day, ie. "Sunday", not 0.
    "start":    [active(C/CU)] The start of the most active hour interval on that day.
                Formatted on a 24 hour clock, midnight is "00".
    "end":      [active(C/CU)] The end of the most active hour interval.
                Always start+1 except when start==23 at which point this is "00".

  }
  "init":       The timestamp object for when the first record of this statistic was recorded.
                Typically you will want to use init (which calls toString) or init.format(<format>).
  "tz":         Timezone of timestamp to provide context to data that involves hours.
  "request":    An object containing some of the request parameters.
  {
    "server":   The server from the request.
    "user":     The username from the request (not lowercased or resolved).
    "channel":  The channel from the request.
  }
}
```
You should validate the reply itself. If ```server```, ```channel``` or ```user``` pertain to invalid keys, the reply will be ```false```.
If the API fails to apply the chosen field to the frequency array, the reply will be ```false```.

###isActive({\<server\>, \<user\> | \<channel\> | \<user\> \<channel\>, [inLast=10]})
Query whether a [user in any channel | channel itself | user in a specific channel] was recorded in inLast minutes. inLast defaults to ten minutes. Note the parameters are to be delivered within an object.
A successful reply will be of the form;
```
{
  "active":   Boolean to indicate whether the user, channel or user-in-channel has recorded 
              activity within inLast minutes.
  "msdiff":   The number of milliseconds between the last recorded message and the time of 
              the API request.
  "ago":      A humanized "time ago" string; eg: "10 minutes ago"
}
```
You should validate the reply itself. If ```server```, ```channel``` or ```user``` pertain to invalid keys, the reply will be ```false```.

###renameStats(\<server\>, \<userAlias\>)
Resolve ```userAlias``` to its primary nick on ```server``` and rename all ```userAlias``` dbKeys in ```server``` to the resolved nick.

###mergeStats(\<server\>, \<mergeFrom\>)
After demoting ```mergeFrom``` from a primary user to a secondary alias, call mergeStats to resolve ```mergeFrom``` to its primary nick on ```server``` and copy all statistics to each appropriate field of the resolved primary, incrementing fields where data already exists.
This function will also update each field's timestamps to use the most recent "last" timestamp and the oldest "init" timestamp from the two users.
Upon completion, ```mergeFrom``` will be removed from the database.

###__getChanUsers(\<server\>, \<channel\>)
Return the server.user.channel objects for all users on a server who have a dbKey for a particular channel.<br />
Note this function is regarded as an "internal" API function and could be subject to change or removal without notice.

###roll()
Calls ```__rolloverChannel``` for all channels for all servers. Typically this would be called automatically by a timer at midnight each day.

###__rolloverChannel(\<server\>, \<channel\>)
Move the current day pointer for all rolling data point fields forward for the given ```channel``` on ```server```. Note that if this function is called outside of ```roll```, the database is not automatically saved. Note also that this function is regarded as an "internal" API function and could be subject to change or removal without notice.

##Timers
###Channel Rollover
Responsible for moving the current day pointer forward on all 'rolling' data fields for all channels on all servers at the end of each day.
* Interval: 86,400,000 ms (One day)
* Callback: dbot.api.stats.roll()

##Licence
stats is distributed under the MIT license, see LICENCE for further information.
