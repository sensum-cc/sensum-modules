// Template version 0.0.6-dev
// This is a minimal template for creating a module. It has a basic structure and a render function for the gui.
// Modules have save system to save configured options. Each bot has its own save file for each module.
// https://docs.sensum.cc

/*Module Config
name|Autofarm
description|Official sensum autofarm module
version|1.0.0
title|Autofarm
category|Autofarm
Module Config*/

// Don't delete or edit these two lines, or call getGui/getBot anymore in your code.
const gui = getGui();
const bot = getBot();

let enableBreaking = false;
let enablePlacing = false;
let enableVisuals = false;
let autoCollect = false;
let autoReconnect = false;
let ignoreGems = false;

let itemIdTextInput = "2";

let tiles = new Array(24).fill(false);

let autoBuyPack = false;
let packIdInput = "world_lock";
let gemLimitInput = "3000";
let packSaveWorldInput = "";
let saveSeed = false;
let saveSeedWorldInput = "";

let savedWorld = "";
let savedPos = new vector2Int(0, 0);
let paused = false;

// This gets called when module gets saved
function onSave()
{
    // return json with data to save
    const config = {enableBreaking, enablePlacing, enableVisuals, autoCollect, ignoreGems, itemIdTextInput, tiles, autoReconnect, autoBuyPack, packIdInput, gemLimitInput, packSaveWorldInput, saveSeed, saveSeedWOrldInput: saveSeedWorldInput};
    return JSON.stringify(config);
}

// This gets called in the modal render loop! only put gui related code here. dont put thread blocking code or operations here as it will pause the whole gui.
// Use newThread for operations that take time.
// This function is optional and can be removed if not needed.
function onRender()
{
    gui.child('ac_1', new vector2(220, 230), () => {
        if (gui.checkbox("Enable Breaking", enableBreaking)) enableBreaking = !enableBreaking;
        if (gui.checkbox("Enable Placing", enablePlacing)) enablePlacing = !enablePlacing;
        if (gui.checkbox("Enable Visuals", enableVisuals)) enableVisuals = !enableVisuals;
        if (gui.checkbox("Auto Collect", autoCollect)) autoCollect = !autoCollect;
        if (gui.checkbox("Auto Reconnect", autoReconnect)) autoReconnect = !autoReconnect;
        if (gui.checkbox("Ignore Gems", ignoreGems)) ignoreGems = !ignoreGems;
        gui.text("Item ID");
        itemIdTextInput = gui.textInput("item_id_input", "Enter itemid", itemIdTextInput, 20, 200);
    });
    // TODO Implement save seed and auto buy pack
    /*gui.sameLine();
    gui.child('ac_2', new vector2(220, 275), () => {
        if (gui.checkbox("Auto Buy Pack", autoBuyPack)) autoBuyPack = !autoBuyPack;
        gui.text("Pack ID");
        packIdInput = gui.textInput("pack_id_input", "Enter packid", packIdInput, 20, 200);
        gui.text("Gem Limit");
        gemLimitInput = gui.textInput("gem_limit_input", "Enter gem limit", gemLimitInput, 20, 200);
        gui.text("Pack Save World");
        packSaveWorldInput = gui.textInput("pack_save_world_input", "Enter pack save world", packSaveWorldInput, 20, 200);
        if (gui.checkbox("Save Seed", saveSeed)) saveSeed = !saveSeed;
        gui.text("Save Seed World");
        saveSeedWorldInput = gui.textInput("save_seed_world_input", "Enter save seed world", saveSeedWorldInput, 20, 200);
    });*/
    gui.sameLine();
    gui.child('ac_3', new vector2(200, 185), () => {
        for (let i = 0; i < tiles.length; i++) {
            if (i == 12) {
                gui.setPos(new vector2(38, 0))
            }
            if (gui.textlessToggleButton(`tile_${i}`, new vector2(30, 30), tiles[i])) {
                tiles[i] = !tiles[i];
            }
            if (i < 4 || (i > 4 && i < 9) || (i > 9 && i < 13) || (i > 13 && i < 18) || (i > 18 && i < 23)) {
                gui.sameLine();
            }
        }
    });
}

