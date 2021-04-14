const gbxremote = require('gbxremote')
const MySQL = require('mysql')
const fs = require('fs')
const colors = require('colors')
const path = require('path')
const settings = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "settings.json")))
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json")))

var gbxClient = gbxremote.createClient(settings.trackmania.port, settings.trackmania.host);

var sql = MySQL.createConnection({
    host     : settings.database.host,
    user     : settings.database.user,
    password : settings.database.password,
    database : settings.database.database
});
sql.connect(async (err)=>{
    if (err){
        console.error(colors.red('Impossible to connect to MySQL server. Code: ' + err.code))
        process.exit(98)
    } else {
        console.log(colors.green('[SQL] Connected to the MySQL server!') + ' Connexion ID: ' + sql.threadId)
    }
})

var plugins = []
var files = fs.readdirSync(path.join(__dirname, 'plugins'))
files.forEach(file=>{
    if (file.endsWith('.js') && !settings.unloadPlugins.includes(file)) {
        plugins.push(file)
        require('./plugins/'+file)(gbxClient, sql, settings, pkg)
    }
})

gbxClient.on('connect', async ()=>{
    gbxClient.query('EnableCallbacks', true);
    await gbxClient.query('Authenticate', [settings.trackmania.login, settings.trackmania.password]).catch(() => {
        console.error(colors.red('Login to the server as SuperAdmin failed, check your credentials and try again'))
        process.exit(90);
    });
    
    gbxClient.query('GetVersion').then(async res=>{
        console.log(colors.green("Connected to "+res.Name+" Server") + ' Server version: '+res.Build);
    }).catch(err=>{
        console.error('Error when querying server:', err);
    });

    await gbxClient.query('ChatSendServerMessage', [`$0fa$w $0FAP$4BBl$88Da$B4En$F0Fe$F0Ft$E0B.$D07j$C03s$z, v${pkg.version}.\n$f0f $z${plugins.length} loaded`])
});

gbxClient.on('callback', function(method, params) {
    if (settings.devMode){
        if (method == 'TrackMania.PlayerChat') return
        console.log("Callback from server: %s - %d params", method, params.length);
        console.log(params);
    }
});

gbxClient.on('TrackMania.PlayerConnect', async params=>{
    let player = await gbxClient.query('GetPlayerInfo', [params[0], 1])
    console.log(colors.green(`${player.NickName} (${player.Login}) joined the server`))
    await gbxClient.query('ChatSendServerMessageToLogin', ["$0fa Welcome "+player.NickName+"!", params[0]])
    sql.query('SELECT * FROM `players` WHERE login = ?', player.Login, async (err, res)=>{
        if (err) console.error(err)
        else {
            var playerType = ""
            if (res.length < 1){
                var playerTypeNum = 0
                if (settings.moderators.includes(player.Login)) playerTypeNum = 1
                if (settings.admins.includes(player.Login)) playerTypeNum = 2
                if (player.Login == settings.owner) playerTypeNum = 3

                if (playerTypeNum == 0) playerType = ""
                if (playerTypeNum == 1) playerType = "$fa0Moderator$z"
                if (playerTypeNum == 2) playerType = "$f50Admin$z"
                if (playerTypeNum == 3) playerType = "$f00Owner$z"
                await gbxClient.query('ChatSendServerMessage', ["$0fa$z "+(playerType != "" ? playerType+" ":"")+player.NickName+" joined the server"])
                
                sql.query('INSERT INTO `players` (login, nickname, perms) VALUES (?,?,?)', [player.Login, player.NickName, playerTypeNum], async (err)=>{
                    if (err){
                        console.error(colors.yellow("[SQL] Impossible to register player " + player.Login))
                        console.error(err)
                        await gbxClient.query('ChatSendServerMessageToLogin', ["$0fa $ff0Error: Could not register you in the database, your scores will not be registered", params[0]])
                    }
                })
            } else {
                if (res[0].perms == 0) playerType = ""
                if (res[0].perms == 1) playerType = "$fa0Moderator$z"
                if (res[0].perms == 2) playerType = "$f50Admin$z"
                if (res[0].perms == 3) playerType = "$f00Owner$z"
                await gbxClient.query('ChatSendServerMessage', ["$0fa$z "+(playerType != "" ? playerType+" ":"")+player.NickName+" joined the server"])
            }
        }
    })
});

