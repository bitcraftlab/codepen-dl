# Codepen Downloader

Download codepens for local use.  

_Powered by the inofficial [Codepen v2 API](http://cpv2api.com/)_.
## install

    npm install -g

## usage

##### download a bunch of pens from a specific user

    codepen-dl [--list] [--pages RANGE] USER_ID [public|showcase|popular|loved|forked]

##### download a bunch of pens from codepen

    codepen-dl [--list] [--pages RANGE] [picks|popular|recent]


## examples

By default all public codepens will be downloaded.

    codepen-dl bitcraftlab

The download stops after 10 pages of pens. Use the `pages` option, if you want to specify a different page range.  
Downloading pages 11 to 15 of codepen's picks:

    codepen-dl --pages 11..15

You can always ask for help:

    codpene-dl --help
    Usage: codepen-dl [options] [user] [collection]

    Options:

      -h, --help                   output usage information
      -l, --list                   List the pens rather than downloading them
      -v, --verbose                Verbose output
      -p, --pages <first>..<last>  Page Range
      -d, --dir <dir_name>         Target directory

Before wasting bandwidth it's always a good idea to have a look at what you are downloading.
Use the `list` option:

![](https://cloud.githubusercontent.com/assets/720669/25147781/f942f37c-2478-11e7-87eb-e3ddf68675e4.png)


## license

MIT
