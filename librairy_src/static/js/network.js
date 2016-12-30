/*"""
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
  Copyright (C) 2016  Alejandro F. Carrera <alejfcarrera@mail.ru>

  This file is part of Librairy. <https://github.com/librairy>

  Licensed under Apache License. See LICENSE for more info.
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
"""*/

// Custom function to get neighbors from specific node
sigma.classes.graph.addMethod('neighbors', function(nodeId)
{
    var k, neighbors = {}, neighborsIds = [],
        index = this.allNeighborsIndex[nodeId] || {};
    for (k in index)
    {
        neighborsIds.push(this.nodesIndex[k].id);
        neighbors[this.nodesIndex[k].id] = {
            'label': this.nodesIndex[k].label,
            'color': this.nodesIndex[k].color
        };
    }
    return {'ids': neighborsIds, 'values': neighbors};
});

var sigGraph = undefined;
var selectedNode = undefined;

var showSigmaPanel = function showSigmaPanel(node, linksIds, linksValues)
{
    hideSigmaPanel();
    var wrap = d3.select('#wrapper');
    var panel = wrap.append('div').attr('id', 'info-panel');
    var header = panel.append('div').attr('class', 'info-panel-header').append('p');
    header.text(node.label);
    header.style('color', node.color);
    var subHeaderW = panel.append('div').attr('class', 'info-panel-header info-panel-sub-header');
    subHeaderW.append('p').text(libTranslations['header-words']['es']);
    var wordsPanel = panel.append('div').attr('class', 'info-panel-scroll')
        .append('div').attr('class', 'info-panel-scroll-container');
    for (var i = 0; i < node.words.length; i++)
    {
        wordsPanel.append('p').attr('class', 'info-panel-scroll-cell')
            .text(i + ". " + node.words[i]);
    }
    var subHeaderL = panel.append('div').attr('class', 'info-panel-header info-panel-sub-header');
    subHeaderL.append('p').text(libTranslations['header-links']['es']);
    var linksPanel = panel.append('div').attr('class', 'info-panel-scroll')
        .append('div').attr('class', 'info-panel-scroll-container');
    for (var i = 0; i < linksIds.length; i++)
    {
        linksPanel.append('p').attr('class', 'info-panel-scroll-cell')
            .text(linksValues[linksIds[i]].label)
            .style('color', linksValues[linksIds[i]].color);
    }
};

var hideSigmaPanel = function hideSigmaPanel()
{
    d3.select('#info-panel').remove();
};

