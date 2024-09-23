
// ==UserScript==
// @name     Chat Popup Window
// @description :)
// @version  3
// @grant GM_setValue
// @grant GM_getValue
// @match *://fb.workplace.com/chat/*
// @match https://fb.workplace.com/chat/*
// @match *://messenger.com/*
// @match https://messenger.com/*
// @require https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.11.2/moment.js
// ==/UserScript==

let popup = null;

const setup_popup = () => {
    popup = window.open("Workchat Pip", "Popup", "width=1000,height=200,alwaysOnTop=true");
    // Copy over all styles from workplace
    const stylesheets = document.styleSheets;
    const styles = [];
    for (let i = 0; i < stylesheets.length; i++) {
        const stylesheet = stylesheets[i];
        const rules = stylesheet.cssRules;
        for (let j = 0; j < rules.length; j++) {
            const rule = rules[j];
            styles.push(rule.cssText);
        }
    }

    const popup_html = `
    <style>
    ${styles.join("\n")}

  body {
    width: 100%;
    margin-right: 20px;
    overflow-x: hidden;
    overflow-y: scroll;
    font-family: system-ui;
  }
      #shoh-container > ul {
      list-style: none;
      padding-left: 20px;
      padding-right: 20px;
      margin: 0;
    }
    .row {
      font-size: 16px;
      margin: 4px 8px 4px 0px;
      padding-bottom: 4px;
    }
    .row:nth-child(even)  {
      background-color: #eef1f5;
    }
    .row>a {
      text-decoration: none;
    }
    .cell {
      margin: 8px;
    }
    .chat-time {
      width: 10%;
    }
    .chat-group {
      width: 10%;
    }
</style>
<div id="shoh-container">
<ul id="list">
</ul>
</div>
    `;
    popup.document.write(popup_html);
}

const to_popup_html = (msg) => {
    //console.log('to popup ', msg);
    const msg_time = new Date(parseInt(msg.time));
    const date = msg_time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    const time = msg_time.toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric'})
    const today = new Date();
    const isToday = msg_time.getDate() === today.getDate() && msg_time.getMonth() === today.getMonth();

    return `
      <span class="cell chat-time"><small>${isToday? "" : date} ${time}</small></span>|
      <span class="cell chat-group"><b>${msg.group}</b></span>|
      <span class="cell chat-content">${msg.text}</span>
     `;
}

const send_mesage_to_popup = (msg) => {
    var currentTime = new Date().toLocaleTimeString();
    var tr = document.createElement("div");
    tr.className = 'row';
    tr.innerHTML = escapeHTMLPolicy.createHTML(to_popup_html(msg));
    popup.document.getElementById("list").appendChild(tr);
    //console.log(tr);
}

const clear_all_messages = () => {
    let container = (popup.document.getElementById("list"));
    container.innerHTML = "";
}
const render_all_messages = () => {
    for (let message of displayed_chats.slice(0,200)) {
        // remove this for testing with personal chat
        if(message.group == "Gabe Ochoa"){
            continue;
        }
        send_mesage_to_popup(message)
    }
    sort_all_messages();
}

const add_message_if_not_exists = (chat) => {
    if(!chat.time || chat.time.length == 0) return;
    if(chat.text.length == 0) return;
    if(chat.group.length == 0) return;

    for(let message of displayed_chats){
        if(chat.text == message.text && chat.time == message.time && chat.group.replace(/\p{Emoji}/gu,"").trim() == message.group.replace(/\p{Emoji}/gu,"").trim()) {
            //console.log("Skipping message because it was too similar:", chat, message);
            return;
        }
        // slice so we make a copy
        if((' ' + chat.text).slice(1).replace(/^(You:\s+)/,"") == message.text && chat.time == message.time && chat.group.replace(/\p{Emoji}/gu,"") == message.group.replace(/\p{Emoji}/gu,"")) {
            //console.log("Skipping message because it was too similar:", chat, message);
            return;
        }
    }

    // console.log("add_message_if_not_exists: ", chat)
    displayed_chats.push({...chat, added: Date.now()})
}



