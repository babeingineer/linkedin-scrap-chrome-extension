function getProfileURL(urn) {
    const parts = urn.split(":");
    const id = parts[parts.length - 1];

    return `https://www.linkedin.com/sales/lead/${id.slice(1, -1)}`;
}
function getPhotoURL(imgObject) {
    if (!imgObject) return "";
    return imgObject.rootUrl + imgObject.artifacts[imgObject.artifacts.length - 1].fileIdentifyingUrlPathSegment;
}


let request;

chrome.webRequest.onBeforeSendHeaders.addListener(details => {
    request = details;
    chrome.runtime.sendMessage("ready");
}, {
    urls: [
        "https://www.linkedin.com/sales-api/salesApiLeadSearch*"
    ]
},
    ["requestHeaders"]);

chrome.runtime.onMessage.addListener((req, sender, respond) => {
    if (req.type == "start") {
        const urlObject = new URL(request.url);
        urlObject.searchParams.set("count", "100");
        headers = {};
        for (const header of request.requestHeaders) {
            headers[header.name] = header.value;
        }
        const TITLE = `"FirstName","LastName","title","company","Location","profile","photo"`;
        const STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida",
            "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",
            "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
            "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
            "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];
        let content = "";
        content += TITLE;
        const promises = [];

        for (let state of STATES) {
            let query = urlObject.searchParams.get("query");
            urlObject.searchParams.set("query", query.replace(/keywords:[^)]+/, `keywords:real estate investor in ${state}`));
            for (let i = 0; i < 25; ++i) {
                urlObject.searchParams.set("start", i * 100);
                console.log(`${decodeURIComponent(urlObject.toString())}`);
                promises.push(
                    fetch(`${decodeURIComponent(urlObject.toString())}`, {
                        method: 'GET',
                        headers
                    }).then(res => res.text()).then(data => {
                        try {
                            data = JSON.parse(data);
                            let block = "";
                            if(data.elements)
                                for (let element of data.elements) {
                                    let row = "";
                                    row += `"${element.firstName}",`;
                                    row += `"${element.lastName}",`;
                                    if (element.currentPositions[0]) {
                                        row += `"${element.currentPositions[0].title}",`;
                                        row += `"${element.currentPositions[0].companyName}",`;
                                    }
                                    else row += `"","",`;
                                    row += `"${element.geoRegion}",`;
                                    row += `"${getProfileURL(element.entityUrn)}",`;
                                    row += `"${getPhotoURL(element.profilePictureDisplayImage)}"`;
                                    chrome.runtime.sendMessage({ type: "increase" });
                                    block += "\n" + row;
                                }
                            return block;
                        }
                        catch(err) {
                            return "";
                        }
                    })
                )
            }
        }

        Promise.all(promises).then(results => {
            for (let block of results) {
                content += block;
            }
            chrome.runtime.sendMessage({ type: "download", content });
        }) 
    }
})