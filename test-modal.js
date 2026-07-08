const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const path = require("path");

const options = {
  url: "file://" + path.resolve('index.html'),
  runScripts: "dangerously",
  resources: "usable"
};

JSDOM.fromFile("index.html", options).then(dom => {
  dom.window.document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      try {
        const btn = dom.window.document.querySelector('.btn-cta');
        if(btn) {
          console.log("Button found, clicking...");
          btn.click();
          const modal = dom.window.document.getElementById('ticket-modal');
          if (modal) {
            console.log("Modal found. Classes:", modal.className);
          } else {
            console.log("Modal NOT FOUND!");
          }
        } else {
          console.log("Button not found.");
        }
      } catch(e) {
        console.log("Error during click:", e);
      }
    }, 1000);
  });
}).catch(e => console.error(e));
