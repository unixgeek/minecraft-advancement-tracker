import titleCase from "ap-style-title-case";

function createTabs(categories) {
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
                    <div class="container is-fluid">
                        <div id="${c}-data"></div>
                    </div>
                </section>`;
    }).join('');
    bodyElement.insertAdjacentHTML("beforeend", sections);
    // Set first section as visible.
    document.querySelector("section").classList.remove("is-hidden");

    document.querySelector(".tabs").addEventListener("click", clickListener);
}

function clickListener(event) {
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
}

export default createTabs;