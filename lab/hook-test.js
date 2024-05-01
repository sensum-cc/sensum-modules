// This is test modulee for gui testing

/*Module Config
name|My Module
description|Module description
version|1.0.0
title|My Module
author|Sensum
category|Autofarm
Module Config*/

const gui = getGui();
const bot = getBot();

bot.joinedWorldCallback = onJoinedWorld;

function render() {

}

function onJoinedWorld(name)
{
    print('Joined world: ' + name);
}