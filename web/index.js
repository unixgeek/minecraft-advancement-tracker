'use strict';

import titleCase from "ap-style-title-case";
import {get_advancement_namespace_prefixes, get_advancements} from "../crate/Cargo.toml";
import bulmaCollapsible from '@creativebulma/bulma-collapsible';
import process from "process";

{
    const categories = get_advancement_namespace_prefixes().map(namespace => namespace.substring(namespace.indexOf(":") + 1)).sort();
    const bodyElement = document.querySelector("body");

    // Create navigation tabs based on the categories.
    const tabs = `
        <div class="tabs is-boxed">
            <ul>
                ${categories.map(c => `<li data-tab="${c}"><a>${titleCase(c)}</a></li>`).join('')}
            </ul>
        </div>`;
    bodyElement.insertAdjacentHTML("beforeend", tabs);
    // Set first tab as active.
    document.querySelector("div.tabs > ul > li").classList.add("is-active");

    // Create the sections based on the categories.
    const sections = categories.map(c => {
        return `<section data-page="${c}" class="section is-medium py-0 is-hidden">
                    <div class="container">
                        <div id="${c}-data"></div>
                    </div>
                </section>`;
    }).join('');
    bodyElement.insertAdjacentHTML("beforeend", sections);
    // Set first section as visible.
    document.querySelector("section").classList.remove("is-hidden");
}

document.querySelector(".tabs").addEventListener("click", event => {
    const clickedTab = event.target.closest("li");

    if (!clickedTab) {
        return;
    }

    // Make all tabs inactive.
    document.querySelectorAll("div.tabs > ul > li").forEach(element => {
        element.classList.remove("is-active");
    });
    // Hide all pages.
    document.querySelectorAll(".section").forEach(element => {
        element.classList.add("is-hidden");
    });

    // Set the clicked tab as active and unhide the associated page.
    clickedTab.classList.add("is-active");
    document.querySelector(`[data-page=${clickedTab.dataset.tab}]`).classList.remove("is-hidden");
});

document.getElementById("file-selector").addEventListener("change", async event => {
    const file = event.target.files[0];

    let advancements;
    try {
        const text = await file.text();
        advancements = get_advancements(text);
    } catch (error) {
        console.error(error);
        displayError("There was an error processing the file.");
        return;
    }

    // Update player name from Mojang API.
    document.getElementById("player-name").innerText = "";
    const nameUpdate = (async () => {
        // Get the player's UUID from the file name.
        const uuid = file.name.substring(0, file.name.indexOf("."));

        // Use cors-proxy to make the request.
        const url = encodeURIComponent(`https://api.mojang.com/user/profiles/${uuid}/names`);
        try {
            const response = await fetch(`${process.env.CORS_PROXY_URL}?url=${url}`);
            if (response.ok) {
                const data = JSON.parse(await response.text());
                let playerName = data[0].name;
                let changedToAt = 0;
                for (let i = 0; i !== data.length; i++) {
                    if (data[i].hasOwnProperty("changedToAt") && (data[i]['changedToAt'] > changedToAt)) {
                        playerName = data[i].name;
                        changedToAt = data[i]['changedToAt'];
                    }
                }
                document.getElementById("player-name").innerText = playerName;
            } else {
                console.error("Received " + response.statusText + " from service.");
                displayError("There was an error looking up player name.");
            }
        } catch (error) {
            console.error(error);
            displayError("There was an error looking up player name.");
        }
    })();

    const sectionHtmlMap = new Map();
    get_advancement_namespace_prefixes().forEach(namespace => {
        const category = namespace.substring(namespace.indexOf(":") + 1);

        const sectionHtml = `<div id="${category}-accordion">`;
        sectionHtmlMap.set(category, sectionHtml);
    });

    const completed = advancements.reduce((count, advancement) => advancement.done ? count + 1 : count, 0);
    document.getElementById("progress").innerHTML = `${completed} / ${advancements.length}`;

    advancements.forEach((advancement, i) => {
        const category = advancement.name.substring(advancement.name.indexOf(":") + 1, advancement.name.indexOf("/"));
        const normalizedName = titleCase(advancement.name.substring(advancement.name.indexOf("/") + 1).replaceAll("_", " "));
        const completedCriteria = advancement['criteria'].filter(criterion => criterion.done);
        const notCompletedCriteria = advancement['criteria'].filter(criterion => !criterion.done);
        const criteriaCount = advancement['criteria'].length;

        let completeOrNotComplete = "<span class='icon has-text-success'><i class='fas fa-check-square'></i></span>";
        if (!advancement.done) {
            completeOrNotComplete = "<span class='icon has-text-danger'><i class='fas fa-ban'></i></span>";
        }

        const expandCardLinkHtml = criteriaCount === 1 ? "" : `
                <a href="#collapsible-card-${i}" data-action="collapse" class="card-header-icon is-hidden-fullscreen" aria-label="more options">
                    <span class="icon">
                        <i class="fas fa-angle-down" aria-hidden="true"></i>
                    </span>
                </a>`;

        const cardContentHtml = criteriaCount === 1 ? "" : `
                <div class="tags">
                   ${completedCriteria.map(c => `<span class="tag is-success">${titleCase(c.value.substring(c.value.indexOf(":") + 1).replaceAll("_", " "))}</span>`).join('')}
                </div>
                <div class="tags">
                    ${notCompletedCriteria.map(c => `<span class="tag is-danger">${titleCase(c.value.substring(c.value.indexOf(":") + 1).replaceAll("_", " "))}</span>`).join('')}
                </div>`;

        const cardHtml = `
                <div class="card">
                    <header class="card-header">
                        <p class="card-header-title">${completeOrNotComplete}${normalizedName}</p>
                        ${expandCardLinkHtml}
                    </header>
                    <div id="collapsible-card-${i}" class="is-collapsible">
                        <div class="card-content">${cardContentHtml}</div>
                    </div>
                </div>`;

        sectionHtmlMap.set(category, sectionHtmlMap.get(category).concat(cardHtml));
    });

    sectionHtmlMap.forEach((html, category) => {
        document.getElementById(`${category}-data`).innerHTML = html;
    });

    bulmaCollapsible.attach();

    await nameUpdate;

});

function displayError(message) {
    document.getElementById("notification").innerHTML = `<div class="notification is-danger"><button class="delete"></button>${message}</div>`;
    document.querySelector("#notification > div > button").addEventListener("click", _ => document.getElementById("notification").innerHTML = "");
}