gbxClient.on('TrackMania.PlayerDisconnect', async params=>{
    sql.query('SELECT * FROM `players` WHERE login = ?', params[0], async (err, res)=>{
        if (err) console.error(err)
        else {
            if (res.length < 1){
                await gbxClient.query('ChatSendServerMessage', ["$0fa$z "+(params[0] == settings.owner ? "$f00Owner$z ":"")+params[0]+" left the server"])
                console.log(colors.yellow(`${params[0]}) left the server`))
            } else {
                console.log(colors.yellow(`${res[0].nickname} (${params[0]}) left the server`))
                var playerType = ""
                if (res[0].perms == 0) playerType = ""
                if (res[0].perms == 1) playerType = "$fa0Moderator$z"
                if (res[0].perms == 2) playerType = "$f50Admin$z"
                if (res[0].perms == 3) playerType = "$f00Owner$z"
                await gbxClient.query('ChatSendServerMessage', ["$0fa$z "+(playerType != "" ? playerType+" ":"")+res[0].nickname+" left the server"])
            }
        }
    })
});

gbxClient.on('TrackMania.PlayerInfoChanged', async params=>{
    sql.query('SELECT * FROM `players` WHERE login = ?', params[0].Login, async (err, res)=>{
        if (err) console.error(err)
        else {
            if (res.length >= 1){
                if (res[0].nickname != params[0].NickName){
                    sql.query("UPDATE `players` SET `nickname` = ? WHERE `login` = ?;", [params[0].NickName, params[0].Login])
                }
            }
        }
    })
});

gbxClient.on('Trackmania.PlayerCheckpoint', async params=>{
    console.log("checkpoint triggered", params)
});


gbxClient.on('TrackMania.PlayerChat', async params=>{
    if (params[0] == 0) return
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

    if (message.command && !message.content.startsWith('//')){
        var commandFiles = fs.readdirSync(path.join(__dirname, 'commands'))
        commandFiles.forEach(file=>{
            if (file.endsWith('.js') && !settings.unloadCommands.everyone.includes(file)) {
                require('./commands/'+file)(message, gbxClient, sql, settings, pkg)
            }
        })
    } else if (message.command && message.content.startsWith('//')){
        sql.query("SELECT * FROM `players` WHERE `login` = ?", message.player.login, async (err, res)=>{
            if (err){
                console.error(colors.red("[SQL] " + err))
                await gbxClient.query('ChatSendServerMessageToLogin', ["$f00 Error on check admin perms on database", message.player.login])
            } else {
                if (res.length < 1) return await gbxClient.query('ChatSendServerMessageToLogin', ["$f00 Error on database, you're not on it!", message.player.login])
                if (res[0].perms == 1 || res[0].perms == 2 || res[0].perms == 3){
                    if (res[0].perms >= 1){
                        fs.readdirSync(path.join(__dirname, 'commands', 'mod')).forEach(file=>{
                            if (file.endsWith('.js') && !settings.unloadCommands.moderators.includes(file)) {
                                require('./commands/mod/'+file)(message, gbxClient, sql, settings, pkg)
                            }
                        })
                    }
                    if (res[0].perms >= 2){
                        fs.readdirSync(path.join(__dirname, 'commands', 'admin')).forEach(file=>{
                            if (file.endsWith('.js') && !settings.unloadCommands.admins.includes(file)) {
                                require('./commands/admin/'+file)(message, gbxClient, sql, settings, pkg)
                            }
                        })
                    }
                    if (res[0].perms == 3){
                        fs.readdirSync(path.join(__dirname, 'commands', 'owner')).forEach(file=>{
                            if (file.endsWith('.js')) {
                                require('./commands/owner/'+file)(message, gbxClient, sql, settings, pkg)
                            }
                        })
                    }
                } else {
                    await gbxClient.query('ChatSendServerMessageToLogin', ["$f00 Acces denied!", message.player.login])
                }
            }
        })
    }
});

gbxClient.on('error', async function(err) {
    console.error(colors.red('Connection to the Trackmania/Maniaplanet server failed: ' + err));
});

gbxClient.on('close', function(had_error) {
    console.log(colors.yellow('Connection to the server has been closed') + (had_error ? colors.red(' with errors'):''));
    process.exit(1)
});