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

// This gets called when the module gets disabled
function onDisable()
{

}

// This gets called when module gets saved
function onSave()
{
    // return json with data to save
    const config = {};
    return JSON.stringify(config);
}

// This gets called in the modal render loop! only put gui related code here. dont put thread blocking code or operations here as it will pause the whole gui.
// Use newThread for operations that take time.
// This function is optional and can be removed if not needed.
function onRender()
{
}

// Loads config
function loadConfig(configSave)
{
    if (configSave)
    {
        const config = JSON.parse(configSave);
    }
}

// This gets called when the module gets enabled
// ConfigSave is the json data saved in onSave function you can load the config settings from it.
function main(configSave)
{
    loadConfig(configSave);
}