// Loads config
function loadConfig(configSave)
{
    if (configSave)
    {
        const config = JSON.parse(configSave);
        enableBreaking = config.enableBreaking;
        enablePlacing = config.enablePlacing;
        enableVisuals = config.enableVisuals;
        autoCollect = config.autoCollect;
        ignoreGems = config.ignoreGems;
        itemIdTextInput = config.itemIdTextInput;
        tiles = config.tiles;
        autoReconnect = config.autoReconnect;
        autoBuyPack = config.autoBuyPack;
        packIdInput = config.packIdInput;
        gemLimitInput = config.gemLimitInput;
        packSaveWorldInput = config.packSaveWorldInput;
        saveSeed = config.saveSeed;
        saveSeedWorldInput = config.saveSeedWOrldInput;
    }
}
// This gets called when the module gets enabled
// ConfigSave is the json data saved in onSave function you can load the config settings from it.
function main(configSave)
{
    loadConfig(configSave);
    bot.disconnectedCallback = onDisconnect;

    if (bot.state != clientState.connected) {
        if (connectSync() == false) return;
        sleep(1200);
    }

    if (bot.world.name == null || bot.world.name.toLowerCase() === "exit") {
        errorOccured("Please join a world before enabling autofarm.");
        return;
    }

    savedPos = bot.netAvatar.tilePos;
    savedWorld = bot.world.name;

    while (isEnabled()) {
        if (paused) {
            sleep(1000);
            continue;
        }
        bot.collectFromRange(18);
        doAutofarm();
    }
}

function onDisconnect() {
    print("Disconnected from server.");
    if (autoReconnect) {
        paused = false;
        print('Reconnecting in 5 seconds')
        sleep(5000);
        if (connectSync() == false) {
            errorOccured("Failed to reconnect.");
            return;
        }
        if (bot.world.name == null || bot.world.name.toLowerCase() != savedWorld.toLowerCase())
        {
            if (warpSync(savedWorld) == false) {
                errorOccured("Failed to warp.");
                return;
            }
        }
        sleep(1200);

        if (savedPos != new vector2Int(0, 0)) {
            if (bot.findPath(savedPos) == false) {
                errorOccured("Failed to find path.");
                return;
            }
        }
        else {
            errorOccured("Failed to find path.");
            return;
        }
    }
    else
    {
        disable();
    }
}

function doAutofarm() {
    for (let i = 0; i < tiles.length; i++) {
        if (tiles[i] == false) continue;
        if (paused || isEnabled() == false) break;
        const pos = getTilePos(i);
        const itemId = parseInt(itemIdTextInput);

        let tileId = getTileId(pos);
        while (tileId == itemId) {
            tileId = getTileId(pos);
            if (tileId != itemId) break;
            if (enableBreaking == false) continue;
            bot.punch(pos, enableVisuals);
            sleep(160);
        }
    }

    for (let i = 0; i < tiles.length; i++) {
        if (tiles[i] == false) continue;
        if (paused || isEnabled() == false) break;
        const pos = getTilePos(i);
        if (autoCollect) {
            if (ignoreGems)
                bot.collectFromTile(pos, 112);
            else
                bot.collectFromTile(pos);
            sleep(15);
        }
        bot.place(pos, Number(itemIdTextInput), enableVisuals);
        sleep(160);
    }
}

function getTileId(pos) {
    const tile = bot.world.worldTileMap.getTileByPos(pos);
    const itemInfo = getItemInfo(tile.foreground);
    return itemInfo.itemType === itemType.background ? tile.background : tile.foreground;
}

function getTilePos(index) {
    const rex = new vector2Int(2, 2);
    let lastArr = [4, 9, 13, 18, 23];
    let pos = lastArr.filter(c => index > c).length;

    if (index >= 12)
        rex.x -= index - pos * 5 + 1;
    else
        rex.x -= index - pos * 5;

    rex.y -= pos;

    return new vector2Int(bot.netAvatar.tilePos.x - rex.x, bot.netAvatar.tilePos.y - rex.y);
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
    disable();
}