module.exports = async function(message, gbxClient){
    let player = await gbxClient.query('GetPlayerInfo', [message.player.login, 1])
    if (message.content.startsWith('//restart')){
        await gbxClient.query('ChatSendServerMessage', ["$f0f $0ff"+player.NickName+" $zrestarted the current map"])
        await gbxClient.query('RestartMap')
    }
    if (message.content.startsWith('//skip')){
        await gbxClient.query('ChatSendServerMessage', ["$f0f $0ff"+player.NickName+" $zskipped the current map"])
        var nextMap = await gbxClient.query('GetNextMapInfo')
        await gbxClient.query('ChatSendServerMessage', ["$f0f $zThe next map will be "+nextMap.Name])
        await gbxClient.query('NextMap')
    }
}