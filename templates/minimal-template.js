// Template version 0.0.4-dev
// This is a minimal template for creating a module. It has a basic structure and a render function for the gui.
// https://docs.sensum.cc

/*Module Config
name|My Module
description|Module description
version|1.0.0
title|My Module
author|Sensum
category|Autofarm
Module Config*/

// Don't edit these or call getGui or getBot later in the code. bot gets updated with the real native bot object in realtime so you only need call getbot once.
const gui = getGui();
const bot = getBot();

// This gets called in the modal render loop! only put gui related code here. dont put thread blocking code or operations here as it will pause the whole gui.
// Use newThread for operations that take time.
function render() {
    
}