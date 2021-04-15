# TM Control JS
 A server controller for Trackmania 2020, written in JavaScript

 ## What is it ?
Trackmania servers can have a controller, that means it can display server informations and can control a server in input/output, with the XMLRPC protocol on the server-side

## Installation
1) Download (Node.js)[https://nodejs.org/]
2) Download the repo
3) Rename settings.sample.json to settings.json and fill/replace the details on it
4) Launch the server, once launched run the controller with `node .` on the cmd

For hosted servers (like VPS), you can run it on PM2 daemon with the command `pm2 start src/index.js -n "TM Control JS"`

## Contributing
Unfortunally, this code is a mess. And not fully maintenable. But if you want something implemented, please consider open a issue.

If you can understand the code, try doing PRs ;)

I advise you to use [Nextcontrol by dassschaf](https://github.com/dassschaf/nextcontrol) if you want to have a operational Node.JS server controller without any problems, the code on it is easily maintenable and you can easily create plugins on it
