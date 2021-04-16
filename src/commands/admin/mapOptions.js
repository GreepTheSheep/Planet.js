const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')
module.exports = async function(message, gbxClient, sql, settings){
    let player = await gbxClient.query('GetPlayerInfo', [message.player.login, 1])
    if (message.content.startsWith('//restart')){
        await gbxClient.query('ChatSendServerMessage', ["$f0f $0ff"+player.NickName+" $zrestarted the current map"])
        await gbxClient.query('RestartMap')
    }
    if (message.content.startsWith('//skip')){
        var actualMap = await gbxClient.query('GetCurrentMapInfo')
        actualMap['index'] = await gbxClient.query('GetCurrentMapIndex');

        var mapsDir = await gbxClient.query('GetMapsDirectory')
        var matchSettingsPath = path.join(mapsDir, 'MatchSettings', settings.trackmania.matchsettings_file)
        var matchSettings = await xml2js.parseStringPromise(fs.readFileSync(matchSettingsPath))

        if (matchSettings.playlist.map.length == 1) {
            await gbxClient.query('ChatSendServerMessage', ["$f0f $0ff"+player.NickName+" $zrestarted the current map"])
            await gbxClient.query('RestartMap')
            return
        }

        for (let i = 0; i < matchSettings.playlist.map.length; i++) {
            if (i == actualMap['index']){
                i++
                if (i >= matchSettings.playlist.map.length) i = 0;
                const filename = matchSettings.playlist.map[i].file;
                const map = await gbxClient.query('GetMapInfo', filename)
                .catch(async err=>{
                    if (err.faultCode == -1000){
                        matchSettings.playlist.map.splice(i,1)
                        var builder = new xml2js.Builder();
                        fs.writeFileSync(matchSettingsPath, builder.buildObject(matchSettings))
                    } else {
                        await gbxClient.query('ChatSendServerMessage', ["$f0f $0ff"+player.NickName+" $zrestarted the current map"])
                        await gbxClient.query('ChatSendServerMessageToLogin', ["$f0f $zWe restarted because "+err.faultString, player.Login])
                        console.error(err)
                        await gbxClient.query('RestartMap')
                    }
                })
                await gbxClient.query('JumpToMapIndex', i)
                .then(async ()=>{
                    await gbxClient.query('ChatSendServerMessage', ["$f0f $0ff"+player.NickName+" $zskipped the current map\nThe next map will be "+map.Name])
                })
                .catch(async err=>{
                    await gbxClient.query('ChatSendServerMessage', ["$f0f $0ff"+player.NickName+" $zrestarted the current map"])
                    await gbxClient.query('ChatSendServerMessageToLogin', ["$f0f $zWe restarted because "+err.faultString, player.Login])
                    console.error(err)
                    await gbxClient.query('RestartMap')
                })
                
                break
            }
        }
    }
}