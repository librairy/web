/*'''
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
  Copyright (C) 2016  Alejandro F. Carrera <alejfcarrera@mail.ru>

  This file is part of Librairy. <https://github.com/librairy>

  Licensed under Apache License. See LICENSE for more info.
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
'''*/

d3.sankey = function()
{
    var sankey = {},
        height = 300,
        nodeWidth = 30,
        nodeNumber = 5,
        maxNodeHeight = 100,
        maxNodeWords = 10,
        nodePadding = 28,
        size = [1, 1],
        nodes = [],
        links = [];

    sankey.nodeWidth = function(_)
    {
        if (!arguments.length) return nodeWidth;
        nodeWidth = _;
        nodePadding = nodeWidth - 2;
        return sankey;
    };

    sankey.maxNodeHeight = function(_)
    {
        if (!arguments.length) return maxNodeHeight;
        maxNodeHeight = _;
        return sankey;
    }

    sankey.maxNodeWords = function(_)
    {
        if (!arguments.length) return maxNodeWords;
        maxNodeWords = _;
        return sankey;
    }

    sankey.nodeNumber = function(_)
    {
        if (!arguments.length) return nodeNumber;
        nodeNumber = _;
        return sankey;
    };

    sankey.height = function(_)
    {
        if (!arguments.length) return height;
        height = _;
        return sankey;
    };

    sankey.nodes = function(_)
    {
        if (!arguments.length) return nodes;
        nodes = _;
        return sankey;
    };

    sankey.links = function(_)
    {
        if (!arguments.length) return links;
        links = _;
        return sankey;
    };

    sankey.size = function()
    {
        size = [
            (nodeNumber * nodeWidth) + (nodeNumber * nodePadding), height
        ];
        return sankey;
    };

    sankey.layout = function()
    {
        computeNodeLinks();
        computeNodeDepths();
        computeNodeBreadths();
        computeLinkDepths();
        return sankey;
    };

    sankey.relayout = function()
    {
        computeLinkDepths();
        return sankey;
    };

    sankey.link = function()
    {
        var curvature = .55;

        function link(d)
        {
            var x0 = d.source.x + nodeWidth/2,
                x1 = d.target.x + nodeWidth/2,
                y0 = d.source.y + d.source.dy,
                y1 = d.target.y,
                yi = d3.interpolateNumber(y0, y1),
                y2 = yi(curvature),
                y3 = yi(1 - curvature);

            return 'M' + x0 + ',' + y0  // start (of SVG path)
                + 'C' + x0 + ',' + y2   // CP1 (curve control point)
                + ' ' + x1 + ',' + y3   // CP2
                + ' ' + x1 + ',' + y1;  // end
        }

        link.curvature = function(_)
        {
            if (!arguments.length) return curvature;
            curvature = +_;
            return link;
        };

        return link;
    };

    var computeNodeLinks = function computeNodeLinks()
    {
        nodes.forEach(function(node)
        {
            node.sourceLinks = [];
            node.targetLinks = [];
        });
        links.forEach(function(link)
        {
            var source = link.source,
                target = link.target;
            if (typeof source === 'number') source = link.source = nodes[link.source];
            if (typeof target === 'number') target = link.target = nodes[link.target];
            source.sourceLinks.push(link);
            target.targetLinks.push(link);
        });
    };

    var computeNodeBreadths = function computeNodeBreadths()
    {
        var nodesByBreadth = d3.nest()
            .key(function(d) { return d.y; })
            .sortKeys(d3.ascending)
            .entries(nodes)
            .map(function(d) { return d.values; });

        nodesByBreadth.forEach(function(nodes)
        {
            nodes.forEach(function(node, i)
            {
                node.x = i;
                node.pad = nodePadding;
                node.dy = maxNodeHeight * (node.words / maxNodeWords);
            });
        });

        relaxLeftToRight(1);
        resolveCollisions();

        function relaxLeftToRight(a)
        {
            nodesByBreadth.forEach(function(nodes, breadth)
            {
                nodes.forEach(function(node)
                {
                    if (node.targetLinks.length)
                        node.x += (- center(node)) * a;
                });
            });
        }

        function resolveCollisions()
        {
            nodesByBreadth.forEach(function(nodes)
            {
                var node, dy, x0 = 0, n = nodes.length, i;

                // Push any overlapping nodes right.
                nodes.sort(ascendingDepth);
                for (i = 0; i < n; ++i)
                {
                    node = nodes[i];
                    dy = x0 - node.x;
                    if (dy > 0) node.x += dy;
                    x0 = node.x + node.pad + nodePadding;
                }

                // If the rightmost node goes outside the bounds, push it left.
                dy = x0 - nodePadding - size[0];
                if (dy > 0)
                {
                    x0 = node.x -= dy;

                    // Push any overlapping nodes left.
                    for (i = n - 2; i >= 0; --i)
                    {
                        node = nodes[i];
                        dy = node.x + node.pad + nodePadding - x0; // was y0
                        if (dy > 0) node.x -= dy;
                        x0 = node.x;
                    }
                }
            });
        }

        function ascendingDepth(a, b)
        {
            return b.x - a.x;
        }
    };

    // move to bottom
    var moveSinksDown = function moveSinksDown(y)
    {
        nodes.forEach(function(node)
        {
            if (!node.sourceLinks.length)
                node.y = y - 1;
        });
    };

    // shift their locations out to occupy the screen
    var scaleNodeBreadths = function scaleNodeBreadths(kx)
    {
        nodes.forEach(function(node)
        {
            node.y *= kx;
        });
    };

    var computeNodeDepths = function computeNodeDepths() {
        var remainingNodes = nodes, nextNodes, y = 0;
        while (remainingNodes.length)
        {
            nextNodes = [];
            remainingNodes.forEach(function(node)
            {
                node.y = y;
                node.sourceLinks.forEach(function(link)
                {
                    if (nextNodes.indexOf(link.target) < 0)
                        nextNodes.push(link.target);
                });
            });
            remainingNodes = nextNodes;
            ++y;
        }
        moveSinksDown(y);
        scaleNodeBreadths((size[1] - nodeWidth) / (y - 1));
    };

    var computeLinkDepths = function computeLinkDepths()
    {
        nodes.forEach(function(node)
        {
            node.sourceLinks.sort(ascendingTargetDepth);
            node.targetLinks.sort(ascendingSourceDepth);
        });

        function ascendingSourceDepth(a, b)
        {
            return a.source.x - b.source.x;
        }

        function ascendingTargetDepth(a, b)
        {
            return a.target.x - b.target.x;
        }
    };

    var center = function center(node)
    {
        return node.y + node.dy / 2;
    };

    return sankey;
};

