module.exports = async function(message, gbxClient){
    if (message.content.startsWith('/whoami')){
        let player = await gbxClient.query('GetPlayerInfo', [message.player.login, 1])
        await gbxClient.query('ChatSendServerMessageToLogin', ["$0fa You are "+player.NickName+"!", message.player.login])
    }
}