const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')
module.exports = async function(message, gbxClient, sql, settings){
    let player = await gbxClient.query('GetPlayerInfo', [message.player.login, 1])
    if (message.content.startsWith('//settimelimit') || message.content.startsWith('//settime')){
        let args = message.content.split(" ")
        args.shift()

        if (args.length < 1) return await gbxClient.query('ChatSendServerMessageToLogin', ["$f0f $zUsage: //settime [Time in seconds]", player.Login])

        var timeSeconds = parseInt(args[0])
        if (isNaN(timeSeconds)) return await gbxClient.query('ChatSendServerMessageToLogin', ["$f0f $zThe Number you entered is not valid", player.Login])

        var mapsDir = await gbxClient.query('GetMapsDirectory')
        var matchSettingsPath = path.join(mapsDir, 'MatchSettings', settings.trackmania.matchsettings_file)
        var matchSettings = await xml2js.parseStringPromise(fs.readFileSync(matchSettingsPath))

        for (let i = 0; i < matchSettings.playlist.mode_script_settings.length; i++) {
            if (matchSettings.playlist.mode_script_settings[i].setting[0].$.name == 'S_TimeLimit'){
                matchSettings.playlist.mode_script_settings[i].setting[0].$.value = args[0]

                var builder = new xml2js.Builder();
                fs.writeFileSync(matchSettingsPath, builder.buildObject(matchSettings))
                await gbxClient.query('LoadMatchSettings', matchSettingsPath)
                await gbxClient.query('ChatSendServerMessage', ["$f0f $0ff"+player.NickName+" $zset the time limit to " + args[0]])
                break
            }
        }
    }
}