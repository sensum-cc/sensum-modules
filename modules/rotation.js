// Template version 0.0.6-dev
// This is a minimal template for creating a module. It has a basic structure and a render function for the gui.
// Modules have save system to save configured options. Each bot has its own save file for each module.
// https://docs.sensum.cc

/*Module Config
name|Rotation
description|Official sensum rotation module
version|1.0.0
title|Rotation
category|Autofarm
Module Config*/

// Don't delete or edit these two lines, or call getGui/getBot anymore in your code.
const gui = getGui()
const bot = getBot()

let autoReconnect = true;


let seed = 0;
let block = 0;

// This gets called when module gets saved
function onSave() {
  // return json with data to save
  const config = {}
  return JSON.stringify(config)
}

// This gets called in the modal render loop! only put gui related code here. dont put thread blocking code or operations here as it will pause the whole gui.
// Use newThread for operations that take time.
// This function is optional and can be removed if not needed.
function onRender() {

}
// Loads config
function loadConfig(configSave) {
  if (configSave) {
    const config = JSON.parse(configSave)
  }
}

// This gets called when the module gets enabled
// ConfigSave is the json data saved in onSave function you can load the config settings from it.
function main(configSave) {
  loadConfig(configSave)

  seed = scanWorld()
  if (seed == -1) {
    errorOccured('Failed to scan world.')
    return;
  }
  block = seed - 1

  const blockInfo = getItemInfo(block);

  print('Scanned world. Starting to rotation farm: {0}', blockInfo.name)

  if (doHarvest() == false) return
}

bot.onJoinedWorldCallback = (world) => {
  
}

//AUTOBAN CHECK SPEEDS AND SAFE CHECK COLLECT THAT BOT DOENS TRY COLLECT IF FULL ETC::
function doHarvest() {
   while (isEnabled()) {
    //if (bot.)
    const treeTile = bot.getFirstReadyTree()
    if (treeTile == null) {
      // We assume world is rotated
      break
    }

    if (bot.findPath(treeTile.pos) == false) {
      errorOccured('Failed to findpath to destination, 0x1')
      return false
    }
    bot.punch(treeTile.pos, true)
    bot.collectFromRange(64)
  }

  return true
}


function scanWorld() {
  const tiles = bot.world.worldTileMap.tiles;

  let trees = {};

  tiles.forEach(tile => {
    if (tile.foreground == 0) return;
    if (tile.extra == null) return;
    if (tile.extra.type != tileExtraType.tree) return;
    if (trees.hasOwnProperty(tile.foreground)) {
      trees[tile.foreground] = tile[tile.foreground] + 1;
    }
    else {
      trees[tile.foreground] =  1;
    }
  });

  let highest = -1;
  if (Object.keys(trees).length > 0) {
    highest = Object.entries(trees).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }
  
  return highest;
}

// synced warp function: this function will warp the bot and block the code until bot is in the world
function warpSync(input) {
  bot.warp(input)
  let time = 0
  const timeout = 15
  while (bot.world.loaded == false) {
    if (time >= timeout) {
      errorOccured("Failed to warp: Timeout")
      return false
    }
    time++
    sleep(1000)
  }
  return true
}

// synced connect function: this function will connect the bot and block the code until bot is connected
function connectSync() {
  const result = bot.connect()
  if (result.length > 0) {
    errorOccured("Failed to connect: " + result)
    return false
  }
  let time = 0
  const timeout = isItemsLoaded ? 15 : 25 // 15 seconds if items are loaded, 25 if not (this is because it can take a while to load items)
  while (bot.state != clientState.connected) {
    if (time >= timeout) {
      errorOccured("Failed to connect: Timeout")
      return false
    }
    time++
    sleep(1000)
  }
  return true
}

function errorOccured(text) {
  print("Error occured: {0}", text)
  disable()
}