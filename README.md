# WDYWFM

## Or 'WHAT DO YOU WANT FROM ME?' for long.

Key features:

- Session Detection: attempts to detect if you're going to need to create and maintain a session
- Bot Detection Detection: You aren't detecting ME, I'M detecting YOU attempting to detect ME
- Cookie tracking to help with long-chain api step through: click on a request to get visual feedback on whether it uses data from another request earlier in the chain, and whether any depend on information from it <strong>(not including the response body...yet)</strong>
- Headers as JSON, plus some experimental header-importance ranking: see which headers you'll almost certainly have to include at a glance, or just copy the whole lot in a single click
- Response and Request body Typescript schema generation - attempts to generate a typescript schema from a json object with at least slightly intelligent naming and deduplication

## How to run

1. Clone the repo locally
2. Open Chrome
3. Go to `chome://extensions/`
4. `Load Unpacked` > select the repo
5. Activate the extension
6. Open devtools > WDYWFM

## How To Use

This is basically an extension for the network tab in devtools, and under the hood uses the api for it, so just like in there, select a request you're interested in and poke around. The intent isn't to be a replacement for the network tab, that's already great and feature rich.  


## Future endeavours

- response body analysis and similar functionality to what is happening with cookies - where does this data go? How is it used? This will almost probably certainly never make it in, if I'm honest.
