document.addEventListener('DOMContentLoaded', function () {
    const sendDataButton = document.getElementById('sendData');
    const cntEl = document.getElementById('cnt');
    let cnt;

    sendDataButton.addEventListener('click', function () {
        chrome.runtime.sendMessage({type: "start"});
        cnt = 0;
    });

    chrome.runtime.onMessage.addListener(async (req, sender, res) => {
        if (req.type == "ready") {
            sendDataButton.disabled = false;
        }
        else if (req.type == "download") {
            const csvContent = req.content;
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'data.csv';
            a.click();
            URL.revokeObjectURL(a.href);
        }
        else if(req.type == "increase") {
            cntEl.innerText = "Downloaded: " + cnt ++;
        }
    });
});
