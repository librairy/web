/*'''
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
  Copyright (C) 2016  Alejandro F. Carrera <alejfcarrera@mail.ru>

  This file is part of Librairy. <https://github.com/librairy>

  Licensed under Apache License. See LICENSE for more info.
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
'''*/

var showVizPanel = function showVizPanel()
{
    hideButtonNav();
    showButtonNav(1);
    d3.select('#wrapper-container').style('display', 'none');
    var wrap = d3.select('#wrapper');
    var selector = wrap.append('div').attr('id', 'wrapper-selector');
    wrap.attr('class', 'loaded-viz');
    d3.select('header').attr('class', 'loaded-viz');
    d3.select('footer').attr('class', 'loaded-viz');
    var boxOne = selector.append('div').attr('class', 'box-viz');
    boxOne.append('div').attr('box-viz-img-san');
    boxOne.append('p').text(libTranslations['but-san']['es']);
    boxOne.on('click', showSankeyViz);
    var boxTwo = selector.append('div').attr('class', 'box-viz');
    boxTwo.append('div').attr('box-viz-img-net');
    boxTwo.append('p').text(libTranslations['but-net']['es']);
    boxTwo.on('click', showNetworkViz);
};

var hideVizPanel = function hideVizPanel()
{
    // Remove everything
    hideButtonNav();
    d3.select('#wrapper').attr('class', '');
    d3.select('#wrapper-selector').remove();
    d3.select('header').attr('class', '');
    d3.select('footer').attr('class', '');

    // Show bubbles again
    d3.select('#wrapper-container').style('display', 'flex');
};

var showButtonNav = function showButtonNav(type)
{
    // Check if button exists
    var button = document.getElementById('button-panel');
    if (button !== null) return;

    // Create button
    var button = d3.select('header')
        .append('div').attr('id', 'button-panel');
    if (type == 0)
    {
        button.append('p').text(libTranslations['but-sel']['es']);
        button.on('click', showVizPanel);
    }
    else if (type == 1)
    {
        button.append('p').text(libTranslations['but-back']['es']);
        button.on('click', hideVizPanel);
    }
};

var hideButtonNav = function hideButtonNav()
{
    // Check if button exists
    var button = document.getElementById('button-panel');
    if (button === null) return;

    // Remove button
    d3.select('#button-panel').remove();
};