var showSigmaVisualization = function showSigmaVisualization(data)
{

    // Create Sigma Object
    sigGraph = new sigma({
        container: 'wrapper-viz',
        settings: {
            drawEdges: false,
            drawLabels: false,
            edgeHoverColor: "default",
            defaultEdgeHoverColor: "#202020",
            labelThreshold: 9
        }
    });

    // Generate variables from data
    var externalEdges = data['external'];
    var externalEdgesIds = Object.keys(externalEdges);
    var internalEdges = data['internal'];
    var countEdge = 0;
    for (var domain in domainsSelected)
    {
        var edgesList = Object.keys(internalEdges[domain]['relations']);
        var nodesList = Object.keys(internalEdges[domain]['topics']);

        // Create nodes for each domain
        for (var i = 0; i < nodesList.length; i++)
        {
            var nodeId = nodesList[i];
            var nodeWords = internalEdges[domain]['topics'][nodesList[i]];
            sigGraph.graph.addNode({
                id: nodeId,
                label: nodeId,
                words: nodeWords,
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 10,
                color: domainsSelected[domain]
            });
        }

        // Create edges for each domain (internal links)
        for (i = 0; i < edgesList.length; i++)
        {
            var edge = edgesList[i].split(":");
            sigGraph.graph.addEdge({
                id: countEdge,
                source: edge[0],
                target: edge[1]
            });
            countEdge++;
        }
    }

    // Create external links
    for (i = countEdge; i < externalEdgesIds.length + countEdge; i++)
    {
        var p = i - countEdge;
        var eId = externalEdgesIds[p].split("_");
        sigGraph.graph.addEdge({
            id: i,
            source: eId[0].split(":")[1],
            target: eId[1].split(":")[1]
        });
    }

    // Active events when Atlas is stopped
    function activeSigmaEvents()
    {
        // Show neighbors when user click on node
        var filter = new sigma.plugins.filter(sigGraph);
        sigGraph.bind('clickNode', function(e)
        {
            if (typeof selectedNode !== 'undefined')
            {
                if (selectedNode === e.data.node.id) return;
            }
            selectedNode = e.data.node.id;

            // Clean sigma graph
            filter.undo().apply();

            // Get neighbors from Node
            var nodes = sigGraph.graph.neighbors(selectedNode);

            // Show information panel
            showSigmaPanel(e.data.node, nodes.ids, nodes.values);

            if (nodes.ids.length === 0) return;

            filter.nodesBy(function(node)
            {
                return nodes.ids.indexOf(node.id) > -1 || node.id === selectedNode;
            })
            .edgesBy(function(edge)
            {
                return edge.source === selectedNode || edge.target === selectedNode;
            })
            .apply();

        });

        // Show all nodes and edges
        sigGraph.bind('clickStage', function()
        {
            filter.undo().apply();
            selectedNode = undefined;
            hideSigmaPanel();
        });
    }

    // Generate ForceAtlas during 10 seconds
    sigGraph.startForceAtlas2({
        adjustSizes: false,
        worker: true,
        slowDown: 10,
        edgeWeightInfluence: 1,
        strongGravityMode: true
    });
    setTimeout(function()
    {
        sigGraph.stopForceAtlas2();
        sigGraph.settings('drawEdges', true);
        sigGraph.settings('drawLabels', true);
        sigGraph.refresh();
        activeSigmaEvents();
    }, 10000);
};

var showButtonBackFromNetwork = function showButtonBackFromNetwork()
{
    // Create button
    var button = d3.select('header')
        .append('div').attr('id', 'button-panel');
    button.append('p').text(libTranslations['but-back']['es']);
    button.on('click', hideNetworkViz);
};

var hideNetworkViz = function hideNetworkViz(error)
{
    // Remove everything
    hideButtonNav();
    showButtonNav(0);
    hideErrorMessage();
    hideSigmaPanel();

    if (!error)
    {
        d3.select('#wrapper').attr('class', '');
        d3.select('#wrapper-viz').remove();
        d3.select('header').attr('class', '');
        d3.select('footer').attr('class', '');

        if (sigGraph !== undefined)
        {
            sigGraph.kill();
            sigGraph = undefined;
        }
    }

    // Show bubbles again
    d3.select('#wrapper-container').style("display", "flex");
};

var showNetworkViz = function showNetworkViz()
{
    hideButtonNav();
    d3.select("#wrapper-selector").remove();
    d3.select("#wrapper-container").style("display", "none");
    showLoadingTopics();
    d3.request('/endpoint/compare')
        .mimeType("application/json")
        .header('Accept', 'application/json')
        .header('Content-Type', 'application/json')
        .post(JSON.stringify(Object.keys(domainsSelected)), function(e)
        {
            hideLoading(function()
            {
                e = JSON.parse(e.responseText);
                var error = true;
                if (e === null)
                    showErrorMessage(1);
                else if (e["external"].length == 0)
                    showErrorMessage(0);
                else
                {
                    error = false;
                    var wrap = d3.select('#wrapper');
                    wrap.append('div').attr('id', 'wrapper-viz');
                    wrap.attr('class', 'loaded-viz');
                    d3.select('header').attr('class', 'loaded-viz');
                    d3.select('footer').attr('class', 'loaded-viz');
                    showSigmaVisualization(e);
                }
                showButtonBackFromNetwork(error);
            });
        });
};
