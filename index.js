#!/usr/bin/env node --harmony

const fetch = require('node-fetch');
const program = require('commander');
const Table = require('cli-table');
const innertext = require('innertext');

const user_collections = ['showcase', 'popular', 'public', 'loved', 'forked'];
const cpen_collections = ['picks', 'popular', 'recent'];

// parse command line arguments

program
.arguments('[user] [collection]')
.option('-l, --list', 'List the pens rather than downloading them')
.option('-v, --verbose', 'Verbose output')
.option('-p, --pages <first>..<last>', 'Page Range', value_or_range)
.parse(process.argv)
;

// api parts
const host = 'http://cpv2api.com';
const api = 'pens';
let log = console.log;
let action = 'download';

////////////////////////////////////////////////////////////////////////////////

// pick your action
if(program.list) {
  action = 'list';
}

// log to the console?
if(!program.verbose) {
  log = function() {};
}

// default page limits
let maxpage = 1;
let minpage = 1;

// actual page limits
[minpage, maxpage] = program.pages || [minpage, maxpage];

////////////////////////////////////////////////////////////////////////////////
// argument parsing

const args = program.args;
if(args.length === 0 || cpen_collections.includes(args[0])) {

  // download codepen collection
  let col = args[0];
  col = cpen_collections.includes(col) ? col : 'picks';
  console.log('Downloading Codepen\'s "%s" collection', col);

  const parts = [host, api, col];
  const dataurl = parts.join('/');

} else {

  // download user collection
  let [user, col] = args;
  col = user_collections.includes(col) ? col : 'showcase';
  console.log('Downloading %s\'s "%s" collection', user, col);

  const parts = [host, api, col, user];
  const dataurl = parts.join('/');

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

// create, then print the table
fetchPages(dataurl, table, minpage)
.then(table => {
  if(table) {

    if(action === 'list') {
      console.log(table.toString());
    }

    if(action === 'download') {
      console.log(table);
    }

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
const truncate = (str, l) => str.length < l ? str : str.substring(0, l - 1) + '…';

// parse a value or range
function value_or_range(val) {
  var r = val.split('..').map(Number);
  return r.length === 1 ? [r[0], r[0]] : r;
}

function fetchPages(url, table, page = 1) {

  // keep fetching recursively, until there are no more pages
  // or until maxpage is reached ...

  return fetchPage(url, page)
  .then(result => {
    if(result && (page < maxpage)) {
      // fetch the next page
      return fetchPages(url, table, page + 1);
    } else {
      // return the table
      return table;
    }
  });

  // fetch a data page from the url adding information to the table
  // implemented as inner function, to allow easy access to the table object

  function fetchPage(url, page) {

    // add page parameter to the url
    url = url + '?page=' + page;

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
            return (key === 'details' || key === 'title') ? truncate(innertext(entry[key]), 40) : entry[key];
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
