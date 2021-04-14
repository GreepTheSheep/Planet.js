module.exports = async function(message, gbxClient){
    if (message.content.startsWith('//status')){
        var res = await gbxClient.query('GetStatus')
        await gbxClient.query('ChatSendServerMessageToLogin', ["$0fa $zServer is "+res.Name+` (Code ${res.Code})`, message.player.login])
    }
}