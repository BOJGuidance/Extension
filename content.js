function getCodeMirrorContent() {
    var codeMirrorLines = document.querySelectorAll('.CodeMirror-code .CodeMirror-line');
    var codeContent = Array.from(codeMirrorLines).map(line => line.innerText.trim()).join('\n');
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
    // 특정 URL 형식일 때만 작동
    const urlPattern = /https:\/\/www\.acmicpc\.net\/submit\/\d+/;
    if (!urlPattern.test(window.location.href)) {
        return;
    }

    // Create a new button element
    var newButton = document.createElement('button');
    newButton.innerText = 'Console Log Content';
    newButton.style.marginLeft = '10px';

    // Add click event to the button
    newButton.addEventListener('click', async function(event) {
        event.stopPropagation(); // Prevent the click event from bubbling up
        event.preventDefault();  // Prevent the default action

        var code = getCodeMirrorContent();
        var username = findUsername();
        var problemId = window.location.href.match(/\d+$/)[0];

        console.log('CodeMirror content:', code);
        console.log('Username:', username);
        console.log('Problem ID:', problemId);

        try {
            await fetch('http://localhost:8000/myapp/data', { // 여기에 실제 백엔드 엔드포인트를 넣어야 합니다.
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ codeContent: code, username: username, problemId: problemId })
            });
            console.log('Data sent to backend successfully');
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Find the submit button and append the new button next to it
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

// 새로운 탭에 열리게 되는 페이지의 URL
const baseUrl = 'https://www.acmicpc.net/source/';

// 상태 테이블에 버튼 추가
function addStatusTableButtons() {
    var table = document.getElementById('status-table');
    if (table) {
        var rows = table.getElementsByTagName('tr');
        for (var i = 1; i < rows.length; i++) { // Start from 1 to skip the header row
            let row = rows[i];
            let submitIdCell = row.getElementsByTagName('td')[0]; // Assuming the first cell has the submit ID
            let submitId = submitIdCell.innerText.trim();

            let buttonCell = row.insertCell(-1); // Insert a cell at the end of the row
            let button = document.createElement('button');
            button.innerText = 'New Button';

            button.addEventListener('click', function(event) {
                event.stopPropagation();
                event.preventDefault();

                let url = `${baseUrl}${submitId}`;
                let newWindow = window.open(url, '_blank');

                if (newWindow) {
                    // Ensure the new window is fully loaded before attempting to access its content
                    setTimeout(function() {
                        newWindow.postMessage('getCodeContent', '*');
                    }, 1000);  // 1초 대기 후 postMessage 전송

                    // Listen for messages from the new window
                    const messageHandler = async function(event) {
                        if (event.origin !== 'https://www.acmicpc.net') return;

                        const { codeContent, username, submitId } = event.data;
                        console.log('CodeMirror content:', codeContent);
                        console.log('Username:', username);
                        console.log('Submit ID:', submitId);

                        try {
                            await fetch('http://localhost:8000/myapp/data', { // 여기에 실제 백엔드 엔드포인트를 넣어야 합니다.
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ codeContent: codeContent, submitId: submitId, username: username })
                            });
                            console.log('Data sent to backend successfully');
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

// Listen for messages in the new window
window.addEventListener('message', function(event) {
    if (event.data === 'getCodeContent') {
        const codeContent = getCodeMirrorContent();
        const username = findUsername();
        const submitId = window.location.href.match(/\d+$/)[0];
        event.source.postMessage({ codeContent, username, submitId }, event.origin);
    }
});

if (window.location.href.match(/https:\/\/www\.acmicpc\.net\/status\?from_mine=1&problem_id=\d+&user_id=\w+/)) {
    setTimeout(function() {
        addStatusTableButtons();
    }, 1000);  // Ensure the DOM is fully loaded
}
