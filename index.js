#!/usr/bin/env node --harmony

var fetch = require('node-fetch')
var program = require('commander');
var Table = require('cli-table');
var innertext = require('innertext');

var user_collections = ['showcase', 'popular', 'public', 'loved', 'forked'];
var cpen_collections = ['picks', 'popular', 'recent'];
var maxpage = 1;

// parse command line arguments

program
.arguments('[user] [collection]')
.option('-l, --list', 'List the pens rather than downloading them')
.option('-v, --verbose', 'Verbose output')
.option('-p, --pages <first>..<last>', 'Page Range', value_or_range)
.parse(process.argv)
;

// api parts
var host = 'http://cpv2api.com';
var api = 'pens';
var action = 'download';
var log = console.log;

////////////////////////////////////////////////////////////////////////////////

// pick your action
var action = 'download';
if(program.list) {
  action = 'list';
}

// log to the console?
if(!program.verbose) {
  log = function() {};
}

// page limits

var [minpage, maxpage] = program.pages || [1, maxpage];

////////////////////////////////////////////////////////////////////////////////
// argument parsing

var args = program.args;
if(args.length === 0 || cpen_collections.includes(args[0])) {

  // download codepen collection
  col = args[0];
  col = cpen_collections.includes(col) ? col : 'picks';
  console.log('Downloading Codepen\'s "%s" collection', col);

  var parts = [host, api, col];
  var dataurl = parts.join('/');

} else {

  // download user collection
  [user, col] = args;
  col = user_collections.includes(col) ? col : 'showcase';
  console.log('Downloading %s\'s "%s" collection', user, col);

  var parts = [host, api, col, user];
  var dataurl = parts.join('/');

  // number of data pages
  if(col === 'showcase') {
    minpage = maxpage = 1;
  }

}

// announce downloads
log('Retrieving data from %s', dataurl);
if(maxpage >= 1) {
  log('Retrieving pages %d - %d', minpage, maxpage);
}

// this is the download tool that does not download anything (yet)
if(action === 'download') {
  console.log('download not yet implemented, just listing the result ...');
  action = 'list';
}

// create, then print the table
fetchPages(dataurl, minpage)
.then(table => {
  if(table) {
    console.log(table.toString());
  } else {
    console.log('no result.');
  }
})
.catch(error =>
  log("ERROR", error)
);

////////////////////////////////////////////////////////////////////////////////
// functions

// poor man's truncate
var truncate = (str, l) => str.length < l ? str : str.substring(0, l - 1) + '…';

// parse a value or range
function value_or_range(val) {
  var r = val.split('..').map(Number);
  return r.length === 1 ? [r[0], r[0]] : r;
}


function fetchPages(url, page = 1, table) {

  // keep fetching recursively, until there are no more pages
  // or until maxpage is reached ...

  return fetchPage(url, page)
  .then(result => {
    if(result && (page < maxpage)) {
      // fetch the next page
      return fetchPages(url, page + 1, table);
    } else {
      // return the table
      return table;
    }
  })

  // fetch a data page from the url adding information to the table
  // implemented as inner function, to allow easy access to the table object

  function fetchPage(url, page) {

    // add page parameter to the url
    var url = url + '?page=' + page;
    log("Fetching", url);

    return fetch(url)
    .then(res => res.json())
    .then(json => {

      if(!json.error && json.data.length > 0) {

        // get headers from json data
        var headers = Object.keys(json.data[0]);

        // remove 'user' and 'images' from the headers
        var remove = ['user', 'images'];
        headers = headers.filter(item => !remove.includes(item));

        // create new table if it's not there already
        if(!table) {
          table = new Table({head : headers});
        }

        // create table entries
        json.data.forEach( entry => {

          // only pick the values that match the headers
          var values = headers.map( key => {
            // render HTML to text for details
            return (key === 'details' || key === 'title') ? truncate(innertext(entry[key]), 40) : entry[key]
          });

          // add entries to the table
          table.push(values);

        });

        // there may be more pages ...
        return true;

      } else {

        // no more pages
        return false;

      }
    });
  }
}
