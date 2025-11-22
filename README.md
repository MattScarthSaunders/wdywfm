# WDYWFM

## Or 'WHAT DO YOU WANT FROM ME?' for long.

A tool to help determine just what exactly an api wants from you to avoid being bot detected.

Key features:

- Session Detection: somewhat naive approach but attempts to detect if you're going to need to create and maintain a session
- Bot Detection Detection: You aren't detecting ME, I'M detecting YOU attempting to detect ME
- Cookie tracking to help with long-chain api step through: click on a request to get visual feedback on whether it uses data from another request earlier in the chain, and whether any depend on information from it <strong>(not including response body)</strong>
- Headers as JSON, plus some experimental header-importance ranking: see which headers you'll almost certainly have to include at a glance, or just copy the whole lot in a single click

## How to run

1. Clone the repo locally
2. Open Chrome
3. Go to `chome://extensions/`
4. `Load Unpacked` > select the repo
5. Activate the extension
6. Open devtools > WDYWFM

