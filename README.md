# M00D by Future Friendly

## Mood! It is a Chrome browser extension that does semantic analysis of the web-pages and peoples search queries to recognize harmful states of mind on the early stage. Self-care, increased awareness, happier life!

## Screenshots and Interface

On app initialization it will ask for your password (to secure access to the app), email for recieving reports about the mental state and the report interval (how often will send report to your email).




## Installation

**Extension**
Pre-requisities - Chrome Browser

`git clone https://github.com/KolosDan/junction_app`

Open `chrome://extensions/` in your Chrome desktop browser.

Turn on the developer mode (up right corner) and click **Load Unpacked** button that apeared.

Upper-right corner:
![Upper right corner!](https://imgur.com/MZmi28x)

Then upper-left corner:
![](https://imgur.com/YCZfk4s)

Choose the `ext` folder inside the repository you have cloned (e.g /home/user/junction_app/ext/)

You are ready to go! Give the system some data with scrolling social networks, making searches and checking out websites. Enjoy!

If charts do not visualize right or at all - it means that the system does not have enough data about you :)

**API Deployment**
We are hosting the API by ourselves for now and have hardcoded all the endpoints into the extension. In case you really want to run it for yourself:

Pre-requisities - Python3, pip3.

`git clone https://github.com/KolosDan/junction_app`

`cd junction_app`

`pip3 install -r requirements.txt`

`cd api`

`python3 api.py`

Then you change every `ngrok...` endpoint in the ext folder files to your own and your Mood API is running.
