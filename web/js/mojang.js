import process from "process";

async function getPlayerName(uuid) {
    // Use cors-proxy to make the request.
    const url = encodeURIComponent(`https://api.mojang.com/user/profiles/${uuid}/names`);

    let name = "";
    const response = await fetch(`${process.env.CORS_PROXY_URL}?url=${url}`);
    if (response.ok) {
        const data = JSON.parse(await response.text());
        name = data[0].name;
        let changedToAt = 0;
        for (let i = 0; i !== data.length; i++) {
            if (data[i].hasOwnProperty("changedToAt") && (data[i]['changedToAt'] > changedToAt)) {
                name = data[i].name;
                changedToAt = data[i]['changedToAt'];
            }
        }
    } else {
        throw new Error("Received " + response.status + " from service.");
    }
    return name;
}

export default getPlayerName;