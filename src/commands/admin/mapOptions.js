module.exports = async function(message, gbxClient){
    let player = await gbxClient.query('GetPlayerInfo', [message.player.login, 1])
    if (message.content.startsWith('//restart')){
        await gbxClient.query('ChatSendServerMessage', ["$f0f $0ff"+player.NickName+" $zrestarted the current map"])
        await gbxClient.query('RestartMap')
    }
    if (message.content.startsWith('//skip')){
        await gbxClient.query('ChatSendServerMessage', ["$f0f $0ff"+player.NickName+" $zskipped the current map"])
        await gbxClient.query('NextMap')
    }
}