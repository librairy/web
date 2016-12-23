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
    };

    sankey.maxNodeWords = function(_)
    {
        if (!arguments.length) return maxNodeWords;
        maxNodeWords = _;
        return sankey;
    };

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
            .key(function(d) { return d.domain; })
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

        resolveCollisions();

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

    var computeNodeDepths = function computeNodeDepths() {
        var remainingNodes = nodes;
        var k = (size[1] - nodeWidth) / (domainsOrder.length - 1);
        remainingNodes.forEach(function(node)
        {
            node.y = domainsOrder.indexOf(node.domain) * k;
        });
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

    return sankey;
};

var showSankeyVisualization = function showSankeyVisualization(data)
{

    // Generate variables from data
    var externalEdges = data['external'];
    var externalEdgesIds = Object.keys(externalEdges);
    var internalEdges = data['internal'];

    var sankeyNodes = [];
    var sankeyLinks = [];
    var sankeyAlready = {};
    var numberNode = 0;
    var numberWords = 0;
    var countNodes = 0;
    for (var k = 0; k < domainsOrder.length; k++)
    {
        var domain = domainsOrder[k];
        var nodesList = Object.keys(internalEdges[domain]['topics']);
        if (nodesList.length > numberNode) numberNode = nodesList.length;

        // Create nodes for each domain
        for (var j = 0; j < nodesList.length; j++)
        {
            var nodeId = nodesList[j];
            var words = internalEdges[domain]['topics'][nodesList[j]].length;
            if (words > numberWords) numberWords = words;
            if (!(nodeId in sankeyAlready))
            {
                sankeyAlready[nodeId] = countNodes;
                sankeyNodes.push({
                    'name': nodeId,
                    'words': words,
                    'domain': domain,
                    'color': domainsSelected[domain]
                });
                countNodes++;
            }
        }
    }

    while (externalEdgesIds.length > 0)
    {
        var nodeLink = externalEdgesIds.pop().split('_');
        var sourceNodeLink = nodeLink[0].split(':');
        var targetNodeLink = nodeLink[1].split(':');
        sankeyLinks.push({
            'source': sankeyAlready[sourceNodeLink[1]],
            'target': sankeyAlready[targetNodeLink[1]]
        });
    }

    // Create external links
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
        .attr('opacity', 0.8)
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

    function clickNode(node)
    {
        restoreNodes();
        restoreLinks();

        if (nodeActive !== undefined && nodeActive == node.name)
        {
            nodeActive = undefined;
        }
        else
        {
            hideLinks();
            hideNodes();

            var remainingNodes=[], nextNodes=[];

            var traverse = [{
                linkType : "sourceLinks",
                nodeType : "target"
            }, {
                linkType : "targetLinks",
                nodeType : "source"
            }];

            traverse.forEach(function(step)
            {
                node[step.linkType].forEach(function(link)
                {
                    remainingNodes.push(link[step.nodeType]);
                    getNode(link.source.name).attr('opacity', 0.8);
                    getNode(link.target.name).attr('opacity', 0.8);
                    getLink(link.source.name, link.target.name).attr('display', 'block');
                });

                while (remainingNodes.length)
                {
                    nextNodes = [];
                    remainingNodes.forEach(function(node)
                    {
                        node[step.linkType].forEach(function(link)
                        {
                            nextNodes.push(link[step.nodeType]);
                            getNode(link.source.name).attr('opacity', 0.8);
                            getNode(link.target.name).attr('opacity', 0.8);
                            getLink(link.source.name, link.target.name).attr('display', 'block');
                        });
                    });
                    remainingNodes = nextNodes;
                }
            });

            function getNode(node_name)
            {
                return d3.selectAll('.node').filter(function(n, i)
                {
                    return n.name === node_name;
                });
            }

            function getLink(node_source, node_target)
            {
                return d3.selectAll('.link').filter(function(l, i)
                {
                    return l.source.name === node_source && l.target.name == node_target;
                });
            }
            
            nodeActive = node.name;
        }
    }

    function restoreNodes()
    {
        d3.selectAll('.node').attr('opacity', 0.8)
    }

    function hideNodes()
    {
        d3.selectAll('.node').attr('opacity', 0.1);
    }

    function restoreLinks()
    {
        d3.selectAll('.link').attr('display', 'block');
    }

    function hideLinks()
    {
        d3.selectAll('.link').attr('display', 'none');
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
