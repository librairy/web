/*"""
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
  Copyright (C) 2016  Alejandro F. Carrera <alejfcarrera@mail.ru>

  This file is part of Librairy. <https://github.com/librairy>

  Licensed under Apache License. See LICENSE for more info.
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
"""*/

var showPanelNode = function showPanelNode(node, linksIds, linksValues)
{
    hidePanelNode();
    var wrap = d3.select('#wrapper');
    var panel = wrap.append('div').attr('id', 'info-panel');
    var header = panel.append('div').attr('class', 'info-panel-header').append('p');
    if (node.hasOwnProperty('label'))
        header.text(node.label);
    else header.text(node.name);
    header.style('color', node.color);
    var subHeaderW = panel.append('div').attr('class', 'info-panel-header info-panel-sub-header');
    subHeaderW.append('p').text(libTranslations['panel-header-words']['es']);
    var wordsPanel = panel.append('div').attr('class', 'info-panel-scroll')
        .append('div').attr('class', 'info-panel-scroll-container');
    for (var iW = 0; iW < node.words.length; iW++)
    {
        wordsPanel.append('p').attr('class', 'info-panel-scroll-cell')
            .text(iW + ". " + node.words[iW]);
    }
    var subHeaderL = panel.append('div').attr('class', 'info-panel-header info-panel-sub-header');
    subHeaderL.append('p').text(libTranslations['panel-header-links']['es']);
    var linksPanel = panel.append('div').attr('class', 'info-panel-scroll')
        .append('div').attr('class', 'info-panel-scroll-container');
    for (var iL = 0; iL < linksIds.length; iL++)
    {
        linksPanel.append('p').attr('class', 'info-panel-scroll-cell')
            .text(linksValues[linksIds[iL]].label)
            .style('color', linksValues[linksIds[iL]].color);
    }
    panel.append('div').attr('id', 'info-panel-close')
        .text(libTranslations['panel-button']['es'])
        .on('click', hidePanelNode);
};

var hidePanelNode = function hidePanelNode()
{
    d3.select('#info-panel').remove();
};