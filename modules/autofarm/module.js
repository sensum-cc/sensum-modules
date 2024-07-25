const bot = getBot();
const gui = getGui();

let enableBreaking = true;
let enablePlacing = true;
let enableVisuals = true;
let autoCollect = true;
let ignoreGems = false;
let autoReconnect = false;
let itemIdStr = '2';

let tiles = new Array(24).fill(false)

// These will not be saved to config
let savedWorld = ""
let savedPos = new vector2Int(0, 0)
let paused = false
let reconnectTries = 0;

let toggleTest = false;

// [REQUIRED] This gets called when the module config is saved
function onSave() {
    // return json with data to be saved
    const config = {
        enableBreaking: enableBreaking,
        enablePlacing: enablePlacing,
        enableVisuals: enableVisuals,
        autoCollect: autoCollect,
        ignoreGems: ignoreGems,
        itemIdStr: itemIdStr,
        tiles: tiles,
        autoReconnect: autoReconnect
    }
    return JSON.stringify(config)
}

// This gets called when the config menu is opened. Only put gui related code here dont put any thread blocking code here!
function onRender() {
    gui.roundedTitleChild("General", new vector2(283, 245), () => {
        if (gui.normalCheckbox("Enable Breaking", enableBreaking, 20)) {
            enableBreaking = !enableBreaking;
        }
        if (gui.normalCheckbox("Enable Placing", enablePlacing, 20)) {
            enablePlacing = !enablePlacing;
        }
        if (gui.normalCheckbox("Enable Visuals", enableVisuals, 20)) {
            enableVisuals = !enableVisuals;
        }
        if (gui.normalCheckbox("Auto Collect", autoCollect, 20)) {
            autoCollect = !autoCollect;
        }
        if (gui.normalCheckbox("Ignore Gems", ignoreGems, 20)) {
            ignoreGems = !ignoreGems;
        }
        if (gui.normalCheckbox("Auto Reconnect", autoReconnect, 20)) {
            autoReconnect = !autoReconnect;
        }
        itemIdStr = gui.TextInputWithHint('Item ID', 'enter item id', itemIdStr, 6, new vector2(5, 5), 230);
    });
    gui.sameLine();
    gui.roundedTitleChild("Tiles", new vector2(283, 245), () => { 
        gui.setPos(new vector2(45, 20))
        gui.group(() => {
            for (let i = 0; i < tiles.length; i++) {
                if (i == 12) {
                    gui.setPos(new vector2(38, 0))
                }
                if (gui.toggleButton(`tile_t_${i}`, new vector2(30, 30), tiles[i])) {
                    tiles[i] = !tiles[i];
                }
                if ( i < 4 || (i > 4 && i < 9) || (i > 9 && i < 13) || (i > 13 && i < 18) || (i > 18 && i < 23)) {
                    gui.sameLine()
                }
            }
        })
    });
}

// [REQUIRED] You can load the config here, this should be called at start in main function
function loadConfig(configJsonStr) {
    if (configJsonStr) {
        const config = JSON.parse(configJsonStr)
        enableBreaking = config.enableBreaking;
        enablePlacing = config.enablePlacing;
        enableVisuals = config.enableVisuals;
        autoCollect = config.autoCollect;
        ignoreGems = config.ignoreGems;
        itemIdStr = config.itemIdStr;
        tiles = config.tiles;
        autoReconnect = config.autoReconnect;
    }
}


// [REQUIRED] This gets called when the module is enabled
function main(configJsonStr) {
    loadConfig(configJsonStr)
    bot.disconnectedCallback = onDisconnect;

    if (bot.state != clientState.connected) {
        if (bot.connectSync() == false)
        {
            errorOccurred("Failed to connect to server.");
            return;
        }
        sleep(1200);
    }

    if (bot.world.name == null || bot.world.name.toLowerCase() === "exit") {
        errorOccurred("Please join a world first.");
        return;
    }

    savedPos = bot.netAvatar.tilePos
    savedWorld = bot.world.name
    reconnectTries = 0;

    while (isEnabled()) {
        if (paused) {
            sleep(1000)
            continue
        }
        if (bot.playerItems.getItemCount(Number(itemIdStr)) == 0) {
            bot.collectFromRange(18);
        }
        doAutofarm();
    }
    disable();
}

function doAutofarm() {
    if (enableBreaking) {
        for (let i = 0; i < tiles.length; i++) {
            if (tiles[i] == false) continue;
            if (isEnabled() == false) break;
            const pos = getTilePos(i)
            const itemId = parseInt(itemIdStr);
    
            let tileId = getTileId(pos)
            while (tileId == itemId) {
                tileId = getTileId(pos)
                if (tileId != itemId) break
                bot.punch(pos, enableVisuals);
                sleep(160)
            }
        }
    }

    if (enablePlacing) {
        for (let i = 0; i < tiles.length; i++) {
            if (tiles[i] == false) continue;
            if (isEnabled() == false) break;
            const pos = getTilePos(i)

            if (autoCollect) {
                if (ignoreGems) bot.collectFromTile(pos, 112);
                else bot.collectFromTile(pos);
                sleep(15);
            }

            bot.place(pos, Number(itemIdStr), enableVisuals);
            sleep(160)
        }

        if (bot.playerItems.getItemCount(Number(itemIdStr)) == 0) {
            bot.collectFromRange(18);
        }
    }
}

function getTilePos(index) {
    const rex = new vector2Int(2, 2)
    let lastArr = [4, 9, 13, 18, 23]
    let pos = lastArr.filter((c) => index > c).length
  
    if (index >= 12) rex.x -= index - pos * 5 + 1
    else rex.x -= index - pos * 5
  
    rex.y -= pos
  
    return new vector2Int(bot.netAvatar.tilePos.x - rex.x, bot.netAvatar.tilePos.y - rex.y)
}

function onDisconnect() {
    console.log('Disconnected from server');
    if (autoReconnect) {
        while (true) {
            paused = true;
            console.log('Trying to reconnect in 5 seconds');
            sleep(5000);
            if (bot.connectSync() == false) {
                reconnectTries++;
                continue;
            }

            if (bot.world.name == null || bot.world.name.toLowerCase() === "exit" || bot.world.name.toLowerCase() !== savedWorld.toLowerCase()) {
                if (bot.joinWorldSync(savedWorld) == false) {
                    errorOccurred('Failed to join world');
                    break;
                }
            }
            sleep(1200);

            if (savedPos != new vector2Int(0, 0)) {
                if (bot.findPath(savedPos) == false) {
                    errorOccurred('Failed to find path to saved position');
                    break;
                }
                sleep(1000);
                paused = false;
                break;
            }
            else
            {
                errorOccurred('Saved position is not set');
                break;
            }
        }
    }
    else {
        errorOccurred('Disconnected from server, Auto Reconnect is disabled so we dont try reconnect');
    }
}

function getTileId(pos) {
    const tile = bot.world.worldTileMap.getTileByPos(pos)
    if (tile == null) return -1;
    const itemInfo = getItemInfo(tile.foreground)
    return itemInfo.itemType === itemType.background ? tile.background : tile.foreground
 }

function errorOccurred(text) {
    console.log(`Error occurred: ${text}`);
    disable();
}