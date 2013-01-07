#stats
A statistics module for <a href="https://github.com/reality/depressionbot">depressionbot</a>.

##Commands
###~lines [user]
Report the number of messages a particular user has spoken in the current channel.
Without the user parameter, the bot will reply with the total number of lines spoken in the channel.

###~words [user]
Report the number of words a particular user has spoken in the current channel.
Note there is no fancy check on the validity or weight of particular words (for example "hello 123!" would count as two words).
It should be noted however that messages are filtered for "words" of length larger than zero to prevent abuse.
Without the user parameter, the bot will reply with the total number of words spoken in the current channel.

###~lincent [user]
Report the percentage of the current channel's total lines a particular user is responsible for.
Without the user parameter, the bot will reply using your own nick as the user parameter.

###~active [user]
Report the day and hour interval for which the user is most active in the current channel.
Without the user parameter, the bot will reply with the current channel's most active interval.

###~loudest [user]
The bot will reply with a leaderboard of the top five users who have spoken the most lines in the current channel.
Providing the optional user parameter will emit a call to ~lincent [user].

###~verbose [user]
The bot will order all users in the current channel by their average words per line metric and reply with a leaderboard of the top five scorers.
Providing the optional user parameter will emit a call to ~words [user].

###~inmentions [user]
The bot will order all users in the current channel by the number of times they have been mentioned \<user\> and reply with a leaderboard of the top five mentioners.
Without the user parameter, the bot will reply using your own nick as the user parameter.

###~outmentions [user]
The bot will order all users in the current channel by the number of times they have been mentioned by \<user\> and reply with a leaderboard of the top five most mentioned.
Without the user parameter, the bot will reply using your own nick as the user parameter.

###~popular [user]
The bot will order all users in the current channel by the number of times they have been mentioned and reply with a leaderboard of the top five most talked about users.
Providing the optional user parameter will emit a call to ~inmentions [user].

##API
###fixStats(\<server\>, \<userAlias\>)
Resolve \<userAlias\> to its primary nick on \<server\> and rename all \<userAlias\> dbKeys in \<server\> to the resolved nick.

##Licence
stats is distributed under the MIT license, see LICENCE for further information.