var showSankeyVisualization = function showSankeyVisualization(data)
{

    // Generate variables from data
    var externalEdges = data['external'];
    var externalEdgesIds = Object.keys(externalEdges);
    var internalEdges = data['internal'];

    var sankeyNodes = [];
    var sankeyAlready = {};
    var numberNode = 0;
    var numberWords = 0;
    var countNodes = 0;
    for (var domain in domainsSelected)
    {
        var nodesList = Object.keys(internalEdges[domain]['topics']);
        if (nodesList.length > numberNode) numberNode = nodesList.length;

        // Create nodes for each domain
        for (var i = 0; i < 15; i++)
        {
            var nodeId = nodesList[i];
            var words = internalEdges[domain]['topics'][nodesList[i]].length;
            if (words > numberWords) numberWords = words;
            if (!(nodeId in sankeyAlready))
            {
                sankeyAlready[nodeId] = countNodes;
                sankeyNodes.push({
                    'name': nodeId,
                    'words': words,
                    'color': domainsSelected[domain]
                })
                countNodes++;
            }
        }
    }
    numberNode = 15;

    // Create external links
    var sankeyLinks = [];
    for (var i = 0; i < externalEdgesIds.length; i++)
    {
        var eId = externalEdgesIds[i].split('_');
        if (eId[0].split(':')[1] in sankeyAlready && eId[1].split(':')[1] in sankeyAlready)
        {
            var sId = sankeyAlready[eId[0].split(':')[1]];
            var tId = sankeyAlready[eId[1].split(':')[1]];
            sankeyLinks.push({
                'source': (sId < tId) ? sId : tId,
                'target': (tId > sId) ? tId : sId
            });
        }
    }

    var widthNode = (window.innerWidth + (numberNode * 2))/(2 * numberNode);
    var widthViz = (numberNode * widthNode) + ((numberNode - 1) * (widthNode - 2));
    var heightViz = (window.innerHeight - 200);
    heightViz -= (heightViz * 0.1);
    var nDomains = Object.keys(domainsSelected).length;
    if (nDomains > 2)
        heightViz = heightViz * 0.5 * nDomains;

    var svg = d3.select('#wrapper-viz').append('svg')
        .attr('width', widthViz + 'px')
        .attr('height', heightViz + 'px')
        .append('g').attr('transform', 'translate(0, 0)');

    // Create Sankey object
    var sankey = d3.sankey()
        .height(heightViz)
        .nodeWidth(widthNode)
        .nodeNumber(numberNode)
        .maxNodeWords(numberWords)
        .size();

    var path = sankey.link();

    sankey.nodes(sankeyNodes)
        .links(sankeyLinks)
        .layout();

    var link = svg.append('g').selectAll('.link')
        .data(sankeyLinks)
        .enter().append('path')
        .attr('class', 'link')
        .attr('d', path)
        .style('stroke-width', 5)
        .style('stroke', function(d) { return d.source.color; })
        .sort(function(a, b) { return b.dy - a.dy; });

    var node = svg.append('g').selectAll('.node')
        .data(sankeyNodes)
        .enter().append('g')
        .attr('class', 'node')
        .attr('transform', function(d)
        {
            return 'translate(' + d.x + ',' + d.y + ')';
        })
        .on('click', clickNode);

    node.append('rect')
        .attr('height', function(d) { return d.dy; })
        .attr('width', widthNode)
        .style('fill', function(d) { return d.color; })
        .style('stroke', function(d) { return d3.rgb(d.color).darker(1); })
        .append('title')
        .text(function(d) { return '\n' + d.name + '\n'; });

    var nodeActive = undefined;

    function clickNode(d)
    {
        restoreNodes();
        restoreLinks();

        if (nodeActive !== undefined && nodeActive == d.name)
        {
            nodeActive = undefined;
            return;
        }

        nodeActive = d.name;
        var nodesToShow = {};
        nodesToShow[d.name] = 1;
        d3.selectAll('.link').each(function(l, i)
        {
            if (l.source.name != d.name)
            {
                d3.select(this).attr('opacity', 0.1)
                nodesToShow[l.target.name] = 1;
            }
        });
        d3.selectAll('.node').each(function(n, i)
        {
            if (!(n.name in nodesToShow))
            {
                d3.select(this).attr('opacity', 0.1)
            }
        });
    }

    function restoreNodes()
    {
        d3.selectAll('.node').attr('opacity', 1);
    }

    function restoreLinks()
    {
        d3.selectAll('.link').attr('opacity', 1);
    }

};

