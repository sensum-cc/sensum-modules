/*Module Config
name|Spammer
description|Official sensum spammer module
version|1.0.0
title|Spammer
author|Sensum
category|Spammer
Module Config*/

const gui = getGui();
const bot = getBot();

let enabled = false;
let autoPos = false;
let spamTextInput = "";
let worldInput = "";
let spamPosInput = "";
let intervalInput = "";
let spamPos = new Vector2Int(0, 0);

function onLoad(configSave)
{
    if (configSave != null)
    {
        autoPos = configSave.autoPos;
        worldInput = configSave.worldInput;
        spamPosInput = configSave.spamPosInput;
    }
}

function onUnload()
{

}

function onSave()
{
    return {
        autoPos: autoPos,
        worldInput: worldInput,
        spamPosInput: spamPosInput
    }
}

function render()
{
    gui.child("c_1", new Vector2(200, 200), () =>
    {
        if (gui.checkbox("Enable", enabled))
        {
            enabled = !enabled;
            if (enabled)
            {
                newThread(action);
            }
        }
        /*if (gui.checkbox("Auto Position", autoPos))
        {
            autoPos = !autoPos;
        }*/
        gui.text("World")
        worldInput = gui.textInput("world_input", "name|doorid", worldInput, 64, 180);
        gui.text("Custom Spam Position (Tile pos)")
        spamPosInput = gui.textInput("spam_pos_input", "x,y", spamPosInput, 10, 180);
        gui.text("Spam Message");
        spamTextInput = gui.textInput("spam_text_input", "Spam message", spamTextInput, 120, 180);
        gui.text("Spam Interval (ms)");
        intervalInput = gui.textInput("interval_input", "Interval", intervalInput, 20, 180);
    })
}

function action()
{
    if (bot.state != ClientState.connected)
    {
        if (connectSync() == false)
        {
            print('Failed to connect (timeout)');
            enabled = false;
            return;
        }
        sleep(1400)
    }

    const worldName = worldInput.split('|')[0];
    if (worldName.toLowerCase() != bot.world.name.toLowerCase())
    {
        if (warpSync(worldInput) == false)
        {
            print('Failed to join world (timeout)');
            enabled = false;
            return;
        } 
    }


    // waiting while to give bot resolver to detect other spam bots
    sleep(3000);

    if (autoPos)
    {
        //TODO: implement auto pos
    }
    else
    {
        const pos = spamPosInput.split(',');
        spamPos = new Vector2Int(parseInt(pos[0]), parseInt(pos[1]));
        if (pos === new Vector2Int(0, 0))
        {
            pos = bot.netAvatar.tilePos;
        }

        if (bot.FindPathSync(pos) == false)
        {
            print('Failed to find path to position');
            enabled = false;
            return;
        }
    }

    while (enabled)
    {
        bot.setIcon(IconType.None);
        bot.Say(spamTextInput);
        bot.setIcon(IconType.Chat);
        sleep(Number(intervalInput))
    }
}

function connectSync()
{
    const result = bot.connect();
    if (result.length > 0)
    {
        return false;
    }
    const timeout = 15;
    let time = 0;
    while (bot.state != ClientState.Connected)
    {
        if (time >= timeout) return false;
        sleep(1000);
        time++;
    }
    return true;
}

function warpSync(input)
{
    bot.warp(input);
    const timeout = 15;
    let time = 0;
    while (bot.world.name.toLowerCase() != input.split('|')[0].toLowerCase() && bot.world.loaded == false)
    {
        if (time >= timeout) return false;
        sleep(1000);
        time++;
    }
    return true;
}