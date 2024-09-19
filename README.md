# workchat-pip

Adds a window containing the latest messages you've recieved on workchat (ala Instant Bloomberg) 


## To install/Setup

- install tampermonkey (or other script runner extension) 
- create a new script 
- paste the contents of tm.js into the page 
- hit save :) 
- refresh your tab with workchat 
- **allow popups** and refresh again 


## If you want it to stay on top of all your other windows 
- install https://github.com/amitv87/PiP (i use brew) 
- select the chat popup as the window
- enable "pin" if you want it to follow you across spaces 

### Likely issues
- blank popup 
    - check the console logs, its possible the parsing code broke due to workplace updating their UI code 
