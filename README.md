#stats
A statistics module for <a href="https://github.com/reality/depressionbot">depressionbot</a>.

##Commands
###~lines [user]
Report the number of messages a particular user has spoken in the current channel.
Without the user parameter, the bot will reply with the total number of lines spoken in the channel since the module was activated.

###~words [user]
Report the number of words a particular user has spoken in the current channel.
Note there is no fancy check on the validity or weight of particular words (for example "hello 123!" would count as two words).
Without the user parameter, the bot will reply with the total number of words spoken in the current channel since the module was first loaded.

###~lincent [user]
Report the percentage of the current channel's total lines a particular user is responsible for.
Without the user parameter, the bot will reply using your own nick as the user parameter.

###~active [user]
Report the hour interval for which the user is most active in the current channel.
Without the user parameter, the bot will reply with the current channel's most active interval.

###~loudest
The bot will reply with the user who has spoken the most lines since the module was first activated.
