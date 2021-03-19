const titleCase = require("ap-style-title-case");

import("../pkg").then(module => {
    const fileInput = document.getElementById("fileInput");
    fileInput.addEventListener("change", handleFile, false);

    function handleFile() {
        console.log(this.files[0]);

        let file = this.files[0];
        file.text().then(text => {
            let missing_advancements = module.get_missing_advancements(text);
            let html = "";
            missing_advancements.forEach(advancement => {
                html += "<h1>" + titleCase(advancement.name.replace("minecraft:", "").replace("/", ": ").replaceAll("_", " ")) + "</h1>";
                html += "<ul>";
                advancement.criteria.forEach(criteria => {
                    html += "<li>" + criteria.replace("minecraft:", "").replaceAll("_", " ") + "</li>";
                });
                html += "</ul>";
            });

            document.getElementById("output").innerHTML = html;
        });
    }
}).catch(console.error);
