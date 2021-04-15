module.exports = async function(message, gbxClient){
    if (message.content.startsWith('//stopserver')){
        await gbxClient.query('StopServer')
    }
}