const fetch_thread_title = (thread) => {
    try{
        return (
            thread.children[1] // 0 is the icon
            .firstChild
            .children[1] // 0 is the chat name
            .firstChild
            .textContent
            .trim()
        );
    }catch(error){
        return "content failed to load: "+error;
    }
    return "";
}

const fetch_group_name = (thread) => {
    try{
        let thread_group_parent = (thread.children[1].firstChild.children[0]);
        let thread_group_thread = thread_group_parent.querySelector('[data-testid="chat-thread"]');
        return thread_group_parent.textContent
            .replace(/^(Active)/,"")
            .replace(/^(Unread)/,"")
            .replace(/^(, Unread)/,"")
            .replace(/^(, 1 mention)/,"")
            .replace(/^(Do Not Disturb)/,"")
            .replace(/^(Draft: )/,"")
            .replace(/^(,)/,"")
            .trim()
        ;
    }catch(error){
        // console.log("Failed to find group name for message: ", thread.children[1], thread.children[1].textContent, error);
    }
    return "untitled";
}

const fetch_thread_time = (thread) => {
    try{
        // find time
        const parent_li = thread.closest("li")
        const message_time_body = parent_li.children[3].firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild;
        const message_body = message_time_body.textContent;
        return (Date.parse(replaceRelativeDates(message_body)).valueOf())
        //console.log(message_time, message_body)
    }catch(error){
        // NOTE: when a chat is hidden this will find a parent_li but will fail since all the content is empty
        //console.log("Failed to find time", parent_li, error);
    }
    return null;
}

const folder_threads = () => {
    //   console.log("updating threads one sec");

    var threads = document.querySelectorAll('div > a[href^="/chat/t/"]');

    for(let thread of threads){
        let content = fetch_thread_title(thread);
        thread.title = content;

        add_message_if_not_exists({
            //"url": thread.href,
            "text": content,
            "group": fetch_group_name(thread),
            "time": fetch_thread_time(thread)
        });
    }
    //   console.log("updated all threads , going back to sleep: ");
}


const sort_all_messages = () => {
    //console.log("presort", displayed_chats)

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    displayed_chats = displayed_chats
    // remove those from the future
        .filter(chat => chat.time < Date.now())
    // remove older than two days
        .filter(chat => chat.time > twoDaysAgo)
    ;

    displayed_chats.sort(function(a, b) {
        const result = b.time - a.time;
        if(result != 0) return result;
        return b.added - a.added;
    })
    //console.log("post sort", displayed_chats)
}

function replaceRelativeDates(dateString) {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000); // 86400000 is the number of milliseconds in a day
    const replacedString = dateString
    .replace("Today", today.toDateString())
    .replace("Yesterday", yesterday.toDateString())
    .replace("at","");
    return replacedString;
}

const escapeHTMLPolicy = trustedTypes.createPolicy("forceInner", {
    createHTML: (to_escape) => to_escape
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// On startup check to see if we have the messages from a while back
const CACHE_KEY = "displayed_chats2"


// The real one uses eval which fb CSP wont allow...
async function GM_SuperValueGet(key, default_value){
    let data = await GM.getValue( key, default_value );
    if(data.startsWith("json")){
        data = data.slice(10);
    }
    // console.log("get value ", key, default_value, data);
    return JSON.parse(data)
}

async function GM_SuperValueSet(key, data){
    // console.log("set value ", key, data);
    await GM.setValue( key, JSON.stringify(data))
}


let displayed_chats = [];

async function initialize_chat_data () {
    await GM_SuperValueGet(CACHE_KEY, '[]')
    // console.log("loaded chats: ", displayed_chats);
}


async function run(){

await initialize_chat_data();
await setup_popup();

// run everything once for fun
folder_threads();
clear_all_messages();
render_all_messages();


// Collect messages every second
javascript:setInterval(async function(){
    folder_threads();
    await GM_SuperValueSet(CACHE_KEY, displayed_chats)
}, 1000);




// Render every 5
javascript:setInterval(function(){
    try{
        clear_all_messages();
        render_all_messages();
    }catch(error){
        // 50% of the time when you load the page it fails to attach
        // the popup and just makes an empty window
        // if that happens then try to re-open it and see if that works
        popup.close()
        setup_popup();
    }
}, 5000);

}

await run();
console.log("Show Chat on Hover: Loaded complete")








