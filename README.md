#stats
A statistics module for <a href="https://github.com/reality/depressionbot">depressionbot</a>.

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
**Currently Disabled**<br />
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
###getUserStats(\<server\>, \<user\>, \<channel\>, [field(s)])
Query the API for statistics pertaining to a user on a particular channel on a server.<br />
A successful reply will follow the following format;
```
{
  "code":       Response code, currently not used. 0 is good.
                Non zero is not good and means you will not be reading your API reply today.
  "display":    Either the alias and primary nick in the form 'alias (primary)' or simply the primary nick.
  "primary":    The primary nick of the profile.
  "fields":     An object containing a response for each requested field.
  {
    "name":     The name of the field requested is used as the key for each field response object.
    {
      "code":   Field response code, currently not used. 0 is good.
                A non-zero value will indicate failure and the properties below may be unavailable.
      "data":   Formatted data, the result of this.format(this.data) on the data field in question.
                For example, for wpl this result would be formatted to 2dp and appended with ' wpl'.
      "raw":    Raw data, the value of the data field before it was formatted.
                For example, for lines, this would be missing thousands separators.
                Required if you wish to use the result for further numerical calculation.
      "init":   The timestamp object for when the first record of this statistic was recorded.
                Typically you will want to use init (which calls toString) or init.full().
      "last":   The timestamp object for when this statistic was last updated by the listener.
                Typically you will want to use init (which calls toString) or init.full().
    }
  }
}
```
It is important to note that ```primary``` will be returned in lowercase due to the way in which stats handles usernames.
Note that you should also validate the reply itself. If ```server```, ```channel``` or ```user``` pertain to invalid keys, the reply will be ```null```.

###getChanStats(\<server\>, \<channel\>, [field(s)])
Query the API for statistics pertaining to a particular channel on a server.<br />
A successful reply will follow the following format;

```
{
  "code":       Response code, currently not used. 0 is good.
                Non zero is not good and means you will not be reading your API reply today.
  "fields":     An object containing a response for each requested field.
  {
    "name":     The name of the field requested is used as the key for each field response object.
    {
      "code":   Field response code, currently not used. 0 is good.
                A non-zero value will indicate failure and the properties below may be unavailable.
      "data":   Formatted data, the result of this.format(this.data) on the data field in question.
                For example, for wpl this result would be formatted to 2dp and appended with ' wpl'.
      "raw":    Raw data, the value of the data field before it was formatted.
                For example, for lines, this would be missing thousands separators.
                Required if you wish to use the result for further numerical calculation.
      "init":   The timestamp object for when the first record of this statistic was recorded.
                Typically you will want to use init (which calls toString) or init.full().
      "last":   The timestamp object for when this statistic was last updated by the listener.
                Typically you will want to use init (which calls toString) or init.full().
    }
  }
}
```
Note you should validate the reply itself. If ```server``` or ```channel``` pertain to invalid keys, the reply will be ```null```.

###getChanUsersStats(\<server\>, \<channel\>, [field(s)])
Calls ```getUserStats``` for each user on the ```server``` with a key for the specified ```channel```.<br />
These users are discovered with a call to ```__getChanUsers```.
This function is typically used for the web interface when displaying lists of users in a channel with associated stats data.
A successful reply will follow the following format;
```
{
  "code":           Response code, currently not used. 0 is good.
                    Non zero is not good and means you will not be reading your API reply today.
  "users":          An object containing a response for each user with data for the selected channel.
  {
    "name":         The primary name of the user for which the object pertains to.
    "code":         User response code, currently not used. 0 is good.
                    A non zero value will indicate a form of failure (user doesn't exist etc.) and should
                    be considered a warning not to rely on the existence of the properties expected below.
    {
      "fields":     An object containing a response for each requested field.
      {
        "name":     The name of the field requested is used as the key for each field response object.
        {
          "code":   Field response code, currently not used. 0 is good.
                    A non-zero value will indicate failure and the properties below may be unavailable.
          "data":   Formatted data, the result of this.format(this.data) on the data field in question.
                    For example, for wpl this result would be formatted to 2dp and appended with ' wpl'.
          "raw":    Raw data, the value of the data field before it was formatted.
                    For example, for lines, this would be missing thousands separators.
                    Required if you wish to use the result for further numerical calculation.
          "init":   The timestamp object for when the first record of this statistic was recorded.
                    Typically you will want to use init (which calls toString) or init.full().
          "last":   The timestamp object for when this statistic was last updated by the listener.
                    Typically you will want to use init (which calls toString) or init.full().
        }
      }
    }
  }
}
```

###leaderboarder(\<server\>,  \<channel\> | \<user\> \<channel\>, \<field\>, \<places\>, \<reverse\>)
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
A successful API leaderboarder reply returns the format;

```
{
  "leaderboard":  The leaderboard as a string, of the form;
                  "user1 (value1), user2 (value2), ..., usern (valuen)"
  "places":       The number of positions in the return leaderboard, this can sometimes be less than the 
                  ```places``` parameter due to insufficient data. You should ensure this is larger than
                  zero when validating the reply.
  "init":         The timestamp object for when the first record of this statistic was recorded.
                  Typically you will want to use init (which calls toString) or init.full().
}
```
Note that you should also validate the reply itself. If ```server```, ```channel``` or ```user``` pertain to invalid keys, the reply will be ```null```.

###isActive({\<server\>, \<user\> | \<channel\> | \<user\> \<channel\>, [inLast=10]})
Report whether a message from a [user in any channel | channel itself | user in a specific channel] was recorded in inLast minutes.
inLast defaults to ten minutes. Note the parameters are to be delivered within an object.

###fixStats(\<server\>, \<userAlias\>)
Resolve ```userAlias``` to its primary nick on ```server``` and rename all ```userAlias``` dbKeys in ```server``` to the resolved nick.

###__getChanUsers(\<server\>, \<channel\>)
Return the server.user.channel objects for all users on a server who have a dbKey for a particular channel.<br />
Note this function is regarded as an "internal" API function and could be subject to change without notice.

##Licence
stats is distributed under the MIT license, see LICENCE for further information.