var showButtonBackFromSankey = function showButtonBackFromSankey()
{
    // Create button
    var button = d3.select('header')
        .append('div').attr('id', 'button-panel');
    button.append('p').text(libTranslations['but-back']['es']);
    button.on('click', hideSankeyViz);
};

var hideSankeyViz = function hideSankeyViz(error)
{
    // Remove everything
    hideButtonNav();
    showButtonNav(0);
    hideErrorMessage();

    if (!error)
    {
        d3.select('#wrapper').attr('class', '');
        d3.select('#wrapper-viz').remove();
        d3.select('header').attr('class', '');
        d3.select('footer').attr('class', '');
    }

    // Show bubbles again
    d3.select('#wrapper-container').style('display', 'flex');
};

var showSankeyViz = function showSankeyViz()
{
    hideButtonNav();
    d3.select('#wrapper-selector').remove();
    d3.select('#wrapper-container').style('display', 'none');
    showLoadingTopics();
    d3.request('/endpoint/compare')
        .mimeType('application/json')
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
                else if (e['external'].length == 0)
                    showErrorMessage(0);
                else
                {
                    error = false;
                    var wrap = d3.select('#wrapper');
                    wrap.append('div').attr('id', 'wrapper-viz');
                    wrap.attr('class', 'loaded-viz');
                    d3.select('header').attr('class', 'loaded-viz');
                    d3.select('footer').attr('class', 'loaded-viz');
                    showSankeyVisualization(e);
                }
                showButtonBackFromSankey(error);
            });
        });
};
