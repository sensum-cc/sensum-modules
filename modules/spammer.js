// Template version 0.0.6-dev
// This is a minimal template for creating a module. It has a basic structure and a render function for the gui.
// Modules have save system to save configured options. Each bot has its own save file for each module.
// https://docs.sensum.cc

/*Module Config
name|My Module
description|Module description
version|1.0.0
title|My Module
category|Autofarm
Module Config*/

// Don't delete or edit these two lines, or call getGui/getBot anymore in your code.
const gui = getGui();
const bot = getBot();

let enabled = false;
let autoReconnect = false;
let autoExit = false;
let spamTextInput = "";
let worldNameInput = "";
let intervalInput = "6200";
let positionInput = "0,0";
let paused = false;

let adminInWorld = false;
let checking = false;

// This gets called when the module gets disabled
function onDisable()
{
    enabled = false;
    bot.playerJoinedCallback = null;
}

// This gets called when module gets saved
function onSave()
{
    // return json with data to save
    const config = {autoReconnect, autoExit, spamTextInput, worldNameInput, intervalInput, positionInput};
    return JSON.stringify(config);
}

// This gets called in the modal render loop! only put gui related code here. dont put thread blocking code or operations here as it will pause the whole gui.
// Use newThread for operations that take time.
// This function is optional and can be removed if not needed.
function onRender()
{
    if (gui.checkbox("Auto Reconnect", autoReconnect))
    {
        autoReconnect = !autoReconnect;
    }
    if (gui.checkbox("Auto Exit", autoExit))
    {
        autoExit = !autoExit;
    }
    gui.text("Spam Text");
    spamTextInput = gui.textInput("spam_text_input", "text to spam", spamTextInput, 120, 200);
    gui.text("World Name");
    worldNameInput = gui.textInput("world_name_input", "name|doorid", worldNameInput, 120, 200);
    gui.text("Interval (ms)");
    intervalInput = gui.textInput("interval_input", "interval in milliseconds", intervalInput, 20, 200);
    gui.text("Position (x,y) Tile Pos");
    positionInput = gui.textInput("position_input", "x,y", positionInput, 20, 200);
}

// Loads config
function loadConfig(configSave)
{
    if (configSave)
    {
        const config = JSON.parse(configSave);
        autoReconnect = config.autoReconnect;
        autoExit = config.autoExit;
        spamTextInput = config.spamTextInput;
        worldNameInput = config.worldNameInput;
        intervalInput = config.intervalInput;
        positionInput = config.positionInput;
    }
}

// This gets called when the module gets enabled
// ConfigSave is the json data saved in onSave function you can load the config settings from it.
function main(configSave)
{
    loadConfig(configSave);
    enabled = true;
    
    bot.playerJoinedCallback = onPlayerJoined;

    if (bot.state != clientState.connected)
    {
        if (connectSync() == false) return;
        sleep(1200);
    }

    const worldName = worldNameInput.split("|")[0];
    if (bot.world.name == null || bot.world.name.toLowerCase() != worldName.toLowerCase())
    {
        if (warpSync(worldNameInput) == false) return;
        sleep(1200);
    }

    if (positionInput != "0,0" && positionInput != "")
    {
        const position = positionInput.split(",");
        const pos = new vector2Int(Number(position[0]), Number(position[1]));
        // we assume pos input is based on growtopia client tile position, so this will set it to right position
        pos.x -= 1;
        pos.y -= 1;
        if (pos != new vector2Int(0,0))
        {
            if (bot.findPath(pos) == false) return;
        }
    }

    const interval = Number(intervalInput);
    const divided = interval / 2;
    while (enabled)
    {
        if (paused)
        {
            sleep(1000);
            continue;
        }
        if (bot.state != clientState.connected && paused === false)
        {
            errorOccured("Bot disconnected");
            return;
        }
        bot.setIcon(iconState.none);
        bot.say(spamTextInput);
        sleep(divided);
        bot.setIcon(iconState.chat);
        sleep(divided)
    }
}

// todo test if works, and switch nested timeouts to this
//const delay = ms => new Promise(res => setTimeout(res, ms));

function onPlayerJoined(netAvatar)
{
    if (enabled === false) return;
    if (autoExit === false) return;
    if (netAvatar.isOwner === false && netAvatar.isAdmin === false) return;
    onAdminJoined();
}

function onAdminJoined()
{
    adminInWorld = true;
    paused = true;
    bot.leave();
    if (checking) return;
    check().then(() => {

    });
}

async function check() {
    checking = true;
    setTimeout(() => {
        adminInWorld = false;
        if (warpSync(worldNameInput) == false)
        {
            errorOccured("Failed to warp back to world");
            return;
        }
        setTimeout(() => {
            checking = false;
            if (adminInWorld)
            {
                onAdminJoined();
            }
            else
            {
                paused = false;
            }
        }, 1 * 1000);
    }, 18 * 1000);
}

// synced warp function: this function will warp the bot and block the code until bot is in the world
function warpSync(input)
{
    bot.warp(input);
    let time = 0;
    const timeout = 15;
    while (bot.world.loaded === false)
    {
        if (time >= timeout)
        {
            errorOccured("Failed to warp: Timeout");
            return false;
        }
        time++;
        sleep(1000);
    }
    return true;
}


// synced connect function: this function will connect the bot and block the code until bot is connected
function connectSync()
{
    const result = bot.connect();
    if (result.length > 0)
    {
        errorOccured("Failed to connect: " + result);
        return false;
    }
    let time = 0;
    const timeout = isItemsLoaded ? 15 : 25; // 15 seconds if items are loaded, 25 if not (this is because it can take a while to load items)
    while (bot.state != clientState.connected)
    {
        if (time >= timeout)
        {
            errorOccured("Failed to connect: Timeout");
            return false;
        }
        time++;
        sleep(1000);
    }
    return true;
}

function errorOccured(text)
{
    print("Error occured: {0}", text);
    onDisable();
}