/*'''
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
  Copyright (C) 2016  Alejandro F. Carrera <alejfcarrera@mail.ru>

  This file is part of Librairy. <https://github.com/librairy>

  Licensed under Apache License. See LICENSE for more info.
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=#
'''*/

var addEmptyMessage = function addEmptyMessage()
{
    var wrap = d3.select('#wrapper')
        .append('div').attr('id', 'wrapper-error');
    wrap.append('div').attr('class', 'wrapper-error-img');
    wrap.append('p').text(libTranslations['msg-empty']['es']);
    wrap.append('p').attr('class', 'subline')
        .text(libTranslations['msg-try']['es']);
};

var addConnectionMessage = function addConnectionMessage()
{
    var wrap = d3.select('#wrapper')
        .append('div').attr('id', 'wrapper-error');
    wrap.append('div').attr('class', 'wrapper-error-img');
    wrap.append('p').text(libTranslations['msg-connection']['es']);
    wrap.append('p').attr('class', 'subline')
        .text(libTranslations['msg-try']['es']);
};

var showErrorMessage = function showErrorMessage(type)
{
    var wrap = d3.select('#wrapper');
    wrap.attr('class', 'loaded');
    if (type === 0) addEmptyMessage();
    else addConnectionMessage();
};

var hideErrorMessage = function hideErrorMessage()
{
    d3.select('wrapper-error').remove();
};

var showLoadingTopics = function showLoadingTopics()
{
    showLoading(1);
};

var showLoadingDomains = function showLoadingDomains()
{
    showLoading(0);
};

var showLoading = function showLoading(type)
{
    var wrap = d3.select('#wrapper');
    wrap.attr('class', '');
    var wrapLoading = wrap.append('div').attr('id', 'loading-container');
    var wrapBooks = wrapLoading.append('ul').attr('class', 'loading-books');
    var classes = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
    for (var i = 0; i < classes.length; i++)
        wrapBooks.append('li').attr('class', 'loading-book ' + classes[i]);
    if (type == 0)
        wrapLoading.append('p').text(libTranslations['msg-loading-dom']['es']);
    else wrapLoading.append('p').text(libTranslations['msg-loading-top']['es']);
};

var hideLoading = function hideLoading(completionBlock)
{
    var loading = d3.select('#loading-container');
    loading.classed('hidden', true);
    setTimeout(function ()
    {
        loading.remove();
        completionBlock();
    }, 1250);
};
