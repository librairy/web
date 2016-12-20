/*"""
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
  Copyright (C) 2016  Alejandro F. Carrera <alejfcarrera@mail.ru>

  This file is part of Librairy. <https://github.com/librairy>

  Licensed under Apache License. See LICENSE for more info.
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
"""*/

var bubbleHandler = function bubbleHandler(e)
{
    var circleId = this.getAttribute('id');
    var circle = d3.select('#' + circleId);

    // Check if domain has been selected
    if (domainsSelected.indexOf(circleId) > - 1)
    {
        circle.attr("class", "circle-column circle-buzz circle-fade");
        var positionCircleId = domainsSelected.indexOf(circleId);
        domainsSelected.splice(positionCircleId, 1);
    }
    else
    {
        circle.attr("class", "circle-column circle-selected");
        domainsSelected.push(circleId);
    }
    if (domainsSelected.length > 0)
        showPanelDomains();
    else hidePanelDomains();
};

var createCircleRow = function createCircleRow()
{
    return d3.select("#wrapper")
        .append("div").attr("class", "circle-row");
};

var createCircle = function createCircle(row, text, identifier, height, hue)
{
    // Get Random color and luminosity for contrast
    var color = d3.color('hsl(' + hue + ', 78%, 78%)').rgb();
    var L = 0.2126 * (color.r/255)^2.2 + 0.7151 * (color.g/255)^2.2 + 0.0721 * (color.b/255)^2.2;
    var colourFont = (L <= 0.18) ? 'white' : 'black';

    // Create circle with properties
    var circle = row.append("div").attr("class", "circle-column circle-buzz circle-fade")
        .attr("id", 'circle-' + identifier).style("height", height + "px")
        .style("width", height + "px").style("background-color", color.toString())
        .on("click", bubbleHandler);
    circle.append("div").attr("class", "text").style("color", colourFont)
        .text(text);
};

var showCircles = function showCircles(domains)
{
    domainsValues = domains;

    var wrap = d3.select("#wrapper");
    wrap.attr("class", "loaded circles");

    // Generate window constraints
    var nDomains = domains.length;
    var baseColour = Math.floor(Math.random() * 360);
    var maxRows = (window.innerHeight > 600) ? 3 : 2;
    var maxHeight = parseInt((window.innerHeight - 200) / maxRows) - 5;
    var nRow = parseInt((window.innerWidth - 40) / (maxHeight + 40));

    // If only, it exists one row
    if (nDomains < nRow)
    {
        maxHeight = parseInt(window.innerHeight - 245);

        // If new height overflows window width
        if (((maxHeight * nDomains) + ((nDomains + 1) * 40)) > window.innerWidth)
            maxHeight = parseInt((window.innerWidth - (40 * (nDomains + 1))) / nDomains);
    }

    // Create first row
    var circleRow = createCircleRow();
    var count = 0;

    // Iterate to create circles or row if it is necessary
    for (var i = 0; i < domains.length; i++)
    {
        domainsDict[domains[i]["container"]["id"]] = i;
        createCircle(
            circleRow, domains[i]["container"]["name"],
            domains[i]["container"]["id"], maxHeight,
            (baseColour + (i * 41)) % 360
        );
        if (i < domains.length -1 && ++count == nRow)
        {
            circleRow = createCircleRow();
            count = 0;
        }
    }
};
