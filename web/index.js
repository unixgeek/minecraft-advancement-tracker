'use strict';

import {getAdvancements, getCategories} from "./js/advancement";
import bulmaCollapsible from '@creativebulma/bulma-collapsible';
import createTabs from "./js/tabs";

createTabs(getCategories().sort());

document.getElementById("file-selector").addEventListener("change", async event => {
    const file = event.target.files[0];

    let advancements;
    try {
        const json = await file.text();
        advancements = getAdvancements(json).filter(advancement => !advancement.name.endsWith("/root"));
    } catch (error) {
        console.error(error);
        displayError("There was an error processing the file.");
        return;
    }

    const sectionHtmlMap = new Map();
    getCategories().forEach(category => {
        const sectionHtml = `
            <div id="${category}-accordion">
                <div class="columns">
                    <div class="column is-one-third">`;
        sectionHtmlMap.set(category, sectionHtml);
    });

    const completed = advancements.reduce((count, advancement) => advancement.done ? count + 1 : count, 0);
    document.getElementById("progress").innerHTML = `${completed} of ${advancements.length} Complete`;

    advancements.sort((a, b) => a.getName() > b.getName() ? 1 : -1);
    advancements.forEach((advancement, i) => {
        // Create complete or incomplete icon.
        let completeOrNotCompleteHtml = "<span class='icon has-text-success'><i class='fas fa-check-square'></i></span>";
        if (!advancement.done) {
            completeOrNotCompleteHtml = "<span class='icon has-text-danger'><i class='fas fa-ban'></i></span>";
        }

        // If there is more than one criterion, make the card expandable.
        const expandCardLinkHtml = advancement.getCriteriaCount() === 1 ? "" : `
                <a href="#collapsible-card-${i}" data-action="collapse" class="card-header-icon is-hidden-fullscreen" aria-label="more options">
                    <span class="icon">
                        <i class="fas fa-angle-down" aria-hidden="true"></i>
                    </span>
                </a>`;

        // If there is more than one criterion, create tags for each to show complete or incomplete.
        const sortedCompletedCriteria = advancement.getCompletedCriteria().sort((a, b) => a.value > b.value ? 1 : -1);
        const sortedNotCompletedCriteria = advancement.getNotCompletedCriteria().sort((a, b) => a.value > b.value ? 1 : -1);
        const cardContentHtml = advancement.getCriteriaCount() === 1 ? "" : `
                <div class="tags">
                   ${sortedCompletedCriteria.map(c => `<span class="tag is-success">${c.getName()}</span>`).join('')}
                </div>
                <div class="tags">
                    ${sortedNotCompletedCriteria.map(c => `<span class="tag is-danger">${c.getName()}</span>`).join('')}
                </div>`;

        // If there is more than one criterion, and the advancement is not complete, show the completed count.
        const percentCompleteHtml = (advancement.getCriteriaCount() === 1 || advancement.done) ? "" :
            `  (${sortedCompletedCriteria.length} of ${advancement.getCriteriaCount()})`;

        const cardHtml = `
                <div class="card">
                    <header class="card-header">
                        <p class="card-header-title">${completeOrNotCompleteHtml}${advancement.getName()}${percentCompleteHtml}</p>
                        ${expandCardLinkHtml}
                    </header>
                    <div id="collapsible-card-${i}" class="is-collapsible">
                        <div class="card-content">${cardContentHtml}</div>
                    </div>
                </div>`;

        sectionHtmlMap.set(advancement.getCategory(), sectionHtmlMap.get(advancement.getCategory()).concat(cardHtml));
    });

    sectionHtmlMap.forEach((html, category) => {
        const endSectionHtml = `
                    </div>
                </div>
            </div>`;
        html.concat(endSectionHtml);
        document.getElementById(`${category}-data`).innerHTML = html;
    });

    bulmaCollapsible.attach();
});

function displayError(message) {
    document.getElementById("notification").innerHTML = `<div class="notification is-danger"><button class="delete"></button>${message}</div>`;
    document.querySelector("#notification > div > button").addEventListener("click", _ => document.getElementById("notification").innerHTML = "");
}
