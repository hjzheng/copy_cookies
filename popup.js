// When the popup Paste Button is clicked
const onCopyButtonClick = () => {
    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            active: true,
        },
        tab => {
            chrome.cookies.getAll({ url: tab[0].url }, cookie => {
                localStorage.setItem('copyCookieData', JSON.stringify(cookie));
                setTimeout(() => handlePopupUI('copy'), 100);
            });
        },
    );
};

const removeOldCookies = (cookies, index, url, callback) => {
    if (!cookies[index]) return callback();

    try {
        chrome.cookies.remove({
            url: url + cookies[index].path,
            name: cookies[index].name,
        }, () => removeOldCookies(cookies, index + 1, url, callback));
    } catch (e) {
        console.error(`There was an error removing the cookies: ${error}`, cookies[index].name);
    }
};

// When the popup Paste Button is clicked
const onPasteButtonClick = async () => {
    let copyCookieData;
    try {
        copyCookieData = localStorage.getItem('copyCookieData')
            ? JSON.parse(localStorage.getItem('copyCookieData'))
            : null;
    } catch (e) {
        return alert('Error parsing cookies. Please try again.');
    }

    if (!copyCookieData)
        return alert('Uh-Oh! You need to copy the cookies first.');

    let domain = document.getElementById('domainInput').value.trim();
    if (!domain) domain = 'localhost';

    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            // active: true,
        },
        tab => {
            const targetTabs = tab.filter(({ url }) => url?.includes(domain));

            if (targetTabs.length === 0) {
                alert(`Can not find the tab with url included '${domain}', please open new tab with url '${domain}'`);
                return false;
            }

            targetTabs.forEach(({ url }) => {
                chrome.cookies.getAll({ url }, cookies => {
                    removeOldCookies(cookies, 0, url, () => {
                        copyCookieData.forEach(({ name, value, path }) => {
                            try {
                                chrome.cookies.set({
                                    url,
                                    name,
                                    value,
                                    path,
                                    domain,
                                });
                            } catch (error) {
                                console.error(`There was an error: ${error}`);
                            }
                        });
                        onResetButtonClick('paste');
                    });
                });
            });
        },
    );
};

// When the popup Reset Button is clicked
const onResetButtonClick = action => {
    localStorage.removeItem('copyCookieData');
    handlePopupUI(action);
};

const handlePopupUI = action => {
    const copyCookieData = localStorage.getItem('copyCookieData');
    const containerElement = document.getElementById('container');
    containerElement.setAttribute('class', '');

    if (copyCookieData) {
        containerElement.classList.add('container2');
    } else {
        containerElement.classList.add('container1');
    }

    const successPasteLabel = document.getElementById('successPasteLabel');
    const welcomeLabel = document.getElementById('welcomeLabel');
    if (action === 'paste') {
        successPasteLabel.setAttribute('style', 'display: block');
    } else {
        successPasteLabel.setAttribute('style', 'display: none');
    }
    if (action === 'copy' || copyCookieData) {
        welcomeLabel.setAttribute('style', 'display: none');
    } else if (action === 'reset') {
        welcomeLabel.setAttribute('style', 'display: block');
    }
};

// When the popup HTML has loaded
window.addEventListener('load', () => {
    handlePopupUI();

    document
        .getElementById('copyButton')
        .addEventListener('click', onCopyButtonClick);
    document
        .getElementById('pasteButton')
        .addEventListener('click', onPasteButtonClick);
    document
        .getElementById('resetButton')
        .addEventListener('click', () => onResetButtonClick('reset'));
});
