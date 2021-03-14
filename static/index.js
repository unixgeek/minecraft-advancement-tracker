import("../pkg").then(module => {
    const fileInput = document.getElementById("fileInput");
    fileInput.addEventListener("change", handleFile, false);

    function handleFile() {
        console.log(this.files[0]);

        let file = this.files[0];
        file.text().then(text => {
            // console.log(text);

            let missing_advancements = module.get_missing_advancements(text);
            let html = "";
            missing_advancements.forEach(advancement => {
                html += "<p>" + advancement.name + "</p>";
                html += "<ul>";
                advancement.criteria.forEach(criteria => {
                    html += "<li>" + criteria + "</li>";
                });
                html += "</ul>";
            });

            document.getElementById("output").innerHTML = html;
        });
    }
}).catch(console.error);

