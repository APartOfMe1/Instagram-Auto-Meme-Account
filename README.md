# Instagram Auto Meme Account
Instagram Auto Meme Account is a Discord bot (with a fantastic name of course) that automates posting memes on Instagram. The bot will pull memes from Reddit, add hashtags, and automatically post to Instagram.

## What can it do?
The bot lives in a Discord channel, and always shows the next ten memes in the queue. You can remove items from the queue and edit the caption all from a simple reaction-based interface. It'll post the first item in the queue every 40-60 minutes.

![example](https://imgur.com/yYCxIkj.jpg) 

## Installation
1. Install [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/)

2. Run the following three commands 
```
git clone https://github.com/APartOfMe1/Instagram-Auto-Meme-Account
cd Instagram-Auto-Meme-Account
npm install
```
3. You'll need to create a [Discord bot application](https://discord.com/developers/applications/)
4. Open `/config/config.json` and change the following values
```
"token": "your discord bot token",
"owner": "the id of the bot owner (typically yourself)",
"channel": "the id of the channel you want the bot to post in",
"username": "your instagram username",
"password": "your instagram password",
```
You can also edit the tags or subreddits you want the bot to pull from

5. To start the bot, run the following command
```
node index.js
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update the tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
