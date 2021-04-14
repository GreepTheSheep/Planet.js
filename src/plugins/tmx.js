const download = require('download')
const fs = require('fs')
const colors = require('colors')
module.exports = async function(gbxClient, sql){
    gbxClient.on('TrackMania.PlayerChat', async params=>{
        const message = {
            serverMessage: params[0] == 0 ? true: false,
            player:{
                uid: params[0],
                login: params[1]
            },
            content: params[2],
            contentStriped: params[2].replace(/\$[nmwoszi]|\$[hl]\[[a-zA-Z0-9/?#!&\\.\\\-_=@$'()+,;:]*\]|\$[0-f]{3}/gi, '').replace(/\$\$/gi, '$'),
            command: params[3]
        }
        if (message.content.startsWith('//tmx')){
            sql.query("SELECT * FROM `players` WHERE `login` = ?", message.player.login, async (err, res)=>{
                if (err){
                    console.error(colors.red("[SQL] " + err))
                    await gbxClient.query('ChatSendServerMessageToLogin', ["$f00 Error on check admin perms on database", message.player.login])
                } else {
                    if (res.length < 1) return await gbxClient.query('ChatSendServerMessageToLogin', ["$f00 Error on database, you're not on it!", message.player.login])
                    if (res[0].perms == 2 || res[0].perms == 3){
                        let args = message.content.split(" ")
                        args.shift()
                        if (args.length < 1) return await gbxClient.query('ChatSendServerMessageToLogin', ["$0fa $zUsage: //tmx [add] [id]", message.player.login])
                        if (args[0].toLowerCase() == 'add'){
                            if (!args[1]) return await gbxClient.query('ChatSendServerMessageToLogin', ["$0fa $zUsage: //tmx add [id]", message.player.login])
                            if (isNaN(Number(args[1])) || isNaN(parseFloat(args[1]))) return await gbxClient.query('ChatSendServerMessageToLogin', ["$0fa $zIt's not a valid TMX ID", message.player.login])
                            var mapsDir = await gbxClient.query('GetMapsDirectory')
                            let tmxDir = mapsDir + '/TMX/'
                            if (!fs.existsSync(tmxDir)) fs.mkdirSync(tmxDir);
                            var filename = args[1]+".Map.gbx"
                            await download('https://trackmania.exchange/maps/download/'+args[1], tmxDir, {filename: filename});
                            let map = await gbxClient.query('GetMapInfo', [tmxDir + filename])
                            map['tmxId'] = args[1];
                            await gbxClient.query('InsertMap', [tmxDir + filename]);
                            let player = await gbxClient.query('GetPlayerInfo', [message.player.login, 1])
                            await gbxClient.query('ChatSendServerMessage', [`$0fa $z${player.NickName} added ${map.Name} $zfrom $l[https://trackmania.exchange/s/tr/${map.tmxId}]Trackmania.Exchange$l`])
                        }
                    } else {
                        await gbxClient.query('ChatSendServerMessageToLogin', ["$f00 Acces denied!", message.player.login])
                    }
                }
            })
        }
    })
}