const Discord = require("discord.js");
const Instagram = require('instagram-web-api');
const chalk = require("chalk");
const config = require('./config/config.json');
const client = new Discord.Client();
const queue = [];
var history = [];
var awaitingreactions = false;
const {
    get
} = require('node-superfetch');
const {
    username,
    password
} = process.env;

const insta = new Instagram({
    username: config.username,
    password: config.password
});

client.on("ready", () => {
    insta.login();

    setQueue().then(() => { //Add 10 images to the queue
        console.log(chalk.keyword('green')(`I'm up and running!`));

        startup();
    });
});

async function setQueue() {
    while (queue.length < 10) { //Add 10 items to the queue
        await addToQueue();
    };

    return;
};

function clearHistoryTimer(n) {
    setTimeout(() => {
        history = []; //Set the history to a blank array

        return clearHistoryTimer(n); //Reset the timer
    }, n);
};

async function addToQueue() {
    await getImg(config.subs[Math.floor(Math.random() * config.subs.length)]).then(img => {
        if (!history.includes(img)) { //Check if we've already posted the meme before
            history.push(img); //Add the url to our history

            return queue.push({ //Add the image and 30 random tags to the queue
                url: img,
                caption: getTags(30)
            });
        } else {
            return addToQueue();
        };
    });
};

function getTags(n) {
    var results = [];

    var i = 0;

    while (i < n) {
        var item = config.tags[Math.floor(Math.random() * config.tags.length)]; //Get a random tag

        if (!results.includes(item)) { //Make sure the array doesn't already include the generated tag
            results.push(item);

            i++;
        };
    };

    return results.join(" "); //Return a string containing each tag joined by a space
};

async function startup() {
    var reactionArr = [
        "⬅️",
        "➡️",
        "📝",
        "❌"
    ];

    var i = 0;

    const manageMsg = await client.channels.cache.get(config.channel).send("Starting..."); //Send a message to edit later

    reactionArr.forEach(emote => { //React to the message in order
        manageMsg.react(emote);
    });

    timePost(manageMsg, reactionArr, i); //Start the post timer

    clearHistoryTimer(604800000); //Start the timer for resetting the history (1 week in this case)

    return reactionHandler(manageMsg, reactionArr, i);
};

async function getImg(sub) {
    var urlArr = [];

    const { //Get the JSON data for the subreddit
        body
    } = await get(sub);

    for (let i = 0; i < body.data.children.length; i++) { //Get the url for every image and add them to the array
        if (body.data.children[i].data.url.endsWith(".jpg")) {
            urlArr.push(body.data.children[i].data.url);
        };
    };

    if (!urlArr.length) { //Error if there were no images found
        return false;
    };

    const url = urlArr[Math.floor(Math.random() * urlArr.length)]; //Choose a random image from the array

    return url; //Return the chosen image
};

async function timePost(manageMsg, reactionArr, i) {
    var time = Math.floor(Math.random() * (3600000 - 2400000) + 2400000); //Get a time from 40 minutes to 1 hour

    setTimeout(() => {
        try {
            insta.uploadPhoto({ //Upload the first item in the queue
                photo: queue[0].url,
                caption: queue[0].caption,
                post: 'feed'
            });

            var postedEmb = new Discord.MessageEmbed() //Set an embed with the details of the new post
                .setColor("RANDOM")
                .setTitle("Posted")
                .setImage(queue[0].url)
                .addField("Caption", queue[0].caption);

            queue.splice(0, 1); //Remove the post from the queue

            addToQueue().then(() => {
                client.channels.cache.get(config.channel).send({ //Send the details of what was just posted
                    embed: postedEmb
                }).then(m => {
                    setTimeout(() => { //Delete the message after 1 minute
                        m.delete();
                    }, 60000);
                });

                setTimeout(() => { //Update the main message, and set the timer for the next post
                    if (awaitingreactions) {
                        var queueEmb = new Discord.MessageEmbed() //Set an embed to show the queue. This will be the main message that everything relies on
                            .setColor("RANDOM")
                            .setTitle(`Page ${i + 1}`)
                            .setImage(queue[i].url)
                            .addField("Caption", queue[i].caption);

                        manageMsg.edit("", {
                            embed: queueEmb
                        });
                    } else {
                        reactionHandler(manageMsg, reactionArr, i);
                    };

                    return timePost(manageMsg, reactionArr, i);
                }, 250);
            });
        } catch (e) {
            queue.splice(0, 1); //Remove the post from the queue

            client.channels.cache.get(config.channel).send(`:x: There was an error posting, so the current item was skipped\n\n\`\`\`js\n${e}\`\`\``).then(m => {
                setTimeout(() => { //Delete the message after 1 minute
                    m.delete();
                }, 60000);
            });

            setTimeout(() => { //Update the main message, and set the timer for the next post
                if (awaitingreactions) {
                    var queueEmb = new Discord.MessageEmbed() //Set an embed to show the queue. This will be the main message that everything relies on
                        .setColor("RANDOM")
                        .setTitle(`Page ${i + 1}`)
                        .setImage(queue[i].url)
                        .addField("Caption", queue[i].caption);

                    manageMsg.edit("", {
                        embed: queueEmb
                    });
                } else {
                    reactionHandler(manageMsg, reactionArr, i);
                };

                return timePost(manageMsg, reactionArr, i);
            }, 250);
        };
    }, time);
};

