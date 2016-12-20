/*"""
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
  Copyright (C) 2016  Alejandro F. Carrera <alejfcarrera@mail.ru>

  This file is part of Librairy. <https://github.com/librairy>

  Licensed under Apache License. See LICENSE for more info.
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
"""*/

var domainsSelected = [];
var domainsValues = [];
var domainsDict = {};

var showPanelDomains = function showPanelDomains()
{
    // Check if button exists
    var button = document.getElementById("button-panel");
    if (button !== null) return;

    // Create button
    var button = d3.select('header')
        .append("div").attr("id", "button-panel");
    button.append("p").text(libTranslations['but-panel']['es']);
    button.on('click', showVisualizations);
};

var hidePanelDomains = function hidePanelDomains()
{
    // Check if button exists
    var button = document.getElementById("button-panel");
    if (button === null) return;

    // Remove button
    d3.select('#button-panel').remove();
};
