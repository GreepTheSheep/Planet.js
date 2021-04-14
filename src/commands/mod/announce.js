module.exports = async function(message, gbxClient){
    if (message.content.startsWith('//say')){
        let args = message.content.split(" ")
        args.shift()
        await gbxClient.query('ChatSendServerMessage', ["$f00$w"+args.join(' ')])
        await gbxClient.query('SendNotice', [args.join(' '), '"'])
    }
}