async function reactionHandler(manageMsg, reactionArr, i) {
    if (awaitingreactions) { //Avoid calling the function multiple times at once
        return;
    };

    var awaitingreactions = true;

    var queueEmb = new Discord.MessageEmbed() //Set an embed to show the queue. This will be the main message that everything relies on
        .setColor("RANDOM")
        .setTitle(`Page ${i + 1}`)
        .setImage(queue[i].url)
        .addField("Caption", queue[i].caption);

    manageMsg.edit("", {
        embed: queueEmb
    });

    const filter = (reaction, user) => reactionArr.includes(reaction.emoji.name) && !user.bot;

    manageMsg.awaitReactions(filter, { //Wait for the user to react
            max: 1
        })
        .then(async collected => {
            collected.first().emoji.reaction.users.remove(config.owner); //Remove the user's reaction

            switch (collected.first().emoji.name) {
                case "⬅️":
                    if (i !== 0) { //Make sure we're not on the first page, and if so, go back a page
                        i--;
                    };

                    var awaitingreactions = false;

                    return reactionHandler(manageMsg, reactionArr, i);

                case "➡️":
                    if (i !== 9) { //Make sure we're not on the last page, and if so, go forward a page
                        i++;
                    };

                    var awaitingreactions = false;

                    return reactionHandler(manageMsg, reactionArr, i);

                case "📝":
                    const msgFilter = m => m.author.id === config.owner;

                    const capMsg = await client.channels.cache.get(config.channel).send("What do you want the caption for this image to be? \n\nUse {tags:<number>} to insert a specified number of random hashtags. (Note: Instagram only allows 30 hashtags per post.) \n\nEx: `Tag someone who does this! {tags:30}`");

                    client.channels.cache.get(config.channel).awaitMessages(msgFilter, { //Wait for the user to give a caption
                        max: 1,
                        time: 120000,
                        errors: ['time']
                    }).then(async collected => {
                        var caption = collected.first().content; //Get the content

                        if (caption.indexOf('{') !== -1 && caption.indexOf('}') !== -1) { //Check if the user wanted to add tags to the post
                            var toReplace = caption.substr(caption.indexOf("{"), caption.indexOf("}")); //Get the part of the message that has the tag info

                            var tag = toReplace.split(":");

                            tag = tag[1].replace("}", ""); //Remove the trailing bracket

                            if (parseInt(tag)) { //Make sure the given data is a number, and get that amount of tags
                                tag = getTags(tag);
                            };

                            queue[i].caption = caption.replace(toReplace, tag); //Add the tags to the caption

                            capMsg.delete(); //Delete the temporary message

                            collected.first().delete(); //Delete the user's message

                            var awaitingreactions = false;

                            return reactionHandler(manageMsg, reactionArr, i); //Reload the main message with the new caption
                        };

                        capMsg.delete();

                        collected.first().delete();

                        queue[i].caption = caption; //Set the caption

                        var awaitingreactions = false;

                        return reactionHandler(manageMsg, reactionArr, i); //Reload the main message with the new caption
                    }).catch(e => {
                        capMsg.delete();

                        client.channels.cache.get(config.channel).send("You didn't respond in time").then(m => {
                            setTimeout(() => { //Delete the message after 5 seconds
                                m.delete();
                            }, 5000);

                            var awaitingreactions = false;

                            return reactionHandler(manageMsg, reactionArr, i); //Reload the main message
                        });
                    });
                    break;

                case "❌":
                    queue.splice(queue.indexOf(queue[i]), 1); //Remove the current post from the queue

                    addToQueue().then(() => {
                        client.channels.cache.get(config.channel).send(":ok_hand: Removed").then(m => { //Send a success message and delete it after 5 seconds
                            setTimeout(() => {
                                m.delete();
                            }, 2500);
                        });

                        setTimeout(() => { //Reload the main message after a quarter second. The delay is just to avoid errors
                            var awaitingreactions = false;

                            return reactionHandler(manageMsg, reactionArr, i);
                        }, 250);
                    });

                    break;

                default:
                    break;
            };
        })
        .catch(e => {
            client.channels.cache.get(config.channel).send(`There was an error!\n\n\`\`\`${e}\`\`\``); //Send an error message

            var awaitingreactions = false;

            return reactionHandler(manageMsg, reactionArr, i); //Reload the main message
        });
};

client.login(config.token); //Log into Discord
