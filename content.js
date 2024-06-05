function getCodeMirrorContent() {
    var codeMirrorLines = document.querySelectorAll('.CodeMirror-code .CodeMirror-line');
    var codeContent = Array.from(codeMirrorLines).map(line => line.innerText.replace(/\s+$/, '')).join('\n');
    return codeContent;
}

function findUsername() {
    const el = document.querySelector('a.username');
    if (!el) return null;
    const username = el?.innerText?.trim();
    if (!username) return null;
    return username;
}

function addConsoleButton() {
    const urlPattern = /https:\/\/www\.acmicpc\.net\/submit\/\d+/;
    if (!urlPattern.test(window.location.href)) {
        return;
    }

    var newButton = document.createElement('button');
    newButton.innerText = 'Ai 분석';
    newButton.style.marginLeft = '10px';
    newButton.style.display = 'inline-block';
    newButton.style.width = '100px';
    newButton.style.height = '30px';
    newButton.style.fontSize = '14px';
    newButton.style.textAlign = 'center';
    newButton.style.verticalAlign = 'middle';
    newButton.style.backgroundColor = 'skyblue';
    newButton.style.border = 'none';
    newButton.style.color = 'white';
    newButton.style.cursor = 'pointer';
    newButton.style.borderRadius = '5px';

    newButton.addEventListener('click', async function(event) {
        event.stopPropagation();
        event.preventDefault();

        var code = getCodeMirrorContent();
        var username = findUsername();
        var problemId = window.location.href.match(/\d+$/)[0];

        console.log('CodeMirror content:', code);
        console.log('Username:', username);
        console.log('Problem ID:', problemId);

        try {
            const response = await fetch('http://3.35.115.158:8080/myapp/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ codeContent: code, userName: username, problemId: problemId })
            });
            const result = await response.json();
            const codeAnalysisId = result.id;
            const url = `http://3.35.115.158:8080//codeAnalysis/${codeAnalysisId}`;
            window.open(url, '_blank');
            console.log('Data sent to backend successfully');
        } catch (error) {
            console.error('Error:', error);
        }
    });

    var submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.parentNode.appendChild(newButton);
    } else {
        console.error('Submit button not found');
    }
}

window.onload = function() {
    addConsoleButton();
};

const baseUrl = 'https://www.acmicpc.net/source/';

function addStatusTableButtons() {
    var table = document.getElementById('status-table');
    if (table) {
        var rows = table.getElementsByTagName('tr');
        for (var i = 1; i < rows.length; i++) {
            let row = rows[i];
            let submitIdCell = row.getElementsByTagName('td')[0];
            let submitId = submitIdCell.innerText.trim();

            let buttonCell = row.insertCell(-1);
            let button = document.createElement('button');
            button.innerText = 'Ai 분석';
            button.style.display = 'inline-block';
            button.style.width = '80px';
            button.style.height = '30px';
            button.style.fontSize = '14px';
            button.style.textAlign = 'center';
            button.style.verticalAlign = 'middle';
            button.style.backgroundColor = 'skyblue';
            button.style.border = 'none';
            button.style.color = 'white';
            button.style.cursor = 'pointer';
            button.style.borderRadius = '5px';

            button.addEventListener('click', function(event) {
                event.stopPropagation();
                event.preventDefault();

                let url = `${baseUrl}${submitId}`;
                let newWindow = window.open(url, '_blank');

                if (newWindow) {
                    setTimeout(function() {
                        newWindow.postMessage('getCodeContent', '*');
                    }, 1000);

                    const messageHandler = async function(event) {
                        if (event.origin !== 'https://www.acmicpc.net') return;

                        const { codeContent, userName, submitId, problemId, problemTitle, result, memory, time, language, codeLength } = event.data;
                        console.log('CodeMirror content:', codeContent);
                        console.log('Username:', userName);
                        console.log('Submit ID:', submitId);
                        console.log('Problem ID:', problemId);
                        console.log('Problem Title:', problemTitle);
                        console.log('Result:', result);
                        console.log('Memory:', memory);
                        console.log('Time:', time);
                        console.log('Language:', language);
                        console.log('Code Length:', codeLength);

                        try {
                            const response = await fetch('http://3.35.115.158:8080/myapp/data', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ codeContent, submitId, userName, problemId, problemTitle, result, memory, time, language, codeLength })
                            });
                            const resultData = await response.json();
                            const codeAnalysisId = resultData.id;
                            const url = `http://3.35.115.158:8080/codeAnalysis/${codeAnalysisId}`;
                            window.location.href = url;
                            newWindow.close();
                        } catch (error) {
                            console.error('Error:', error);
                        } finally {
                            window.removeEventListener('message', messageHandler);
                        }
                    };

                    window.addEventListener('message', messageHandler);
                } else {
                    console.error('Pop-up blocked or failed to open.');
                }
            });

            buttonCell.appendChild(button);
        }
    } else {
        console.error('Status table not found');
    }
}

window.addEventListener('message', function(event) {
    if (event.data === 'getCodeContent') {
        const codeContent = getCodeMirrorContent();
        const submitId = window.location.href.match(/\d+$/)[0];
        const tableRow = document.querySelector('.table-responsive tbody tr');
        const userName = tableRow.children[1].innerText.trim();
        const problemId = tableRow.children[2].innerText.trim();
        const problemTitle = tableRow.children[3].innerText.trim();
        const result = tableRow.children[4].innerText.trim();
        const memory = tableRow.children[5].innerText.trim();
        const time = tableRow.children[6].innerText.trim();
        const language = tableRow.children[7].innerText.trim();
        const codeLength = tableRow.children[8].innerText.trim();
        event.source.postMessage({ codeContent, userName, submitId, problemId, problemTitle, result, memory, time, language, codeLength }, event.origin);
    }
});

const statusUrlPattern = /https:\/\/www\.acmicpc\.net\/status\?from_mine=1&problem_id=\d+&user_id=\w+|https:\/\/www\.acmicpc\.net\/status\?user_id=\w+&problem_id=\d+&from_mine=1/;

if (statusUrlPattern.test(window.location.href)) {
    setTimeout(function() {
        addStatusTableButtons();
    }, 1000);
}
